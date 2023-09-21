import { createWebSocketConnection } from 'league-connect';

import express from 'express';

const app = express();
app.listen(8090, () => {
  console.log(`test starting`);
});

const ws = await createWebSocketConnection({
  authenticationOptions: {
    awaitConnection: true,
  },
});

ws.subscribe('/lol-champ-select/v1/session', (data) => {
  console.log('champ select team: ', data.myTeam);
});

ws.subscribe('/lol-gameflow/v1/session', (data) => {
  console.log('gameflow team one: ', data.gameData.teamOne);
  console.log('gameflow team two: ', data.gameData.teamTwo);
});
