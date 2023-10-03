class Peer {
  socketId;
  details;
  producerTransport;
  consumerTransports;
  producer;
  consumers;
  teamName;

  constructor(socketId, summoner, teamName = null) {
    this.socketId = socketId;
    this.details = summoner;
    this.producerTransport = null;
    this.consumerTransports = new Map();
    this.producer = null;
    this.consumers = new Map();
    this.teamName = teamName;
  }

  addProducerTransport(transport) {
    this.producerTransport = transport;
  }

  addConsumerTransport(transport, remoteProducerId) {
    this.consumerTransports.set(remoteProducerId, transport);
  }

  findProducerTransport() {
    return this.producerTransport;
  }

  findConsumerTransport(remoteProducerId) {
    return this.consumerTransports.get(remoteProducerId);
  }

  addProducer(producer) {
    this.producer = producer;
  }

  addConsumer(consumer, remoteProducerId) {
    this.consumers.set(remoteProducerId, consumer);
  }

  findConsumer(remoteProducerId) {
    return this.consumers.get(remoteProducerId);
  }

  disconnectVoice() {
    this.producer?.close();
    this.producerTransport?.close();

    if (this.consumers.size > 0) {
      Array.from(this.consumers.values()).forEach((consumer) => {
        consumer.close();
      });
    }

    if (this.consumerTransports.size > 0) {
      Array.from(this.consumerTransports.values()).forEach((transport) => {
        transport.close();
      });
    }
  }
}

export default Peer;
