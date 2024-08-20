const Database = require("../Database");
const HttpError = require("../errors/HttpError");
const { object, string, ValidationError } = require('yup');
const YupValidationError = require("../errors/YupValidationError");

module.exports = class AuthController {
  constructor(authService, usersModel) {
    this.authService = authService;
    this.usersModel = usersModel;
    this.exp = 7 * 24 * 60 * 60 * 1000;

    this.registerSchema = object({
      login: string().required().trim().min(4).max(36),
      password: string().required().trim().min(4).max(48)
    })
    this.loginSchema = object({
      login: string().required().trim().min(4).max(36),
      password: string().required().trim().min(4).max(48)
    })
  
    this.login = this.login.bind(this);
    this.register = this.register.bind(this);
    this.auth = this.auth.bind(this);
  }

  genToken(user) {
    return this.authService.genToken(user.id, user.is_admin, this.exp);
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
      const good = await this.authService.checkPassword(data.password, user.password);
      if (!good) {
        throw new HttpError('Неправильный логин или пароль', 422);
      }
      const token = await this.genToken(user);
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
      next(err);
    }
  }

  async register(req, res, next) {
    try {
      const data = await this.registerSchema.validate(req.body, {
        stripUnknown: true
      });
      const hash = await this.authService.genHash(data.password);
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

  async auth(req, res, next) {
    req.user = null;
    if (req.cookies.jwt) {
      try {
        const data = await this.authService.verifyToken(req.cookies.jwt);
        req.user = data.data;
      } catch (err) {
        res.cookie('jwt', '', {
          maxAge: 0
        })
      }
    }
    next();
  }
}