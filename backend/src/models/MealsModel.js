const HttpError = require("../errors/HttpError");
const groceries = require("../migration/groceries");

class MealsModel {
  constructor(database) {
    this.database = database;
    this.client = null;
  }

  async setup() {
    this.client = await this.database.getClient();
  }

  mapFromDB(meals) {
    return meals.reduce((acc, cur) => {
      let meal = acc.find(({ id }) => id === cur.meal_id);
      if (!meal) {
        acc.push({
          id: cur.meal_id,
          eatenAt: cur.meal_eaten_at,
          amount: cur.meal_amount,
          dishId: cur.dish_id,
          name: cur.dish_name,
          groceries: []
        })
        meal = acc[acc.length - 1];
      }
      if (cur.grocery_id !== null) {
        meal.groceries.push({
          amount: cur.grocery_amount,
          id: cur.grocery_id,
          userId: cur.grocery_user_id,
          name: cur.grocery_name,
          proteins: parseFloat(cur.grocery_proteins),
          fats: parseFloat(cur.grocery_fats),
          carbohydrates: parseFloat(cur.grocery_carbohydrates),
          isLiquid: cur.grocery_is_liquid
        })
      }
      return acc;
    }, [])
  }

  async get(params = {}) {
    const queryParams = [];
    const where = [];
    
    where.push(`user_id = $${queryParams.length + 1}`);
    queryParams.push(params.userId);

    queryParams.push(params.limit || 20);
    const limit = `LIMIT $${queryParams.length}`;
    queryParams.push(params.offset || 0);
    const offset = `OFFSET $${queryParams.length}`;

    const [meals, total] = await Promise.all([
      this.client.query(`
          SELECT
            m.id as meal_id, m.eaten_at as meal_eaten_at, m.amount as meal_amount,
            dishes.id as dish_id, dishes.name as dish_name,
            dg.amount as grocery_amount, g.id as grocery_id, g.user_id as grocery_user_id, g.name as grocery_name, g.proteins as grocery_proteins, g.fats as grocery_fats, g.carbohydrates as grocery_carbohydrates, g.is_liquid as grocery_is_liquid
          FROM (SELECT * FROM meals ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY eaten_at DESC ${limit} ${offset}) m
          LEFT JOIN dishes ON dishes.id = m.dish_id
          LEFT JOIN dishes_groceries dg ON dg.dish_id = dishes.id
          LEFT JOIN groceries g ON dg.grocery_id = g.id
          ORDER BY m.eaten_at DESC
        `,
        queryParams
      ),
      this.client.query(
        `SELECT COUNT(*) FROM meals WHERE ${where.join(' AND ')}`,
        queryParams.slice(0, -2)
      ),
    ]);
    
    return {
      meals: this.mapFromDB(meals.rows),
      total: parseInt(total.rows[0].count)
    };
  }

  async getById(id) {
    const { rows } = await this.client.query(`
      SELECT
        m.id as meal_id, m.eaten_at as meal_eaten_at, m.amount as meal_amount,
        dishes.id as dish_id, dishes.name as dish_name,
        dg.amount as grocery_amount, g.id as grocery_id, g.user_id as grocery_user_id, g.name as grocery_name, g.proteins as grocery_proteins, g.fats as grocery_fats, g.carbohydrates as grocery_carbohydrates, g.is_liquid as grocery_is_liquid
      FROM meals m
      LEFT JOIN dishes ON dishes.id = m.dish_id
      LEFT JOIN dishes_groceries dg ON dg.dish_id = dishes.id
      LEFT JOIN groceries g ON dg.grocery_id = g.id
      WHERE m.id = $1
    `, [id]);
    return this.mapFromDB(rows);
  }

  async getSelected(userId) {
    const user = await this.client.query('SELECT selected_meal_id FROM users WHERE id = $1', [userId])
    if (user.rows[0].selected_meal_id === null) {
      return null
    }
    return (await this.getById(user.rows[0].selected_meal_id))[0]
  }

  async select(mealId, userId) {
    await this.client.query('UPDATE users SET selected_meal_id = $1 WHERE id = $2', [mealId, userId])
  }

  async create(meal) {
    try {
      const eatenAt = new Date(new Date(meal.eatenAt).getTime() - new Date().getTimezoneOffset() * 60000).toISOString()
      await this.client.query('BEGIN')
      const { rows } = await this.client.query(`
          INSERT INTO meals(dish_id, user_id, eaten_at, amount)
          VALUES($1, $2, $3, $4)
          RETURNING id
        `,
        [meal.dishId, meal.userId, eatenAt, meal.amount]
      )
      await this.client.query('COMMIT')
      return this.getById(rows[0].id)
    } catch (err) {
      await this.client.query('ROLLBACK')
      throw err;
    }
  }

  async update(meal, userId) {
    try {
      await this.client.query('BEGIN')
      const issetMeal = await this.client.query('SELECT id FROM meals WHERE id = $1 AND user_id = $2', [meal.id, userId])
      if (!issetMeal.rows.length) throw new HttpError('Not found', 404)

      const eatenAt = new Date(new Date(meal.eatenAt).getTime() - new Date().getTimezoneOffset() * 60000).toISOString()
      const { rows } = await this.client.query('UPDATE meals SET amount = $1, eaten_at = $2 WHERE id = $3 RETURNING id',
        [meal.amount, eatenAt, meal.id]
      )
      
      await this.client.query('COMMIT')
      return this.getById(rows[0].id)
    } catch (err) {
      await this.client.query('ROLLBACK')
      throw err;
    }
  }

  async delete(id) {
    await this.client.query('DELETE FROM meals WHERE id = $1', [id]);
  }
}

module.exports = MealsModel;