const { ValidationError } = require('yup')
const HttpError = require('./HttpError')
const YupValidationError = require('./YupValidationError')

class ErrorHandler {
  constructor() {

  }

  handle(err, req, res, next) {
    if (err instanceof ValidationError) {
      err = new HttpError(
        err.message,
        422, 
        new YupValidationError(err.message, err).toJSON()
      );
    }
    if (err instanceof HttpError) {
      res
        .status(err.statusCode)
        .json(err.toJSON());
    } else {
      res
        .status(500)
        .end();
    }
  }
}

module.exports = ErrorHandler;