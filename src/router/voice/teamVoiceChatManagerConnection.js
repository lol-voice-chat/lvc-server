export default (socket) => {
  console.log('팀보이스 매니저 소켓연결성공');

  socket.on('team-manage-join-room', (roomName) => {
    socket.roomName = roomName;
    socket.join(roomName);
  });

  socket.on('champion-info', (championinfo) => {
    socket.to(socket.roomName).emit(championinfo);
  });

  socket.on('mic-visualizer', ({ summonerId, visualizerVolume }) => {
    socket.to(socket.roomName).emit({ summonerId, visualizerVolume });
  });

  socket.on('disconnect', () => {
    console.log('팀보이스 매니저 소켓연결 끊어짐');
  });
};
