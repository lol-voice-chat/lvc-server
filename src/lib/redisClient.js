import redis from 'redis';

const redisClient = redis.createClient({ legacyMode: true });
redisClient.connect().then();
const redisCli = redisClient.v4;

redisClient.on('connect', () => {
  console.info('Redis connected!');
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

export default redisCli;
