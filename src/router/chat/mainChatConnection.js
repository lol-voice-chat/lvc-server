import dotenv from 'dotenv';
import dayjs from 'dayjs';
import redisClient from '../../lib/redisClient.js';
import 'dayjs/locale/ko.js';

dayjs.locale('ko');
dotenv.config();

export default async (wss, ws) => {
  const messageList = (await redisClient.lRange('main-chat', 0, -1)).reverse();
  console.log('test: ', messageList);
  const sendData = {
    key: 'init',
    messageList,
  };
  ws.send(JSON.stringify(sendData));

  ws.on('message', async (data) => {
    const time = dayjs()
      .locale('ko')
      .format('MM/DD ddd HH:mm:ss A')
      .replace('오전', 'AM')
      .replace('오후', 'PM')
      .toString();

    const { summoner, message } = JSON.parse(data.toString());
    wss.clients.forEach((client) => {
      const sendData = {
        key: 'message',
        summoner,
        message,
        time,
      };
      client.send(JSON.stringify(sendData));
    });

    const test = JSON.parse(data.toString());
    test.time = time;
    await redisClient.lPush('main-chat', JSON.stringify(test).toString());
  });
};
