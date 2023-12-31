export default (io, socket) => {
  console.log('리그보이스 매니저 연결');

  socket.on('mic-visualizer', ({ summonerId, visualizerVolume }) => {
    io.emit('mic-visualizer', { summonerId, visualizerVolume });
  });

  socket.on('disconnect', () => {
    console.log('리그보이스 매니저 연결 종료');
  });
};
