const handler = {
  notFoundError: (message) => {
    const err = new Error(message);
    err.statusCode = 404;
    return err;
  },

  conflictError: (message) => {
    console.log("conflictError");
    const err = new Error(message);
    err.statusCode = 409;
    console.log("err", err);
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
};

module.exports = handler;
