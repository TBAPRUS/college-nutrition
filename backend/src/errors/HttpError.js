module.exports = class HttpError extends Error {
  constructor(message, statusCode, data = {}) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
  }

  toJSON() {
    return {
      message: this.message,
      ...this.data
    };
  }
}