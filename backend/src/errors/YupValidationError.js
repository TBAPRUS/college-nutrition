class YupValidationError extends Error {
  constructor(message, yupError) {
    super(message);
    this.yupError = yupError;
  }

  getErrorFromYup(yupError) {
    if (yupError.type === 'typeError') {
      return yupError.params.type
    }
    return yupError.params[yupError.type];
  }

  toJSON() {
    if (!this.yupError.inner.length) {
      this.yupError.inner.push(this.yupError);
    }
    return {
      validationErrors: this.yupError.inner.reduce((acc, yupError) => {
        if (!acc[yupError.path]) {
          acc[yupError.path] = {};
        }
        acc[yupError.path][yupError.type] = this.getErrorFromYup(yupError);
        return acc;
      }, {})
    };
  }
}

module.exports = YupValidationError