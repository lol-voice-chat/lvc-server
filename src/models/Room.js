class Room {
  static rooms = new Map();

  router;
  leagueTitleList;
  peers;

  constructor(router, leagueTitleList) {
    this.router = router;
    this.leagueTitleList = leagueTitleList;
    this.peers = new Map();
  }

  addPeer = (peer) => {
    this.peers.set(peer.socketId, peer);
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

  saveLeagueTitle = (summonerLeagueTitleList) => {
    if (summonerLeagueTitleList === null) {
      return;
    }
    Array.from(this.peers.values()).forEach((peer) => {
      for (const leagueTitle of summonerLeagueTitleList) {
        if (peer.details.summoner.summonerId === leagueTitle.summonerId) {
          peer.saveLeagueTitle(leagueTitle);
          break;
        }
      }
    });
  };

  getPeerLeagueTitleList = () => {
    return Array.from(this.peers.values()).map((peer) => peer.leagueTitle);
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
