const handler = {
  handleResponse: (res, status = 200, response) => {
    return res.status(status).json(response);
  },

  handleError: (res, status = 500, message = "Internal Server Error") => {
    return res.status(status).json({
      message,
      data: null,
    });
  },
};

module.exports = handler;
