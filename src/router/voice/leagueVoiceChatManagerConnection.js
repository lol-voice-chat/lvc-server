export default (socket) => {
  console.log('리그보이스 매니저 연결');

  socket.on('league-manage-join-room', (roomName) => {
    socket.roomName = roomName;
    socket.join(roomName);
  });

  socket.on('mic-visualizer', ({ summonerId, visualizerVolume }) => {
    socket.to(socket.roomName).emit('mic-visualizer', { summonerId, visualizerVolume });
  });

  socket.on('disconnect', () => {
    console.log('리그보이스 매니저 연결 종료');
  });
};
