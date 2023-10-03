import { createWebSocketConnection } from 'league-connect';

const ws = await createWebSocketConnection({
  authenticationOptions: {
    awaitConnection: true,
  },
});

ws.subscribe('/lol-champ-select/v1/session', (data) => {
  console.log('?');
  // for (const summoner of data.myTeam) {
  //   if (summoner.championId !== 0 && summoner.championId) {
  //     console.log('test: ', data.myTeam.length);
  //   }
  // }
  // if (data.timer.phase === 'BAN_PICK') {
  //   console.log(data.myTeam);
  // }
});
