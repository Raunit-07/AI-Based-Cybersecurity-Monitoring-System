import { Queue } from "bullmq";
import { getRedisConnection } from "../config/redis.js";

let queueInstance = null;

export const getLogQueue = () => {
  if (!queueInstance) {
    queueInstance = new Queue("log-processing", {
      connection: getRedisConnection(),

      defaultJobOptions: {
        attempts: 3,

        backoff: {
          type: "exponential",
          delay: 3000,
        },

        removeOnComplete: 100,

        removeOnFail: 50,
      },
    });
  }

  return queueInstance;
};
