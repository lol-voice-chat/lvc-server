import { Room, Peer } from '../../models/index.js';
import * as worker from '../../lib/worker.js';
import dotenv from 'dotenv';

dotenv.config();
const LISTENIP = process.env.LISTENIP;

export default (socket) => {
  console.log('전체방 소켓연결성공');

  socket.on('league-join-room', async ({ roomName, teamName, summoner }, callback) => {
    const { summonerId, displayName, profileImage } = summoner;
    socket.join(roomName);
    socket.roomName = roomName;

    const room = await getRoomOrCreate(roomName);
    const peer = new Peer(socket, summonerId, displayName, profileImage, teamName);
    room.addPeer(peer);

    const rtpCapabilities = room.router.rtpCapabilities;
    console.log(`${displayName} 전체방 입장`);

    callback({ rtpCapabilities });
  });

  async function getRoomOrCreate(roomName) {
    const room = Room.findByName(roomName);

    if (!room) {
      const router = await worker.createRouter();
      const generatedRoom = new Room(router);
      Room.save(roomName, generatedRoom);

      return generatedRoom;
    }

    return room;
  }

  socket.on('create-producer-transport', async (callback) => {
    const room = Room.findByName(socket.roomName);
    const peer = room.findPeerBySocketId(socket.id);
    createWebRtcTransport(room.router).then((transport) => {
      peer.addProducerTransport(transport);

      callback({
        params: {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        },
      });

      console.log(
        `${peer.details.summoner.displayName}님 producer transport가 생성되었습니다.`,
      );
    });
  });

  socket.on('create-consumer-transport', async ({ remoteProducerId }) => {
    const room = Room.findByName(socket.roomName);
    const peer = room.findPeerBySocketId(socket.id);
    createWebRtcTransport(room.router).then((transport) => {
      peer.addConsumerTransport(transport, remoteProducerId);

      socket.emit('complete-create-consumer-transport', {
        params: {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        },
      });

      console.log(
        `${peer.details.summoner.displayName}님 consumer transport가 생성되었습니다.`,
      );
    });
  });

  function createWebRtcTransport(router) {
    const webRtcTransportOptions = {
      listenIps: [
        {
          ip: LISTENIP,
          announcedIp: null,
        },
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
    };

    return new Promise(async (resolve, reject) => {
      try {
        const transport = await router.createWebRtcTransport(webRtcTransportOptions);
        resolve(transport);
      } catch (error) {
        reject(error);
      }
    });
  }

  socket.on('transport-connect', async ({ dtlsParameters }) => {
    const room = Room.findByName(socket.roomName);
    const peer = room.findPeerBySocketId(socket.id);
    const trnasport = peer.findProducerTransport();

    trnasport.connect({ dtlsParameters });
    console.log(
      `${peer.details.summoner.displayName}님 producer transport가 연결되었습니다.`,
    );
  });

  socket.on('transport-produce', async ({ kind, rtpParameters }, callback) => {
    const room = Room.findByName(socket.roomName);
    const peer = room.findPeerBySocketId(socket.id);
    const trnasport = peer.findProducerTransport();

    const producer = await trnasport.produce({ kind, rtpParameters });
    console.log(`${peer.details.summoner.displayName}님 producer가 생성되었습니다.`);

    informProducersAboutNewProducer(room, peer, producer.id);
    peer.addProducer(producer);
    const otherPeers = room.getOtherPeerList(peer.socket.id);

    callback({
      id: producer.id,
      producersExist: otherPeers.length > 0,
    });
  });

  function informProducersAboutNewProducer(room, myPeer, producerId) {
    room
      .getOtherPeerList(myPeer.socket.id)
      .filter((peer) => peer.teamName !== myPeer.teamName)
      .forEach((peer) => {
        console.log(`새로운친구 ${myPeer.details.summoner.displayName} 전달`);
        peer.socket.emit('new-producer', {
          id: producerId,
          summonerId: myPeer.details.summonerId,
          displayName: myPeer.details.displayName,
          profileImage: myPeer.details.profileImage,
        });
      });
  }

  socket.on('get-producers', (callback) => {
    const room = Room.findByName(socket.roomName);
    const myPeer = room.findPeerBySocketId(socket.id);
    const producers = room
      .getOtherPeerList(socket.id)
      .filter((peer) => peer.teamName !== myPeer.teamName)
      .map((peer) => {
        return {
          id: peer.producer.id,
          summonerId: peer.details.summonerId,
          displayName: peer.details.displayName,
          profileImage: peer.details.profileImage,
        };
      });
    console.log('기존애있던애들 전달');

    callback(producers);
  });

  socket.on('transport-recv-connect', async ({ dtlsParameters, remoteProducerId }) => {
    const room = Room.findByName(socket.roomName);
    const peer = room.findPeerBySocketId(socket.id);
    const transport = peer.findConsumerTransport(remoteProducerId);

    transport.connect({ dtlsParameters });
    console.log(`${peer.details.summoner.displayName}님 consumer transport 연결성공`);
  });

  socket.on('consume', async ({ rtpCapabilities, remoteProducerId }, callback) => {
    const room = Room.findByName(socket.roomName);
    const peer = room.findPeerBySocketId(socket.id);
    const transport = peer.findConsumerTransport(remoteProducerId);

    if (room.router.canConsume({ producerId: remoteProducerId, rtpCapabilities })) {
      const consumer = await transport.consume({
        producerId: remoteProducerId,
        rtpCapabilities,
        paused: true,
      });

      peer.addConsumer(consumer, remoteProducerId);
      console.log(`${peer.details.summoner.displayName}님 consumer 생성`);

      callback({
        params: {
          id: consumer.id,
          producerId: remoteProducerId,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
          serverConsumerId: consumer.id,
        },
      });
    }
  });

  socket.on('consumer-resume', async ({ remoteProducerId }) => {
    const room = Room.findByName(socket.roomName);
    const peer = room.findPeerBySocketId(socket.id);
    const consumer = peer.findConsumer(remoteProducerId);

    await consumer.resume();
    console.log(`${peer.details.summoner.displayName}님 consum resume됨`);
  });

  socket.on('start-in-game', () => {
    const room = Room.findByName(socket.roomName);
    if (!room) return;

    Array.from(room.peers.values()).forEach((peer) => {
      peer.disconnectVoice();
      console.log(`${peer.details.summoner.displayName}님이 전체방을 떠났습니다.`);
    });

    Room.delete(socket.roomName);
  });

  socket.on('disconnect', () => {
    const room = Room.findByName(socket.roomName);
    if (!room) return;

    const disconnectedPeer = room.findPeerBySocketId(socket.id);

    socket
      .to(socket.roomName)
      .emit('inform-exit-in-game', { summonerId: disconnectedPeer.details.summonerId });

    Array.from(room.peers.values())
      .filter((peer) => peer.socket.id !== socket.id)
      .forEach((peer) => {
        const consumer = peer.consumers.get(disconnectedPeer.producer.id);
        consumer.close();
        peer.consumers.delete(disconnectedPeer.producer.id);

        const consumerTransport = peer.consumerTransports.get(
          disconnectedPeer.producer.id,
        );
        consumerTransport.close();
        peer.consumerTransports.delete(disconnectedPeer.producer.id);
      });

    disconnectedPeer.disconnectVoice();
    room.deletePeer(socket.id);
    console.log(
      `${disconnectedPeer.details.summoner.displayName}님이 전체방을 떠났습니다.`,
    );
  });
};
