const testDb = new Map();

export default (socket) => {
  socket.on(
    'online-summoner',
    ({ onlineFriendList, summoner, offlineFriendList }, callback) => {
      const { displayName } = summoner;
      const data = {
        socket,
        summoner,
        onlineFriendList,
      };

      testDb.set(displayName, data);

      let onlineFriends = [];
      let offlineFriends = new Set(offlineFriendList);

      onlineFriendList.forEach((friend) => {
        const data = testDb.get(friend.displayName);

        if (data) {
          data.socket.emit('online-friend', summoner);
          onlineFriends.push(friend);
        } else {
          offlineFriends.add(friend);
        }
      });

      callback({
        onlineFriendList: onlineFriends,
        offlineFriendList: Array.from(offlineFriends.values()),
      });
    },
  );

  socket.on('offline-summoner', ({ summoner }) => {
    const data = testDb.get(friend.displayName);

    data.onlineFriendList.forEach((friend) => {
      const data = testDb.get(friend.displayName);

      if (data) {
        data.socket.emit('offline-friend', summoner);
      }
    });

    testDb.delete(summoner.displayName);
  });
};
