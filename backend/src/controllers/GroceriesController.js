const { object, number, string, boolean } = require('yup')

class GroceriesController {
  constructor(groceriesModel) {
    this.groceriesModel = groceriesModel;

    this.getSchema = object({
      userId: number().optional(),
      name: string(),
      isLiquid: boolean(),
      orderBy: string(),
      order: string(),
      limit: number().min(10).max(100),
      offset: number().min(0),
    });
    this.getByIdSchema = object({
      id: number()
    });
  
    this.get = this.get.bind(this);
    this.getById = this.getById.bind(this);
  }


  groceryToCamelCase(grocery) {
    return {
      id: grocery.id,
      userId: grocery.user_id,
      name: grocery.name,
      proteins: grocery.proteins,
      fats: grocery.fats,
      carbohydrates: grocery.carbohydrates,
      isLiquid: grocery.is_liquid
    }
  }

  async get(req, res, next) {
    try {
      const query = await this.getSchema.validate(req.query, {
        stripUnknown: true
      });
      if (query.userId < 0) {
        query.userId = null;
      } else if (query.userId !== req.user.id && !req.user.isAdmin) {
        query.userId = undefined;
      }
      if (query.name) {
        query.name = `%${query.name.replaceAll(/[^а-яА-Яa-zA-Z]/g, '')}%`
      }
      const groceries = await this.groceriesModel.get(query);
      groceries.groceries = groceries.groceries.map(this.groceryToCamelCase);
      res.json(groceries);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = await this.getByIdSchema.validate(req.params, {
        stripUnknown: true,

      });
      const grocery = await this.groceriesModel.getById(id);
      res.json(
        this.groceryToCamelCase(grocery)
      );
    } catch (err) {
      next(err);
    }
  }

  async post(req, res) {

  }

  async put(req, res) {

  }
}

module.exports = GroceriesController;