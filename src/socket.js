let io;

export const setSocket = (socketIo) => {
  io = socketIo;
};

export const getSocket = () => {
  return io;
};