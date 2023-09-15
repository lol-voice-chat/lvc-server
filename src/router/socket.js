import { Server } from 'socket.io';
import {
  teamVoiceChatConnection,
  teamVoiceChatManagerConnection,
  leagueVoiceChatConnection,
} from './voice/index.js';
import homeChatConnection from './chat/homeChatConnection.js';

const socketCors = {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
};

export default (server) => {
  const io = new Server(server, socketCors);

  voiceConnections(io);
  chatConnections(io);
};

function voiceConnections(io) {
  const teamVoiceChatIo = io.of('/team-voice-chat');
  const teamVoiceChatManagerIo = io.of('/team-voice-chat/manage');
  const leagueVoiceChatIo = io.of('/league-voice-chat');

  teamVoiceChatIo.on('connection', teamVoiceChatConnection);
  teamVoiceChatManagerIo.on('connection', teamVoiceChatManagerConnection);
  leagueVoiceChatIo.on('connection', leagueVoiceChatConnection);
}

function chatConnections(io) {
  const homeChatIo = io.of('/home-chat');

  homeChatIo.on('connection', (socket) => {
    homeChatConnection(homeChatIo, socket);
  });
}
