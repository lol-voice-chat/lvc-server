class Room {
  static rooms = new Map();

  router;
  peers;

  constructor(router) {
    this.router = router;
    this.peers = new Map();
  }

  addPeer = (peer) => {
    this.peers.set(peer.socket.id, peer);
  };

  findPeerBySocketId = (socketId) => {
    return this.peers.get(socketId);
  };

  getOtherPeerList = (socketId) => {
    return Array.from(this.peers.values()).filter(
      (peer) => peer.socket.id !== socketId && peer.producer,
    );
  };

  deletePeer = (socketId) => {
    this.peers.delete(socketId);
  };
}

Room.save = (roomName, room) => {
  Room.rooms.set(roomName, room);
};

Room.findByName = (roomName) => {
  return Room.rooms.get(roomName);
};

Room.delete = (roomName) => {
  const room = Room.rooms.get(roomName);
  room.router.close();
  Room.rooms.delete(roomName);
};

export default Room;
