const Database = require("../Database");
const HttpError = require("../errors/HttpError");
const { object, string, ValidationError } = require('yup');
const YupValidationError = require("../errors/YupValidationError");
const UnauthorizedError = require("../errors/UnauthorizedError");

module.exports = class AuthController {
  constructor(authModel, usersModel) {
    this.authModel = authModel;
    this.usersModel = usersModel;
    this.exp = 7 * 24 * 60 * 60 * 1000;

    this.registerSchema = object({
      login: string().required().trim().min(4).max(36),
      password: string().required().trim().min(4).max(48)
    })
    this.loginSchema = object({
      login: string().required().trim().min(1).max(36),
      password: string().required().trim().min(1).max(48)
    })
  
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.me = this.me.bind(this);
    this.register = this.register.bind(this);
    this.auth = this.auth.bind(this);
  }

  genToken(user) {
    return this.authModel.genToken(user.id, user.isAdmin, this.exp);
  }

  async login(req, res, next) {
    try {
      const data = await this.loginSchema.validate(req.body, {
        stripUnknown: true
      });
      const user = await this.usersModel.findByLogin(data.login);
      if (!user) {
        throw new HttpError('Неправильный логин или пароль', 422);
      }
      const good = await this.authModel.checkPassword(data.password, user.password);
      if (!good) {
        throw new HttpError('Неправильный логин или пароль', 422);
      }
      const token = await this.genToken({
        ...user,
        isAdmin: user.is_admin
      });
      res
        .cookie('jwt', token, {
          httpOnly: true,
          maxAge: this.exp
        })
        .status(200)
        .json({
          message: 'Успешно!'
        });
    } catch (err) {
      if (err instanceof ValidationError) {
        return next(new HttpError('Неправильный логин или пароль', 422));
      }
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      res.cookie('jwt', '', {
        httpOnly: true,
        maxAge: 0
      })
      .json({})
    } catch (err) {
      next(err)
    }
  }

  async register(req, res, next) {
    try {
      const data = await this.registerSchema.validate(req.body, {
        stripUnknown: true
      });
      const hash = await this.authModel.genHash(data.password);
      const userId = await this.usersModel.create(data.login, hash);
      res
        .status(201)
        .json({
          userId
        })
    } catch (err) {
      next(err);
    }
  }

  async me(req, res, next) {
    try {
      const user = await this.usersModel.findById(req.user.id);
      res
        .status(200)
        .json({
          user
        })
    } catch (err) {
      next(err);
    }
  }

  async auth(req, res, next) {
    req.user = null;
    if (req.cookies.jwt) {
      try {
        const data = await this.authModel.verifyToken(req.cookies.jwt);
        req.user = data.data;
      } catch (err) {
        res.cookie('jwt', '', {
          maxAge: 0
        })
      }
    }
    next();
  }

  authed(req, res, next) {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    next();
  }
}