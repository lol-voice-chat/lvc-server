// import redisCli from '../../lib/redisClient.js';

export default (io, socket) => {
  socket.on('join', async ({ roomName }, callback) => {
    socket.roomName = roomName;
    socket.join(roomName);

    // const messageList = await redisCli.lrange(socket.roomName, 0, -1);
    callback(messageList);
  });

  socket.on('message', async (data) => {
    io.sockets.in(socket.roomName).emit('message', data);
    // await redisCli.lpush(socket.roomName, data);
  });

  socket.on('disconnect', () => {});
};
