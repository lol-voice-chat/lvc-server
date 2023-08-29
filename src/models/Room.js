class Room {
  static rooms = new Map();

  router;
  peers;

  constructor(router) {
    this.router = router;
    this.peers = [];
  }

  addPeer = (peer) => {
    this.peers.push(peer);
  };

  getOtherPeers = (socketId) => {
    return this.peers.filter((peer) => peer.socket.id !== socketId);
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
