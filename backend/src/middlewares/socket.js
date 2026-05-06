export const attachIO = (req, res, next) => {
  try {
    const io = req.app.get("io");

    req.io =
      io ||
      {
        emit: () => {},
      };

    return next();
  } catch (error) {
    req.io = {
      emit: () => {},
    };

    return next(error);
  }
};