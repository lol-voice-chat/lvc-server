import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import Room from './models/Room.js';
import Peer from './models/Peer.js';
import * as worker from './lib/worker.js';

const app = express();
app.use(express.json());
app.use(cors());

const server = http.createServer(app);

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`starting ${PORT}`);
});

await worker.createWorker();

const socketCors = {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
};

const listenIp = '10.150.150.48';
const io = new Server(server, socketCors);
const leagueConnection = io.of('/voice-chat');

leagueConnection.on('connection', (socket) => {
  console.log('소켓연결성공');

  socket.on('join-room', async ({ roomName, summoner }, callback) => {
    const { summonerId, displayName, profileImage } = summoner;
    socket.join(roomName);

    const room = await getRoomOrCreate(roomName);
    const peer = new Peer(socket, summonerId, displayName, profileImage, roomName);
    Peer.save(socket.id, peer);
    room.addPeer(peer);

    const rtpCapabilities = room.router.rtpCapabilities;
    console.log(`${displayName} 방 입장`);

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
    const peer = Peer.findBySocketId(socket.id);
    const { router } = Room.findByName(peer.roomName);
    createWebRtcTransport(router).then((transport) => {
      peer.addProducerTransport(transport);

      callback({
        params: {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        },
      });

      console.log(`${peer.details.displayName}님 producer transport가 생성되었습니다.`);
    });
  });

  socket.on('create-consumer-transport', async () => {
    const peer = Peer.findBySocketId(socket.id);
    const { router } = Room.findByName(peer.roomName);
    createWebRtcTransport(router).then((transport) => {
      peer.addConsumerTransport(transport);

      socket.emit('complete-create-consumer-transport', {
        params: {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        },
      });

      console.log(`${peer.details.displayName}님 consumer transport가 생성되었습니다.`);
    });
  });

  function createWebRtcTransport(router) {
    const webRtcTransportOptions = {
      listenIps: [
        {
          ip: listenIp,
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
    const peer = Peer.findBySocketId(socket.id);
    const trnasport = peer.findProducerTransport();

    trnasport.connect({ dtlsParameters });
    console.log(`${peer.details.displayName}님 producer transport가 연결되었습니다.`);
  });

  socket.on('transport-produce', async ({ kind, rtpParameters }, callback) => {
    const peer = Peer.findBySocketId(socket.id);
    const trnasport = peer.findProducerTransport();

    const producer = await trnasport.produce({ kind, rtpParameters });
    console.log(`${peer.details.displayName}님 producer가 생성되었습니다.`);

    informProducersAboutNewProducer(peer, producer.id);
    peer.addProducer(producer);
    const room = Room.findByName(peer.roomName);
    const otherPeers = room.peers.filter((peer) => peer.producer);

    callback({
      id: producer.id,
      producersExist: otherPeers.length > 1,
    });
  });

  function informProducersAboutNewProducer(myPeer, producerId) {
    const room = Room.findByName(myPeer.roomName);
    room
      .getOtherPeerList(myPeer.socket.id)
      .filter((peer) => peer.producer)
      .forEach((peer) => {
        console.log(`새로운친구 ${myPeer.details.displayName} 전달`);
        peer.socket.emit('new-producer', {
          id: producerId,
          summonerId: myPeer.details.summonerId,
          displayName: myPeer.details.displayName,
          profileImage: myPeer.details.profileImage,
        });
      });
  }

  socket.on('get-producers', (callback) => {
    const peer = Peer.findBySocketId(socket.id);
    const room = Room.findByName(peer.roomName);

    const producers = room
      .getOtherPeerList(socket.id)
      .filter((peer) => peer.producer)
      .map((peer) => {
        const response = {
          id: peer.producer.id,
          summonerId: peer.details.summonerId,
          displayName: peer.details.displayName,
          profileImage: peer.details.profileImage,
        };
        return response;
      });
    console.log('기존애있던애들 전달');

    callback(producers);
  });

  socket.on('transport-recv-connect', async ({ dtlsParameters, remoteConsumerId }) => {
    const peer = Peer.findBySocketId(socket.id);
    const transport = peer.findConsumerTransport(remoteConsumerId);

    transport.connect({ dtlsParameters });
    console.log(`${peer.details.displayName}님 consumer transport 연결성공`);
  });

  socket.on(
    'consume',
    async ({ rtpCapabilities, remoteProducerId, remoteConsumerId }, callback) => {
      const peer = Peer.findBySocketId(socket.id);
      const { router } = Room.findByName(peer.roomName);
      const transport = peer.findConsumerTransport(remoteConsumerId);

      if (router.canConsume({ producerId: remoteProducerId, rtpCapabilities })) {
        const consumer = await transport.consume({
          producerId: remoteProducerId,
          rtpCapabilities,
          paused: true,
        });

        peer.addConsumer(consumer, remoteProducerId);
        console.log(`${peer.details.displayName}님 consumer 생성`);

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
    },
  );

  socket.on('consumer-resume', async ({ remoteConsumerId }) => {
    const peer = Peer.findBySocketId(socket.id);
    const { consumer } = peer.findConsumer(remoteConsumerId);

    await consumer.resume();
    console.log(`${peer.details.displayName}님 consum resume됨`);
  });

  // socket.on('game-loading', async () => {
  //   const peer = Peer.findBySocketId(socket.id);
  //   await peer.pauseAllConsumers();
  // });

  socket.on('disconnect', () => {
    const peer = Peer.findBySocketId(socket.id);

    if (peer) {
      socket.to(peer.roomName).emit('producer-closed', { remoteProducerId: peer.producer.id });

      const room = Room.findByName(peer.roomName);
      if (room) {
        Room.delete(peer.roomName);
      }

      peer.disconnectVoice();
      console.log(`${peer.details.displayName}님이 방을 떠났습니다.`);
      Peer.delete(socket.id);
    }
  });
});
