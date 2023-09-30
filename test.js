import dayjs from 'dayjs';
import 'dayjs/locale/ko.js';
dayjs.locale('ko');

console.log(
  dayjs()
    .locale('ko')
    .format('MM/DD ddd HH:mm:ss A')
    .replace('오전', 'AM')
    .replace('오후', 'PM'),
);
