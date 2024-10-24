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
      userId: number(),
      name: string()
    })
    this.selectSchema = object({
      dietId: number().nullable(),
    })
    this.putSchema = object({
      id: number(),
      name: string(),
      dishes: array().of(object({
        id: number(),
        amount: number().min(1),
        time: string()
      })),
    })
  
    this.get = this.get.bind(this);
    this.getById = this.getById.bind(this);
    this.getSelected = this.getSelected.bind(this);
    this.select = this.select.bind(this);
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
        query.name = `%${query.name}%`
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
      const diet = await this.dietsModel.getById(id);
      res.json(diet);
    } catch (err) {
      next(err);
    }
  }

  async getSelected(req, res, next) {
    try {
      const diet = await this.dietsModel.getSelected(req.user.id)
      res.json(diet)
    } catch (err) {
      next(err)
    }
  }

  async select(req, res, next) {
    try {
      const { dietId } = await this.selectSchema.validate(req.body, {
        stripUnknown: true
      })
      await this.dietsModel.select(dietId, req.user.id)
      res.json()
    } catch (err) {
      next(err)
    }
  }

  async post(req, res, next) {
    try {
      const data = await this.postSchema.validate({...req.body, userId: req.user.id}, {
        stripUnknown: true
      })
      const diet = await this.dietsModel.create(data)
      res.json(diet);
    } catch (err) {
      next(err);
    }
  }

  async put(req, res, next) {
    try {
      const data = await this.putSchema.validate({...req.body, id: req.params.id}, {
        stripUnknown: true
      })
      const diet = await this.dietsModel.update(data, req.user.id)
      res.json(diet);
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