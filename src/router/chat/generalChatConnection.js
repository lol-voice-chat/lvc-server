import dayjs from 'dayjs';
import 'dayjs/locale/ko.js';
import redisClient from '../../lib/redisClient.js';

dayjs.locale('ko');

const key = 'main-chat';

export default (io, socket) => {
  redisClient.lRange(key, 0, 99).then((messages) => {
    const _messages = messages.reverse().map(JSON.parse);
    socket.emit('init', _messages);
  });

  socket.on('new-message', async (data) => {
    const time = dayjs()
      .format('MM/DD ddd hh:mm:ss A')
      .replace('오전', 'AM')
      .replace('오후', 'PM')
      .toString();

    const _data = {
      summoner: data.summoner,
      message: data.message,
      time,
    };

    io.emit('message', _data);
    await redisClient.lPush(key, JSON.stringify(_data));
  });

  socket.on('before-message', async (page) => {
    if (page) {
      const _page = page * 100 - 1;
      const length = await redisClient.lLen(key);

      let messages;
      let isLast = false;

      if (_page + 99 >= length) {
        messages = await redisClient.lRange(key, _page, -1);
        isLast = true;
      } else {
        messages = await redisClient.lRange(key, _page, _page + 99);
      }

      const data = {
        messageList: messages.reverse().map(JSON.parse),
        isLast,
      };

      socket.emit('response-before-message', data);
    }
  });
};
