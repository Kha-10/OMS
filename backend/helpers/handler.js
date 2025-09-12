const handler = {
  notFoundError: (message) => {
    const err = new Error(message);
    err.statusCode = 404;
    return err;
  },

  conflictError: (message) => {
    const err = new Error(message);
    err.statusCode = 409;
    return err;
  },

  invalidError: (message) => {
    const err = new Error(message);
    err.statusCode = 400;
    return err;
  },

  lockError: (message) => {
    const err = new Error(message);
    err.statusCode = 423;
    return err;
  },
  insufficient: (message) => {
    const err = new Error(message);
    err.statusCode = 409;
    return err;
  },
};

module.exports = handler;
