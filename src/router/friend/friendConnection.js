let testDb = new Map();

export default (socket) => {
  socket.on('online', ({ displayName, phase, friendNames }, callback) => {
    const data = {
      socket,
      phase,
    };

    testDb.set(displayName, data);

    let onlineFriendList = [];
    let offlineFriendList = [];
    friendNames.forEach((firendName) => {
      const data = testDb.get(firendName);

      if (data) {
        const friendData = {
          displayName,
          phase,
        };

        data.socket.emit('inform-online', friendData);
        onlineFriendList.push(friendData);
      } else {
        offlineFriendList.push(firendName);
      }
    });

    callback({ onlineFriendList, offlineFriendList });
  });
};
