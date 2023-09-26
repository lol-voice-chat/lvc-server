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
