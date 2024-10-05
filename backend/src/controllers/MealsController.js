const { object, number, string, array, date } = require('yup')

class MealsController {
  constructor(mealsModel) {
    this.mealsModel = mealsModel;

    this.getSchema = object({
      userId: number(),
      limit: number().min(10).max(300),
      offset: number().min(0),
    });
    this.postSchema = object({
      dishId: number(),
      userId: number(),
      eatenAt: string().test(date => new Date(date).toString() !== 'Invalid Date'),
      amount: number().min(0),
    })
    this.selectSchema = object({
      mealId: number().nullable(),
    })
    this.putSchema = object({
      id: number(),
      amount: number(),
      eatenAt: string().test(date => new Date(date).toString() !== 'Invalid Date'),
    })
  
    this.get = this.get.bind(this);
    this.post = this.post.bind(this);
    this.put = this.put.bind(this);
    this.delete = this.delete.bind(this);
    this.statistic = this.statistic.bind(this)
  }

  async get(req, res, next) {
    try {
      const query = await this.getSchema.validate({
        ...req.query,
        userId: req.user.id
      }, {
        stripUnknown: true
      });

      const meals = await this.mealsModel.get(query);
      res.json(meals);
    } catch (err) {
      next(err);
    }
  }

  async post(req, res, next) {
    try {
      const data = await this.postSchema.validate({...req.body, userId: req.user.id}, {
        stripUnknown: true
      })
      const meal = await this.mealsModel.create(data)
      res.json(meal);
    } catch (err) {
      next(err);
    }
  }

  async put(req, res, next) {
    try {
      const data = await this.putSchema.validate({...req.body, id: req.params.id}, {
        stripUnknown: true
      })
      const meal = await this.mealsModel.update(data, req.user.id)
      res.json(meal);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await this.mealsModel.delete(req.params.id)
      res.json({});
    } catch (err) {
      next(err);
    }
  }

  async statistic(req, res, next) {
    try {
      const data = await this.mealsModel.statistic(req.query.timezoneOffset || 0, req.user.id)
      res.json(data)
    } catch (err) {
      next(err)
    }
  }
}

module.exports = MealsController;