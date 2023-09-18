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

ws.subscribe('/lol-chat/v1/friends', (data, event) => {
  console.log('data: ', data);
  console.log('event: ', event);
});
