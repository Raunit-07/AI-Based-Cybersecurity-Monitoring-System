import dotenv from "dotenv";

dotenv.config();

export default {
  backendUrl:
    process.env.BACKEND_URL,

  apiKey:
    process.env.LOG_API_KEY,

  logFilePath:
    process.env.LOG_FILE_PATH,

  batchInterval:
    Number(
      process.env.BATCH_INTERVAL
    ) || 3000,
};