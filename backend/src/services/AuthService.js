const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = class AuthService {
  constructor(secret) {
    this.secret = secret;
  }

  checkPassword(password, hash) {
    return new Promise((resolve) => {
      bcrypt.compare(password, hash, (err, result) => {
        if (err) resolve(false);
        resolve(result);
      })
    })
  }

  genHash(password) {
    return new Promise((resolve, reject) => {
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) reject(err);
        resolve(hash);
      })
    })
  }

  genToken(id, isAdmin, expInMilliseconds) {
    return new Promise((resolve, reject) => {
      jwt.sign({
      exp: Math.floor(Date.now() / 1000) + expInMilliseconds / 1000,
      data: {
        id,
        isAdmin
      }
    }, this.secret, (err, encoded) => {
      if (err) reject(err);
      resolve(encoded);
    });
    })
  }

  verifyToken(token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, this.secret, (err, decoded) => {
        if (err) reject(err);
        resolve(decoded);
      })
    })
  }
}