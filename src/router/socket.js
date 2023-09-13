import { Server } from 'socket.io';
import {
  teamVoiceChatConnection,
  teamVoiceChatManagerConnection,
  leagueVoiceChatConnection,
} from './voice/index.js';

const socketCors = {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
};

export default (server) => {
  const io = new Server(server, socketCors);

  const teamVoiceChatIo = io.of('/team-voice-chat');
  const teamVoiceChatManagerIo = io.of('/team-voice-chat/manage');
  const leagueVoiceChatIo = io.of('/league-voice-chat');

  teamVoiceChatIo.on('connection', teamVoiceChatConnection);
  teamVoiceChatManagerIo.on('connection', teamVoiceChatManagerConnection);
  leagueVoiceChatIo.on('connection', leagueVoiceChatConnection);
};
