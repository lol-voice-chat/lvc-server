import {
  authenticate,
  createHttp1Request,
  createWebSocketConnection,
} from 'league-connect';

// async function http() {
//   const credentials = await authenticate({
//     awaitConnection: true,
//   });

//   const response = await createHttp1Request(
//     {
//       method: 'GET',
//       url: '/lol-gameflow/v1/session',
//     },
//     credentials,
//   );

//   return JSON.parse(response.text());
// }

// console.log(await http());

const ws = await createWebSocketConnection({
  authenticationOptions: {
    awaitConnection: true,
  },
});

ws.subscribe('/lol-gameflow/v1/session', (data) => {
  console.log(data.gameClient.running);
});
