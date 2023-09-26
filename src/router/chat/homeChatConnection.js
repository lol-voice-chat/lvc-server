import redis from 'redis';
import dotenv from 'dotenv';
dotenv.config();

export default (io, socket) => {
  socket.on('join', async ({ roomName }, callback) => {
    socket.roomName = roomName;
    socket.join(roomName);

    // const messageList = await redisClient.lRange(socket.roomName, 0, -1);
    callback(messageList);
  });

  socket.on('message', async (data) => {
    // io.sockets.in(socket.roomName).emit('message', data);
    await redisClient.lPush(socket.roomName, data);
  });

  socket.on('disconnect', () => {});
};
