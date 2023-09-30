import redisClient from '../../lib/redisClient.js';

const EXPIRE_TIME = 604800;

export default (socket) => {
  socket.on('online-summoner', async (summoner, callback) => {
    console.log(`${summoner.name} 메인화면 접속`);
    const redisKey = summoner.summonerId.toString() + 'recent';
    socket.summonerId = summoner.summonerId;

    const existsMe = await redisClient.exists(redisKey);

    if (existsMe) {
      const foundMe = await redisClient.get(redisKey);
      const me = JSON.parse(foundMe);

      const newRecentSummonerIdList = [];
      const recentSummonerList = await Promise.all(
        me.recentSummonerIdList.map(async (recentSummonerId) => {
          const redisKey = recentSummonerId.toString() + 'recent';
          const existsRecentSummoner = await redisClient.exists(redisKey);

          if (existsRecentSummoner) {
            newRecentSummonerIdList.push(recentSummonerId);

            const foundRecentSummoner = await redisClient.get(redisKey);
            const recentSummoner = JSON.parse(foundRecentSummoner);
            return recentSummoner.details;
          }
        }),
      );

      callback(recentSummonerList);
      me.recentSummonerIdList = newRecentSummonerIdList;

      await redisClient.set(redisKey, JSON.stringify(me));
      await redisClient.expire(redisKey, EXPIRE_TIME);

      //
    } else {
      const recentSummonerIdList = [];
      callback(recentSummonerIdList);

      const me = {
        details: summoner,
        recentSummonerIdList,
      };

      await redisClient.set(redisKey, JSON.stringify(me));
      await redisClient.expire(redisKey, EXPIRE_TIME);
    }
  });

  socket.on('start-in-game', async (summonerIdList) => {
    const redisKey = socket.summonerId.toString() + 'recent';
    const foundMe = await redisClient.get(redisKey);
    const me = JSON.parse(foundMe);

    me.recentSummonerIdList = me.recentSummonerIdList.concat(summonerIdList);

    await redisClient.set(redisKey, JSON.stringify(me));
    await redisClient.expire(redisKey, EXPIRE_TIME);
    console.log('최근 함께한 소환사 업데이트');
  });

  socket.on('disconnect', () => {
    console.log('나감');
  });
};
