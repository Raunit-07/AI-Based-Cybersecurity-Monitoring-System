export const attachIO = (req, res, next) => {
  const io = req.app.get("io");

  if (!io) {
    console.warn("⚠️ Socket.IO not initialized yet");
  }

  req.io = io;
  next();
};