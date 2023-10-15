import redisClient from '../../lib/redisClient.js';

const EXPIRE_TIME = 604800; //second

export default (socket) => {
  socket.on('online-summoner', async ({ summoner, friendSummonerIdList }, callback) => {
    console.log(`${summoner.name} 메인화면 접속`);
    const redisKey = summoner.summonerId.toString() + 'recent';
    socket.summonerId = summoner.summonerId;

    const existsMe = await redisClient.exists(redisKey);

    if (existsMe) {
      const foundMe = await redisClient.get(redisKey);
      const me = JSON.parse(foundMe);

      if (me.recentSummonerIdList.length === 0) {
        const recentSummonerIdList = [];
        callback(recentSummonerIdList);
      } else {
        const newRecentSummonerIdList = [];
        const recentSummonerList = await Promise.all(
          me.recentSummonerIdList.map(async (recentSummonerId) => {
            const redisKey = recentSummonerId.toString() + 'recent'; //계속 에러남
            const existsRecentSummoner = await redisClient.exists(redisKey);

            if (existsRecentSummoner) {
              newRecentSummonerIdList.push(recentSummonerId);

              const foundRecentSummoner = await redisClient.get(redisKey);
              const recentSummoner = JSON.parse(foundRecentSummoner);

              if (friendSummonerIdList.includes(recentSummonerId)) {
                recentSummoner.details.isRequested = true;
                await redisClient.set(redisKey, JSON.stringify(recentSummoner));
              }

              return recentSummoner.details;
            }
          }),
        );

        callback(recentSummonerList);
        me.recentSummonerIdList = newRecentSummonerIdList;

        await redisClient.set(redisKey, JSON.stringify(me));
        await redisClient.expire(redisKey, EXPIRE_TIME);
      }
    } else {
      const recentSummonerIdList = [];
      callback(recentSummonerIdList);

      summoner.isRequested = false;
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

  socket.on('friend-request', async (summonerId) => {
    const redisKey = summonerId + 'recent';
    const foundSummoner = await redisClient.get(redisKey);
    const summoner = JSON.parse(foundSummoner);

    summoner.details.isRequested = true;
    await redisClient.set(redisKey, JSON.stringify(summoner));
    console.log(`${summoner.details.name} 한테 친구요청 완료`);
  });
};
