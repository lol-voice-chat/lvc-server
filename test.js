import { authenticate, createHttp1Request } from 'league-connect';

import express from 'express';

const app = express();
app.listen(8090, () => {
  console.log(`test starting`);
});

const credentials = await authenticate({
  awaitConnection: true,
});

const response = await createHttp1Request(
  {
    method: 'GET',
    url: '/lol-match-history/v1/products/lol/current-summoner/matches',
  },
  credentials,
);

console.log('test: ', JSON.parse(response.text()).games.games);
