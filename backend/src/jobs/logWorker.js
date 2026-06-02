import { Worker } from "bullmq";

import { getRedisConnection } from "../config/redis.js";

import { processLog } from "../services/logs.service.js";

export const initLogWorker = (io) => {
  const worker = new Worker(
    "log-processing",

    async (job) => {
      console.log("WORKER JOB DATA:");
      console.dir(job.data, { depth: null });
      await processLog(
        job.data,

        io,

        job.data.user,
      );
    },

    {
      connection: getRedisConnection(),

      concurrency: 5,
    },
  );

  worker.on(
    "completed",

    (job) => {
      console.log(`Job ${job.id} done`);
    },
  );

  worker.on(
    "failed",

    (job, err) => {
      console.log(`Job ${job?.id} failed`, err.message);
    },
  );

  return worker;
};
