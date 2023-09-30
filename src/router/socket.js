import { Server } from 'socket.io';
import {
  teamVoiceChatConnection,
  teamVoiceChatManagerConnection,
  leagueVoiceChatConnection,
  leagueVoiceChatManagerConnection,
} from './voice/index.js';
import homeChatConnection from './chat/homeChatConnection.js';
import recentSummonerConnection from './recentSummoner/recentSummonerConnection.js';

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
  onRecentSummonerConnection(io);
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
  leagueVoiceChatIo.on('connection', leagueVoiceChatConnection);
  leagueVoiceChatManagerIo.on('connection', leagueVoiceChatManagerConnection);
}

function onChatConnections(io) {
  const homeChatIo = io.of('/home-chat');
  homeChatIo.on('connection', (socket) => {
    homeChatConnection(homeChatIo, socket);
  });
}

function onRecentSummonerConnection(io) {
  const recentSummonerIo = io.of('/summoner-status');
  recentSummonerIo.on('connection', recentSummonerConnection);
}
