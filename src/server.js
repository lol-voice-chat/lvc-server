import express from 'express';
import http from 'http';
import cors from 'cors';
import * as worker from './lib/worker.js';
import socket from './router/socket.js';

const app = express();
app.use(cors());

const server = http.createServer(app);

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`starting ${PORT}`);
});

worker.createWorker().then(() => {
  socket(server);
});
