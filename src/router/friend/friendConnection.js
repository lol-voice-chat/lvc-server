import redis from 'redis';

const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/0`,
});

redisClient.on('connect', () => {
  console.info('Redis connected!');
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

redisClient.connect().then();

export default (io, socket) => {
  socket.on(
    'online-summoner',
    async ({ onlineFriendList, summoner, offlineFriendList }, callback) => {
      socket.summoner = summoner;

      //저장
      await redisClient.hSet(summoner.displayName, {
        socketId: socket.id,
        summoner: JSON.stringify(summoner),
        onlineFriendList: JSON.stringify(onlineFriendList),
      });

      const test1 = JSON.stringify(summoner);
      const test2 = JSON.stringify(onlineFriendList);
      console.log('저장완료: ', JSON.parse(test1), JSON.parse(test2));

      let onlineFriends = [];
      let offlineFriends = new Set(offlineFriendList);

      for (const onlineFriend of onlineFriendList) {
        const exist = await redisClient.exists(onlineFriend.displayName);

        if (exist) {
          const data = await redisClient.hGetAll(onlineFriend.displayName);
          io.to(data.socketId).emit('online-friend', summoner);
          onlineFriends.push(onlineFriend);
        } else {
          offlineFriends.add(onlineFriend);
        }
      }

      callback({
        onlineFriendList: onlineFriends,
        offlineFriendList: Array.from(offlineFriends.values()),
      });
    },
  );

  socket.on('offline-summoner', async (summoner) => {
    const data = await redisClient.hGetAll(summoner.displayName);

    for (const onlineFriend of JSON.parse(data.onlineFriendList)) {
      const exist = await redisClient.exists(onlineFriend.displayName);

      if (exist) {
        const friendData = await redisClient.hGetAll(onlineFriend.displayName);
        io.to(friendData.socketId).emit('offline-friend', summoner);
      }
    }

    await redisClient.del(summoner.displayName);
  });

  socket.on('disconnect', async () => {
    const data = await redisClient.hGetAll(socket.summoner.displayName);

    for (const onlineFriend of JSON.parse(data.onlineFriendList)) {
      const exist = await redisClient.exists(onlineFriend.displayName);

      if (exist) {
        const friendData = await redisClient.hGetAll(onlineFriend.displayName);
        io.to(friendData.socketId).emit('offline-friend', socket.summoner);
      }
    }

    await redisClient.del(socket.summoner.displayName);
    console.log('나감');
  });
};
