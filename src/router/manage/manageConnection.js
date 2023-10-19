import redisClient from '../../lib/redisClient.js';

export default (socket) => {
  socket.on('quit-app', async (puuid) => {
    const key = puuid + 'match';
    await redisClient.del(key);
  });
};
