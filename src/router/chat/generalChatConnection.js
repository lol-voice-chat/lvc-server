import dayjs from 'dayjs';
import 'dayjs/locale/ko.js';
import prisma from '../../lib/db.js';

dayjs.locale('ko');

const getChatRecords = async (skip = 0) => {
  const chatRecords = await prisma.chat.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      summoner: true,
      message: true,
      time: true,
    },
    skip: skip,
    take: 100,
  });

  return chatRecords.reverse().map((chatRecord) => {
    return {
      summoner: chatRecord.summoner,
      message: chatRecord.message,
      time: chatRecord.time,
    };
  });
};

export default async (io, socket) => {
  const chatRecords = await getChatRecords();
  socket.emit('init', chatRecords);

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

    await prisma.chat.create({
      data: {
        summoner: {
          connect: { summonerId: data.summoner.summonerId },
        },
        message: data.message,
        time: time,
      },
    });
  });

  socket.on('before-message', async (page) => {
    if (page) {
      const _page = page * 100;
      const chatRecord = await getChatRecords(_page);

      const data = {
        messageList: chatRecord,
        isLast: chatRecord.length < 100 ? true : false,
      };

      socket.emit('response-before-message', data);
    }
  });
};
