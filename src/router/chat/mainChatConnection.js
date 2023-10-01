import dotenv from 'dotenv';
import dayjs from 'dayjs';
import redisClient from '../../lib/redisClient.js';
import 'dayjs/locale/ko.js';

dayjs.locale('ko');
dotenv.config();

export default async (wss, ws) => {
  const messageList = (await redisClient.lRange('main-chat', 0, 10)).reverse();

  const sendData = {
    key: 'init',
    messageList,
  };
  ws.send(JSON.stringify(sendData));

  ws.on('message', async (data) => {
    const _data = JSON.parse(data.toString());

    if (_data.key === 'new-message') {
      const time = dayjs()
        .format('MM/DD ddd hh:mm:ss A')
        .replace('오전', 'AM')
        .replace('오후', 'PM')
        .toString();

      const { summoner, message } = _data;
      wss.clients.forEach((client) => {
        const sendData = {
          key: 'message',
          summoner,
          message,
          time,
        };
        client.send(JSON.stringify(sendData));
      });

      const dbData = {
        summoner: _data.summoner,
        message: _data.message,
        time: time,
      };
      await redisClient.lPush('main-chat', JSON.stringify(dbData).toString());
    }

    if (_data.key === 'before-message') {
      if (_data.page) {
        const pageNumber = parseInt(_data.page.toString() + '0') + 1;

        const messageList = (
          await redisClient.lRange('main-chat', pageNumber, pageNumber + 10)
        ).reverse();

        const sendData = {
          key: 'response-before-message',
          messageList,
        };
        ws.send(JSON.stringify(sendData));
      }
    }
  });

  ws.on('close', () => {
    console.log('전체채팅 떠남');
  });

  ws.on('error', (error) => {
    console.log('websocket이 의도치 않게 끊김 ', error);
  });
};
