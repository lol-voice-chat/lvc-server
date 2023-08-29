import mediasoup from 'mediasoup';

let worker;
const mediaCodecs = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
  },
];

export const createWorker = async () => {
  worker = await mediasoup.createWorker({
    rtcMinPort: 2000,
    rtcMaxPort: 2100,
  });

  worker.on('died', (error) => {
    console.error(`mediasoup worker has died: ${error}`);
  });
};

export const createRouter = async () => {
  return await worker.createRouter({ mediaCodecs });
};
