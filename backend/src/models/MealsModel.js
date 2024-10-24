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

  async statistic(timezoneOffset, userId) {
    let to = new Date(new Date().getTime() - timezoneOffset * 60000);
    to.setDate(to.getDate() + 1)
    to.setHours(0, 0, 0, 0)
    let from = new Date();
    from.setDate(from.getDate() - 7);
    from.setHours(0, 0, 0, 0)
    from = new Date(from.getTime() - timezoneOffset * 60000)
    const data = await this.client.query(`
        SELECT 
          m.id as meal_id, m.eaten_at as meal_eaten_at, m.amount as meal_amount,
          dg.amount as grocery_amount, g.proteins as grocery_proteins, g.fats as grocery_fats, g.carbohydrates as grocery_carbohydrates
        FROM meals m
        LEFT JOIN dishes ON dishes.id = m.dish_id
        LEFT JOIN dishes_groceries dg ON dg.dish_id = dishes.id
        LEFT JOIN groceries g ON dg.grocery_id = g.id
        WHERE eaten_at < $1 AND eaten_at >= $2 AND m.user_id = $3
      `,
      [to, from, userId]
    )
    return this.mapFromDB(data.rows).map((meal) => {
        let weight = 0;
        let proteins = 0;
        let fats = 0;
        let carbohydrates = 0;

        meal.groceries.forEach((grocery) => {
          weight += grocery.amount;
          proteins += grocery.proteins * grocery.amount / 100;
          fats += grocery.fats * grocery.amount / 100;
          carbohydrates += grocery.carbohydrates * grocery.amount / 100;
        })

        if (weight === 0) return {...meal, calories: 0, proteins: 0, fats: 0, carbohydrates: 0}

        return {
          ...meal,
          calories: (proteins * 4.1 + fats * 9.29 + carbohydrates * 4.2) / weight * meal.amount,
          proteins: proteins / weight * meal.amount,
          fats: fats / weight * meal.amount,
          carbohydrates: carbohydrates / weight * meal.amount,
        }
      }).reduce((acc, cur) => {
        const date = new Date(new Date(cur.eatenAt).getTime() + new Date().getTimezoneOffset() * 60000 - timezoneOffset * 60000)
        date.setHours(0, 0, 0, 0)
        if (!acc[date.toISOString()]) {
          acc[date.toISOString()] = {calories: 0, proteins: 0, fats: 0, carbohydrates: 0}  
        }
        acc[date.toISOString()].calories += cur.calories
        acc[date.toISOString()].proteins += cur.proteins
        acc[date.toISOString()].fats += cur.fats
        acc[date.toISOString()].carbohydrates += cur.carbohydrates
        return acc
      }, {})
  }
}

module.exports = MealsModel;