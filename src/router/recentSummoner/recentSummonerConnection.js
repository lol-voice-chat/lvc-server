import redisClient from '../../lib/redisClient.js';

const EXPIRE_TIME = 604800; //5일

export default (socket) => {
  socket.on('online-summoner', async ({ summoner, friendSummonerIdList }, callback) => {
    socket.summonerId = summoner.summonerId;
    console.log(`${summoner.name} 메인화면 접속`);

    const key = summoner.summonerId.toString() + 'recent';
    const existsSummoner = await redisClient.exists(key);

    if (existsSummoner) {
      const _summoner = JSON.parse(await redisClient.get(key));

      if (_summoner.recentSummonerIdList.length === 0) {
        const recentSummonerIdList = [];
        callback(recentSummonerIdList);
      } else {
        const newRecentSummonerIdList = [];
        const recentSummonerList = await Promise.all(
          _summoner.recentSummonerIdList.map(async (recentSummonerId) => {
            const key = recentSummonerId.toString() + 'recent';
            const existsRecentSummoner = await redisClient.exists(key);

            if (existsRecentSummoner) {
              newRecentSummonerIdList.push(recentSummonerId);

              const recentSummoner = JSON.parse(await redisClient.get(key));
              if (friendSummonerIdList.includes(recentSummonerId)) {
                recentSummoner.details.isRequested = true;
                await redisClient.set(key, JSON.stringify(recentSummoner));
              }

              return recentSummoner.details;
            }
          }),
        );

        callback(recentSummonerList);
        _summoner.recentSummonerIdList = newRecentSummonerIdList;

        await redisClient.set(key, JSON.stringify(_summoner));
        await redisClient.expire(key, EXPIRE_TIME);
      }
    } else {
      const recentSummonerIdList = [];
      callback(recentSummonerIdList);

      summoner.isRequested = false;
      const _summoner = {
        details: summoner,
        recentSummonerIdList,
      };

      await redisClient.set(key, JSON.stringify(_summoner));
      await redisClient.expire(key, EXPIRE_TIME);
    }
  });

  socket.on('start-in-game', async (summonerIdList) => {
    const key = socket.summonerId.toString() + 'recent';
    const summoner = JSON.parse(await redisClient.get(key));

    summoner.recentSummonerIdList = summoner.recentSummonerIdList.concat(summonerIdList);
    await redisClient.set(key, JSON.stringify(summoner));
    console.log('최근 함께한 소환사 업데이트');
  });

  socket.on('end-of-the-game', async (summonerStats) => {
    const key = socket.summonerId.toString() + 'recent';
    const summoner = JSON.parse(await redisClient.get(key));

    summoner.details.summonerStats = summonerStats;
    await redisClient.set(key, JSON.stringify(summoner));
    console.log('전적 업데이트');
  });

  socket.on('friend-request', async (summonerId) => {
    const key = summonerId + 'recent';
    const summoner = JSON.parse(await redisClient.get(key));

    summoner.details.isRequested = true;
    await redisClient.set(key, JSON.stringify(summoner));
  });
};
