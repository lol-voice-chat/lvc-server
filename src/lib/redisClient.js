// import redis from 'redis';
// import dotenv from 'dotenv';
// dotenv.config();

// console.log(process.env.REDIS_USERNAME);

// const redisClient = redis.createClient({
//   url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/0`,
//   legacyMode: true,
// });

// redisClient.on('connect', () => {
//   console.info('Redis connected!');
// });

// redisClient.on('error', (err) => {
//   console.error('Redis Client Error', err);
// });

// redisClient.connect().then();
// export const redisCli = redisClient.v4;
