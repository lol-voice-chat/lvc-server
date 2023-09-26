import redisClient from '../../lib/redisClient.js';

export default (io, socket) => {
  socket.on('online-summoner', async ({ summoner }, callback) => {
    const existsSummoner = await redisClient.exists(summoner.summonerId);

    if (existsSummoner) {
      await redisClient.hSet(summoner.summonerId, {
        status: '온라인',
        socketId: socket.id,
        summoner: existsSummoner.summoner,
        recentSummonerList: existsSummoner.recentSummonerList,
      });

      const onlineFriendList = JSON.parse(existsSummoner.recentSummonerList).filter(
        (recentSummoner) => recentSummoner.status === '온라인',
      );

      const offlineFriendList = JSON.parse(existsSummoner.recentSummonerList).filter(
        (recentSummoner) => recentSummoner.status === '오프라인',
      );

      callback({
        onlineFriendList,
        offlineFriendList,
      });
    } else {
      socket.summoner = summoner;
      await redisClient.hSet(summoner.summonerId, {
        status: '온라인',
        socketId: socket.id,
        summoner: JSON.stringify(summoner),
        recentSummonerList: JSON.stringify([]),
      });

      callback({
        onlineFriendList: [],
        offlineFriendList: [],
      });
    }

    console.log('저장완료');
  });

  socket.on('start-in-game', async (summonerList) => {
    const foundSummoner = await redisClient.hGetAll(socket.summoner.summonerId);

    const recentSummonerList = await Promise.all(
      summonerList.map(async (summonerInfo) => {
        const existsSummoner = await redisClient.exists(summonerInfo.summonerId);

        if (existsSummoner) {
          return {
            status: '온라인',
            socketId: existsSummoner.socketId,
            summoner: JSON.parse(existsSummoner.summoner),
          };
        } else {
          const summoner = {
            summonerId: summonerInfo.summonerId,
            profileImage: summonerInfo.profileImage,
            displayName: summonerInfo.displayName,
            puuid: summonerInfo.puuid,
          };

          return {
            status: '오프라인',
            socketId: 0,
            summoner: summoner,
          };
        }
      }),
    );

    await redisClient.hSet(foundSummoner.summoner.summonerId, {
      status: '온라인',
      socketId: foundSummoner.socketId,
      summoner: foundSummoner.summoner,
      recentSummonerList: JSON.stringify(recentSummonerList),
    });
    console.log('최근 함께한 소환사 업데이트 완료');
  });

  socket.on('offline-summoner', async (summoner) => {
    const foundSummoner = await redisClient.hGetAll(summoner.summonerId);

    JSON.parse(foundSummoner.recentSummonerList)
      .filter((recentSummoner) => recentSummoner.status === '온라인')
      .forEach((recentSummoner) => {
        io.to(recentSummoner.socketId).emit('offline-friend', summoner);
      });

    await redisClient.del(summoner.summonerId);
    console.log(summoner.displayName + ' 나감');
  });

  socket.on('disconnect', async () => {
    const foundSummoner = await redisClient.hGetAll(socket.summoner.summonerId);

    JSON.parse(foundSummoner.recentSummonerList)
      .filter((recentSummoner) => recentSummoner.status === '온라인')
      .forEach((recentSummoner) => {
        io.to(recentSummoner.socketId).emit('offline-friend', summoner);
      });

    await redisClient.del(socket.summoner.summonerId);
    console.log(socket.summoner.displayName + ' 나감');
  });
};
