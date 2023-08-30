class Peer {
  static peers = new Map();

  socket;
  details;
  roomName;
  producerTransport;
  consumerTransports;
  producer;
  consumers;

  constructor(socket, summonerId, displayName, profileImage, roomName) {
    this.socket = socket;
    this.details = {
      summonerId,
      displayName,
      profileImage,
    };
    this.roomName = roomName;
    this.producerTransport = null;
    this.consumerTransports = new Map();
    this.producer = null;
    this.consumers = [];
  }

  addProducerTransport(transport) {
    this.producerTransport = transport;
  }

  addConsumerTransport(transport) {
    this.consumerTransports.set(transport.id, transport);
  }

  findProducerTransport() {
    return this.producerTransport;
  }

  findConsumerTransport(serverConsumerTransportId) {
    return this.consumerTransports.get(serverConsumerTransportId);
  }

  addProducer(producer) {
    this.producer = producer;
  }

  addConsumer(consumer) {
    this.consumers[consumer.id] = {
      consumer,
    };
  }

  findConsumer(remoteConsumerId) {
    return this.consumers[remoteConsumerId];
  }

  async pauseAllConsumers() {
    for (let i = 0; i < this.consumers; i++) {
      await this.consumers[i].pause();
    }
  }

  disconnectVoice() {
    this.socket.leave(this.roomName);
    this.producer?.close();
    this.producerTransport?.close();

    if (this.consumers.length > 0) {
      this.consumers.forEach((consumer) => {
        consumer.close();
      });
    }

    if (this.consumerTransports.length > 0) {
      this.consumerTransports.forEach((transport) => {
        transport.close();
      });
    }
  }
}

Peer.save = (socketId, peer) => {
  Peer.peers.set(socketId, peer);
};

Peer.findBySocketId = (socketId) => {
  return Peer.peers.get(socketId);
};

Peer.getHasProducerPeerList = () => {
  return Array.from(Peer.peers.values()).filter((peer) => peer.producer);
};

Peer.getOtherPeerList = (socketId) => {
  return Array.from(Peer.peers.values()).filter((peer) => peer.socket.id !== socketId);
};

Peer.delete = (socketId) => {
  Peer.peers.delete(socketId);
};

export default Peer;
