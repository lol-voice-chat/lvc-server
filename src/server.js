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

  socket.on('create-transport', async ({ remoteProducerId }, callback) => {
    const peer = Peer.findBySocketId(socket.id);
    const { router } = Room.findByName(peer.roomName);
    const transport = await createWebRtcTransport(router);
    peer.addTransport(transport, remoteProducerId);

    if (!remoteProducerId) {
      console.log(`${peer.details.displayName}님 producer transport가 생성되었습니다.`);
    } else {
      console.log(`${peer.details.displayName}님 consumer transport가 생성되었습니다.`);
    }

    callback({
      params: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      },
    });
  });

  const createWebRtcTransport = async (router) => {
    try {
      const webRtcTransportOptions = {
        listenIps: [
          {
            ip: '10.150.150.48',
            announcedIp: null,
          },
        ],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
      };

      const transport = await router.createWebRtcTransport(webRtcTransportOptions);

      transport.on('dtlsstatechange', (dtlsState) => {
        if (dtlsState === 'closed') {
          transport.close();
        }
      });

      transport.on('close', () => {
        console.log('transport 닫힘');
      });

      return transport;
    } catch (err) {
      console.error(`transport 생성중 오류가 발생했습니다. : ${err}`);
    }
  };

  socket.on('transport-connect', async ({ dtlsParameters }) => {
    const peer = Peer.findBySocketId(socket.id);
    const trnasport = peer.findProducerTransport();

    trnasport.connect({ dtlsParameters });
    console.log(`${peer.details.displayName}님 producer transport가 연결되었습니다.`);
  });

  socket.on('transport-produce', async ({ kind, rtpParameters }, callback) => {
    const peer = Peer.findBySocketId(socket.id);
    const room = Room.findByName(peer.roomName);
    const trnasport = peer.findProducerTransport();

    const producer = await trnasport.produce({ kind, rtpParameters });
    peer.addProducer(producer);
    informProducersAboutNewProducer(peer, producer.id);
    console.log(`${peer.details.displayName}님 producer가 생성되었습니다.`);

    producer.on('transportclose', () => {
      console.log('transport 연결 끊어짐');
      producer.close();
    });

    callback({
      id: producer.id,
      producersExist: room.peers.length > 1,
    });
  });

  const informProducersAboutNewProducer = (peer, producerId) => {
    console.log('새로들어온애임: ', peer.details.displayName);

    socket.to(peer.roomName).emit('new-producer', {
      id: producerId,
      summonerId: peer.details.summonerId,
      displayName: peer.details.displayName,
      profileImage: peer.details.profileImage,
    });
  };

  socket.on('get-producers', (callback) => {
    const { roomName } = Peer.findBySocketId(socket.id);
    const room = Room.findByName(roomName);
    const producers = room
      .getOtherPeers(socket.id)
      .filter((peer) => peer.producerTransport !== null)
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

        consumer.on('transportclose', () => {
          console.log('transport 연결끊김');
        });

        consumer.on('producerclose', () => {
          console.log(`producer가 연결을 끊음`);
          socket.emit('producer-closed', { remoteProducerId });

          transport.close([]);
          consumer.close();
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
    const consumer = peer.findConsumer(remoteConsumerId);

    await consumer.resume();
    console.log(`${peer.details.displayName}님 consum resume됨`);
  });

  socket.on('game-loading', async () => {
    const peer = Peer.findBySocketId(socket.id);
    await peer.pauseAllConsumers();
  });

  socket.on('exit-champ-select', () => {
    const peer = Peer.findBySocketId(socket.id);
    let roomName;

    if (peer) {
      roomName = peer.roomName;
      const room = Room.findByName(roomName);

      if (room) {
        room.peers.forEach((peer) => {
          peer.disconnectVoice();
          console.log(`${peer.details.displayName}님이 방을 떠났습니다.`);

          Peer.delete(socket.id);
        });

        Room.delete(roomName);
      }
    }
  });

  socket.on('disconnect', () => {
    socket.emit('leave-room');
    const peer = Peer.findBySocketId(socket.id);
    let roomName;

    if (peer) {
      roomName = peer.roomName;
      const room = Room.findByName(roomName);

      if (room) {
        room.peers.forEach((peer) => {
          peer.disconnectVoice();
          console.log(`${peer.details.displayName}님이 방을 떠났습니다.`);

          Peer.delete(socket.id);
        });

        Room.delete(roomName);
      }
    }
  });
});
