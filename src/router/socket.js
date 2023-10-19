import { Server } from 'socket.io';
import {
  teamVoiceChatConnection,
  teamVoiceChatManagerConnection,
  leagueVoiceChatConnection,
  leagueVoiceChatManagerConnection,
} from './voice/index.js';
import generalChatConnection from './chat/generalChatConnection.js';
import manageConnection from './manage/manageConnection.js';

const socketCors = {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
};

export default (server) => {
  const io = new Server(server, socketCors);

  onVoiceConnections(io);
  onChatConnections(io);
  onManageConnection(io);
};

function onVoiceConnections(io) {
  const teamVoiceChatIo = io.of('/team-voice-chat');
  const teamVoiceChatManagerIo = io.of('/team-voice-chat/manage');
  const leagueVoiceChatIo = io.of('/league-voice-chat');
  const leagueVoiceChatManagerIo = io.of('/league-voice-chat/manage');

  teamVoiceChatIo.on('connection', (socket) => {
    teamVoiceChatConnection(teamVoiceChatIo, socket);
  });
  teamVoiceChatManagerIo.on('connection', teamVoiceChatManagerConnection);
  leagueVoiceChatIo.on('connection', (socket) => {
    leagueVoiceChatConnection(leagueVoiceChatIo, socket);
  });
  leagueVoiceChatManagerIo.on('connection', leagueVoiceChatManagerConnection);
}

function onChatConnections(io) {
  const generalChatIo = io.of('/general-chat');
  generalChatIo.on('connection', (socket) => {
    generalChatConnection(generalChatIo, socket);
  });
}

function onManageConnection(io) {
  const manageIo = io.of('/manage');
  manageIo.on('connection', manageConnection);
}
