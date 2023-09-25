const testDb = new Map();

import redis from 'redis';
import dotenv from 'dotenv';
dotenv.config();

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

export default (socket) => {
  socket.on(
    'online-summoner',
    async ({ onlineFriendList, summoner, offlineFriendList }, callback) => {
      socket.summoner = summoner;
      // const data = {
      //   socket,
      //   summoner,
      //   onlineFriendList,
      // };

      await redisClient.hSet(summoner.displayName, {
        // socket: JSON.stringify(socket),
        summoner: 'summoner',
        onlineFriendList: JSON.stringify(onlineFriendList),
      });
      console.log('저장완료');

      let onlineFriends = [];
      let offlineFriends = new Set(offlineFriendList);

      for (const onlineFriend of onlineFriendList) {
        const exist = await redisClient.exists(onlineFriend.displayName);

        if (exist) {
          const data = await redisClient.hGetAll(onlineFriend.displayName);
          JSON.parse(data.socket).emit('online-friend', summoner);
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

  // socket.on('offline-summoner', async (summoner) => {
  //   const data = await redisCli.hgetall(summoner.displayName);

  //   for (const onlineFriend of data.onlineFriendList) {
  //     const exist = await redisCli.exists(onlineFriend.displayName);

  //     if (exist) {
  //       const friendData = await redisCli.hgetall(onlineFriend.displayName);
  //       friendData.socket.emit('offline-friend', summoner);
  //     }
  //   }

  //   await redisCli.del(summoner.displayName);
  // });

  // socket.on('disconnect', async () => {
  //   const data = await redisCli.hgetall(socket.summoner.displayName);

  //   for (const onlineFriend of data.onlineFriendList) {
  //     const exist = await redisCli.exists(onlineFriend.displayName);

  //     if (exist) {
  //       const friendData = await redisCli.hgetall(onlineFriend.displayName);
  //       friendData.socket.emit('offline-friend', socket.summoner);
  //     }
  //   }

  //   await redisCli.del(summoner.displayName);
  // });
};
