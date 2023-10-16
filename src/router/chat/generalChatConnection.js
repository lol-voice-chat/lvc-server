import dayjs from 'dayjs';
import 'dayjs/locale/ko.js';
import redisClient from '../../lib/redisClient.js';

dayjs.locale('ko');

const key = 'main-chat';

export default (io, socket) => {
  socket.on('init', async (callback) => {
    const messageList = (await redisClient.lRange(key, 0, 99)).map(JSON.parse);
    callback(messageList);
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
    await redisClient.rPush(key, JSON.stringify(_data));
  });

  socket.on('before-message', async (page) => {
    if (page) {
      const _page = parseInt(page.toString() + '00');
      const length = await redisClient.lLen(key);

      let messageList;
      let isLast = false;

      if (_page + 100 >= length) {
        messageList = await redisClient.lRange(key, _page, -1);
        isLast = true;
      } else {
        messageList = await redisClient.lRange(key, _page, _page + 100);
      }

      const data = {
        messageList: messageList.map(JSON.parse),
        isLast,
      };

      socket.emit('response-before-message', data);
    }
  });
};
