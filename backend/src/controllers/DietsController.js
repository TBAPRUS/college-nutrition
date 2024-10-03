const { object, number, string, array } = require('yup')

class DietsController {
  constructor(dietsModel) {
    this.dietsModel = dietsModel;

    this.getSchema = object({
      userId: number(),
      name: string(),
      limit: number().min(10).max(300),
      offset: number().min(0),
    });
    this.getByIdSchema = object({
      id: number()
    });
    this.postSchema = object({
      name: string(),
      groceries: array().of(object({
        id: number(),
        amount: number().min(1)
      })),
    })
    this.putSchema = object({
      id: number(),
      name: string(),
      groceries: array().of(object({
        id: number(),
        amount: number().min(1)
      })),
    })
  
    this.get = this.get.bind(this);
    this.getById = this.getById.bind(this);
    this.post = this.post.bind(this);
    this.put = this.put.bind(this);
    this.delete = this.delete.bind(this);
  }

  async get(req, res, next) {
    try {
      const query = await this.getSchema.validate({
        ...req.query,
        userId: req.user.id
      }, {
        stripUnknown: true
      });

      if (query.name) {
        query.name = `%${query.name.replaceAll(/[^а-яА-Яa-zA-Z0-9]/g, '')}%`
      }
      if (typeof query.name === 'string' && !query.name) {
        delete query.name
      }
      const diets = await this.dietsModel.get(query);
      res.json(diets);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = await this.getByIdSchema.validate(req.params, {
        stripUnknown: true,
      });
      const dish = await this.dietsModel.getById(id);
      res.json(dish);
    } catch (err) {
      next(err);
    }
  }

  async post(req, res, next) {
    try {
      const data = await this.postSchema.validate(req.body, {
        stripUnknown: true
      })
      const dish = await this.dietsModel.create(data, req.user.id)
      res.json(dish);
    } catch (err) {
      next(err);
    }
  }

  async put(req, res, next) {
    try {
      const data = await this.putSchema.validate({...req.body, id: req.params.id}, {
        stripUnknown: true
      })
      const dish = await this.dietsModel.update(data, req.user.id)
      res.json(dish);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = await this.getByIdSchema.validate(req.params, {
        stripUnknown: true,
      });
      await this.dietsModel.delete(id)
      res.json({});
    } catch (err) {
      next(err);
    }
  }
}

module.exports = DietsController;