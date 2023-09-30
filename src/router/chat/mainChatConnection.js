import dotenv from 'dotenv';
import redisClient from '../../lib/redisClient.js';
dotenv.config();

export default (ws) => {
  ws.on('on', async (callback) => {
    const messageList = await redisClient.lRange('main-chat', 0, -1);
    callback(messageList);
  });

  ws.on('message', async (data) => {
    wss.clients.forEach((client) => {
      client.send(data);
    });

    await redisClient.lPush('main-chat', data);
  });
};
