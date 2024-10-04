const { object, number, string, boolean } = require('yup');
const HttpError = require('../errors/HttpError');

class UsersController {
  constructor(usersModel, authModel) {
    this.usersModel = usersModel;
    this.authModel = authModel;

    this.getSchema = object({
      login: string(),
      limit: number().min(10).max(300),
      offset: number().min(0),
    });
    this.postSchema = object({
      login: string(),
      password: string()
    })
    this.patchSchema = object({
      id: number().min(0),
      login: string(),
      password: string().optional()
    })
  
    this.get = this.get.bind(this);
    this.post = this.post.bind(this);
    this.patch = this.patch.bind(this);
  }

  async get(req, res, next) {
    try {
      const query = await this.getSchema.validate(req.query, {
        stripUnknown: true
      });

      if (query.login) {
        query.login = `%${query.login.replaceAll(/[^а-яА-Яa-zA-Z0-9]/g, '')}%`
      }
      if (typeof query.login === 'string' && !query.login) {
        delete query.login
      }
      const users = await this.usersModel.get(query);
      res.json(users);
    } catch (err) {
      next(err);
    }
  }

  async post(req, res, next) {
    try {
      const data = await this.postSchema.validate(req.body, {
        stripUnknown: true
      })
      const hash = await this.authModel.genHash(data.password);
      const userId = await this.usersModel.create(data.login, hash);
      res.json(await this.usersModel.findById(userId));
    } catch (err) {
      if (err.code === '23505') {
        return next(new HttpError('Логин должен быть уникальным', 400))
      }
      next(err);
    }
  }

  async patch(req, res, next) {
    try {
      const data = await this.patchSchema.validate({...req.body, id: req.params.id}, {
        stripUnknown: true
      })
      if (data.password?.length > 0) {
        const hash = await this.authModel.genHash(data.password);
        data.password = hash;
      }
      const user = await this.usersModel.update(data)
      res.json(user);
    } catch (err) {
      if (err.code === '23505') {
        return next(new HttpError('Логин должен быть уникальным', 400))
      }
      next(err);
    }
  }
}

module.exports = UsersController;