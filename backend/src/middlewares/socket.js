import jwt from "jsonwebtoken";

/**
 * ==================================================
 * ATTACH SOCKET.IO INSTANCE + USER CONTEXT
 * ==================================================
 */
export const attachIO = (
  req,
  res,
  next
) => {
  try {
    // ================= SOCKET INSTANCE =================
    const io = req.app.get("io");

    // ================= FAILSAFE SOCKET =================
    const safeIO =
      io &&
        typeof io.emit === "function"
        ? io
        : {
          emit: () => { },

          to: () => ({
            emit: () => { },
          }),
        };

    // ================= ATTACH IO =================
    req.io = safeIO;

    // ================= DEFAULT USER =================
    req.socketUser = null;

    // ================= GET TOKEN =================
    let token = null;

    // Cookie token
    if (
      req.cookies?.accessToken
    ) {
      token =
        req.cookies.accessToken;
    }

    // Bearer token
    if (
      !token &&
      req.headers.authorization?.startsWith(
        "Bearer "
      )
    ) {
      token =
        req.headers.authorization.split(
          " "
        )[1];
    }

    // ================= VERIFY TOKEN =================
    if (token) {
      try {
        const decoded =
          jwt.verify(
            token,
            process.env
              .JWT_ACCESS_SECRET
          );

        req.socketUser = {
          id: decoded.id,
          role: decoded.role,
        };
      } catch (error) {
        console.warn(
          "⚠️ Invalid socket auth token"
        );
      }
    }

    next();
  } catch (error) {
    console.error(
      "❌ attachIO error:",
      error.message
    );

    // ================= HARD FAILSAFE =================
    req.io = {
      emit: () => { },

      to: () => ({
        emit: () => { },
      }),
    };

    req.socketUser = null;

    next(error);
  }
};