export const attachIO = (req, res, next) => {
  try {
    const io = req.app.get("io");

    if (!io) {
      console.error("❌ Socket.IO not initialized");

      // Attach safe fallback to prevent crashes
      req.io = {
        emit: () => {
          console.warn("⚠️ Attempted to emit event without Socket.IO initialized");
        }
      };

      return next();
    }

    // Attach io instance
    req.io = io;

    next();
  } catch (error) {
    console.error("❌ Error attaching Socket.IO:", error);

    // Fail-safe fallback
    req.io = {
      emit: () => { }
    };

    next();
  }
};