import redisClient from '../../lib/redisClient.js';

export default (io, socket) => {
  socket.on('online-summoner', async ({ summoner }, callback) => {
    const foundSummoner = await redisClient.exists(summoner.summonerId.toString());

    //DB에 내정보 있는지 확인
    if (foundSummoner) {
      //있으면 socketId 업데이트
      await redisClient.hSet(summoner.summonerId.toString(), {
        status: '온라인',
        socketId: socket.id,
        summoner: foundSummoner.summoner,
        recentSummonerList: foundSummoner.recentSummonerList,
      });

      const onlineFriendList = [];
      const offlineFriendList = [];

      //나랑 최근에 같이 게임한 소환사 리스트를 돌면서
      for (const recentSummoner of JSON.parse(foundSummoner.recentSummonerList)) {
        const foundRecentSummoner = await redisClient.exists(
          recentSummoner.summoner.summonerId.toString(),
        );

        //DB에 소환사가 있다면
        if (foundRecentSummoner) {
          //온라인 상태라면 온라인 리스트에 추가
          if (foundRecentSummoner.status === '온라인') {
            onlineFriendList.push(foundRecentSummoner.summoner);
          } else {
            //오프라인이라면 오프라인 리스트에 추가
            offlineFriendList.push(foundRecentSummoner.summoner);
          }
        } else {
          //우리앱을 사용하지 않는다면 오프라인 리스트에 추가
          const offlineSummoner = {
            summonerId: recentSummoner.summonerId,
            puuid: recentSummoner.puuid,
            profileImage: recentSummoner.profileImage,
            displayName: recentSummoner.displayName,
          };
          offlineFriendList.push(offlineSummoner);
        }
      }

      callback({
        onlineFriendList,
        offlineFriendList,
      });
    } else {
      //없으면 새로 저장하고 빈 리스트 콜백
      socket.summoner = summoner;
      await redisClient.hSet(summoner.summonerId.toString(), {
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
    const foundSummoner = await redisClient.hGetAll(
      socket.summoner.summonerId.toString(),
    );

    const recentSummonerList = await Promise.all(
      //팀원정보 리스트를 돌면서
      summonerList.map(async (summonerInfo) => {
        const existsSummoner = await redisClient.exists(
          summonerInfo.summonerId.toString(),
        );

        //DB에 팀원정보가 있다면
        if (existsSummoner) {
          //꺼내서
          const recentSummoner = await redisClient.hGetAll(
            summonerInfo.summonerId.toString(),
          );

          return {
            status: '온라인',
            socketId: recentSummoner.socketId,
            summoner: JSON.parse(recentSummoner.summoner),
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

    await redisClient.hSet(socket.summoner.summonerId.toString(), {
      status: '온라인',
      socketId: foundSummoner.socketId,
      summoner: foundSummoner.summoner,
      recentSummonerList: JSON.stringify(recentSummonerList),
    });
    console.log('최근 함께한 소환사 업데이트 완료');
  });

  socket.on('offline-summoner', async (summoner) => {
    const foundSummoner = await redisClient.hGetAll(summoner.summonerId.toString());

    JSON.parse(foundSummoner.recentSummonerList)
      .filter((recentSummoner) => recentSummoner.status === '온라인')
      .forEach((recentSummoner) => {
        io.to(recentSummoner.socketId).emit(
          'offline-friend',
          JSON.parse(foundSummoner.summoner),
        );
      });
  });

  socket.on('disconnect', async () => {
    const foundSummoner = await redisClient.hGetAll(
      socket.summoner.summonerId.toString(),
    );

    JSON.parse(foundSummoner.recentSummonerList)
      .filter((recentSummoner) => recentSummoner.status === '온라인')
      .forEach((recentSummoner) => {
        io.to(recentSummoner.socketId).emit(
          'offline-friend',
          JSON.parse(foundSummoner.summoner),
        );
      });
  });
};
