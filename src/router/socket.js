import { Server } from 'socket.io';
import {
  teamVoiceChatConnection,
  teamVoiceChatManagerConnection,
  leagueVoiceChatConnection,
  leagueVoiceChatManagerConnection,
} from './voice/index.js';
import mainChatConnection from './chat/mainChatConnection.js';
import recentSummonerConnection from './recentSummoner/recentSummonerConnection.js';
import { WebSocketServer } from 'ws';

const socketCors = {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
};

export default (server) => {
  const io = new Server(server, socketCors);
  const wss = new WebSocketServer({ port: 8001 });

  onVoiceConnections(io);
  onRecentSummonerConnection(io);
  onMainChatConnection(wss);
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

function onRecentSummonerConnection(io) {
  const recentSummonerIo = io.of('/summoner-status');
  recentSummonerIo.on('connection', recentSummonerConnection);
}

function onMainChatConnection(wss) {
  wss.on('connection', mainChatConnection);
}
