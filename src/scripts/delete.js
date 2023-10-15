import { scheduleJob } from 'node-schedule';
import redisClient from '../lib/redisClient';
import dayjs from 'dayjs';

const rule = '0 4 * * 6'; //매주 토요일 새벽 4시

//5일이상 지난 전채채팅 내용 삭제
export const deleteChatMessage = () => {
  scheduleJob(rule, async () => {
    const currentTime = dayjs();
    const compareTime = currentTime.subtract(5, 'day');

    (await redisClient.lRange('main-chat', 0, -1))
      .map(JSON.parse)
      .filter((data) => {
        const time = dayjs(data.time, 'MM/DD ddd hh:mm:ss A');
        if (!!time.isBefore(compareTime)) {
          return data;
        }

        return;
      })
      .forEach((data) => {
        redisClient.lRem('main-chat', 0, JSON.stringify(data));
      });
  });
};
