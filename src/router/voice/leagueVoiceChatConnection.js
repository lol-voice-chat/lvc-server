import { Room, Peer } from '../../models/index.js';
import * as worker from '../../lib/worker.js';
import dotenv from 'dotenv';

dotenv.config();
const LISTENIP = process.env.LISTENIP;

export default (io, socket) => {
  console.log('전체방 소켓연결성공');

  socket.on('league-join-room', async ({ roomName, teamName, summoner }, callback) => {
    socket.join(roomName);
    socket.roomName = roomName;

    const room = await getRoomOrCreate(roomName);
    const peer = new Peer(socket.id, summoner, teamName);
    room.addPeer(peer);

    let enemyRoomName = '';
    if (roomName.slice(0, teamName.length) === teamName) {
      enemyRoomName = roomName.slice(teamName.length, roomName.length);
    } else {
      for (let i = 0; i < roomName.length - teamName.length; i++) {
        enemyRoomName += roomName[i];
      }
    }

    const enemyRoom = Room.findByName(enemyRoomName);
    let leagueTitleList = enemyRoom
      .getPeerLeagueTitleList()
      .concat(room.getPeerLeagueTitleList());
    //
    if (leagueTitleList.filter((leagueTitle) => leagueTitle !== null).length === 0) {
      leagueTitleList = null;
    }

    const rtpCapabilities = room.router.rtpCapabilities;
    callback({ rtpCapabilities, leagueTitleList });
    console.log(`${summoner.name} 전체방 입장`);
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
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      });

      console.log(`${peer.details.name} producer transport 생성`);
    });
  });

  socket.on('create-consumer-transport', async (remoteProducerId) => {
    const room = Room.findByName(socket.roomName);
    const peer = room.findPeerBySocketId(socket.id);
    createWebRtcTransport(room.router).then((transport) => {
      peer.addConsumerTransport(transport, remoteProducerId);

      socket.emit('complete-create-consumer-transport', {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      });

      console.log(`${peer.details.name} consumer transport 생성`);
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

  socket.on('transport-connect', async (dtlsParameters) => {
    const room = Room.findByName(socket.roomName);
    const peer = room.findPeerBySocketId(socket.id);
    const trnasport = peer.findProducerTransport();

    trnasport.connect({ dtlsParameters });
    console.log(`${peer.details.name} producer transport 연결`);
  });

  socket.on('transport-produce', async ({ kind, rtpParameters }, callback) => {
    const room = Room.findByName(socket.roomName);
    const peer = room.findPeerBySocketId(socket.id);
    const trnasport = peer.findProducerTransport();

    const producer = await trnasport.produce({ kind, rtpParameters });
    console.log(`${peer.details.name} producer가 생성`);

    informNewProducer(room, peer, producer.id);
    peer.addProducer(producer);
    const otherPeers = room.getOtherPeerList(peer.socketId);

    callback({
      id: producer.id,
      producersExist: otherPeers.length > 0,
    });
  });

  function informNewProducer(room, me, producerId) {
    room
      .getOtherPeerList(me.socketId)
      .filter((peer) => peer.teamName !== me.teamName)
      .forEach((peer) => {
        io.to(peer.socketId).emit('new-producer', {
          id: producerId,
          summoner: me.details,
        });
      });

    console.log(`${me.details.name} 새롭게 입장했다고 알림`);
  }

  socket.on('get-producers', (callback) => {
    const room = Room.findByName(socket.roomName);
    const me = room.findPeerBySocketId(socket.id);
    const producers = room
      .getOtherPeerList(socket.id)
      .filter((peer) => peer.teamName !== me.teamName)
      .map((peer) => {
        return {
          id: peer.producer.id,
          summoner: peer.details,
        };
      });

    callback(producers);
    console.log(`새롭게 들어온 ${me.details.name}한테 기존애있던애들 정보 전달`);
  });

  socket.on('transport-recv-connect', async ({ dtlsParameters, remoteProducerId }) => {
    const room = Room.findByName(socket.roomName);
    const peer = room.findPeerBySocketId(socket.id);
    const transport = peer.findConsumerTransport(remoteProducerId);

    transport.connect({ dtlsParameters });
    console.log(`${peer.details.name}님consumer transport 연결`);
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
      console.log(`${peer.details.name} consumer 생성`);

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

  socket.on('consumer-resume', async (remoteProducerId) => {
    const room = Room.findByName(socket.roomName);
    const peer = room.findPeerBySocketId(socket.id);
    const consumer = peer.findConsumer(remoteProducerId);

    await consumer.resume();
    console.log(`${peer.details.name} consum resume`);
  });

  socket.on('start-in-game', () => {
    const room = Room.findByName(socket.roomName);

    if (room) {
      Array.from(room.peers.values()).forEach((peer) => {
        socket.leave(socket.roomName);
        peer.disconnectVoice();
        console.log(`${peer.details.name} 전체방 나감`);
      });

      Room.delete(socket.roomName);
    }
  });

  socket.on('disconnect', () => {
    const room = Room.findByName(socket.roomName);

    if (room) {
      const disconnectedPeer = room.findPeerBySocketId(socket.id);

      socket
        .to(socket.roomName)
        .emit('inform-exit-in-game', { summonerId: disconnectedPeer.details.summonerId });

      Array.from(room.peers.values())
        .filter((peer) => peer.socketId !== socket.id)
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

      socket.leave(socket.roomName);
      disconnectedPeer.disconnectVoice();
      room.deletePeer(socket.id);
      console.log(`${disconnectedPeer.details.name} 전체방 나감`);
    }
  });
};
