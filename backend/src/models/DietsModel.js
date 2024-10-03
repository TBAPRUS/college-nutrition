const HttpError = require("../errors/HttpError");
const groceries = require("../migration/groceries");

class DietsModel {
  constructor(database) {
    this.database = database;
    this.client = null;
  }

  async setup() {
    this.client = await this.database.getClient();
  }

  mapFromDB(diets) {
    return diets.reduce((acc, cur) => {
      let diet = acc.find(({ id }) => id === cur.diet_id);
      if (!diet) {
        acc.push({
          id: cur.diet_id,
          name: cur.diet_name,
          dishes: []
        })
        diet = acc[acc.length - 1];
      }
      if (cur.dish_id !== null) {
        let dish = diet.dishes.find(({ id }) => id === cur.dish_id);
        if (!dish) {
          diet.dishes.push({
            time: cur.dish_time,
            amount: cur.dish_amount,
            id: cur.dish_id,
            name: cur.dish_name,
            groceries: []
          })
          dish = diet.dishes[diet.dishes.length - 1]
        }
        if (cur.grocery_id !== null) {
          dish.groceries.push({
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
      }
      return acc;
    }, [])
  }

  async get(params = {}) {
    const queryParams = [];
    const where = [];
    
    where.push(`user_id = $${queryParams.length + 1}`);
    queryParams.push(params.userId);
      
    if (typeof params.name === 'string') {
      where.push(`LOWER(name) LIKE $${queryParams.length + 1}`);
      queryParams.push(params.name.toLowerCase());
    }

    queryParams.push(params.limit || 20);
    const limit = `LIMIT $${queryParams.length}`;
    queryParams.push(params.offset || 0);
    const offset = `OFFSET $${queryParams.length}`;

    const [diets, total] = await Promise.all([
      await this.client.query(`
          SELECT
            diets.id as diet_id, diets.name as diet_name,
            dd.time as dish_time, dd.amount as dish_amount, dishes.id as dish_id, dishes.name as dish_name,
            dg.amount as grocery_amount, g.id as grocery_id, g.user_id as grocery_user_id, g.name as grocery_name, g.proteins as grocery_proteins, g.fats as grocery_fats, g.carbohydrates as grocery_carbohydrates, g.is_liquid as grocery_is_liquid
          FROM (SELECT * FROM diets ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY name ASC ${limit} ${offset}) diets
          LEFT JOIN diets_dishes dd ON dd.diet_id = diets.id
          LEFT JOIN dishes ON dishes.id = dd.dish_id
          LEFT JOIN dishes_groceries dg ON dg.dish_id = dishes.id
          LEFT JOIN groceries g ON dg.grocery_id = g.id
          ORDER BY diets.name ASC
        `,
        queryParams
      ),
      await this.client.query(
        `SELECT COUNT(*) FROM diets ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`,
        queryParams.slice(0, -2)
      )
    ]);
    return {
      diets: this.mapFromDB(diets.rows),
      total: parseInt(total.rows[0].count)
    };
  }

  async getById(id) {
    const { rows } = await this.client.query(`
      SELECT
        d.id as dish_id, d.name as dish_name, d.user_id as dish_user_id,
        dg.amount as grocery_amount,
        g.id as grocery_id, g.user_id as grocery_user_id, g.name as grocery_name, g.proteins as grocery_proteins, g.fats as grocery_fats, g.carbohydrates as grocery_carbohydrates, g.is_liquid as grocery_is_liquid
      FROM diets d
      LEFT JOIN diets_groceries dg ON dg.dish_id = d.id
      LEFT JOIN groceries g ON dg.grocery_id = g.id
      WHERE d.id = $1
    `, [id]);
    return this.mapFromDB(rows);
  }

  async create(dish, userId) {
    try {
      await this.client.query('BEGIN')
      const { rows } = await this.client.query(`
          INSERT INTO diets(user_id, name)
          VALUES($1, $2)
          RETURNING id
        `,
        [userId, dish.name]
      )
      if (dish?.groceries?.length) {
        this.client.query(`
          INSERT INTO diets_groceries(dish_id, grocery_id, amount)
          VALUES${dish.groceries.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`).join(',')}
          `, dish.groceries.flatMap((grocery) => [rows[0].id, grocery.id, grocery.amount])
        )
      }
      await this.client.query('COMMIT')
      return this.getById(rows[0].id)
    } catch (err) {
      await this.client.query('ROLLBACK')
      throw err;
    }
  }

  async update(dish, userId) {
    try {
      await this.client.query('BEGIN')
      const issetDish = await this.client.query('SELECT id FROM diets WHERE id = $1 AND user_id = $2', [dish.id, userId])
      if (!issetDish.rows.length) throw new HttpError('Not found', 404)

      const { rows } = await this.client.query('UPDATE diets SET name = $1 WHERE id = $2 RETURNING id',
        [dish.name, dish.id]
      )
      await this.client.query('DELETE FROM diets_groceries WHERE dish_id = $1', [dish.id])
      if (dish?.groceries?.length) {
        this.client.query(`
          INSERT INTO diets_groceries(dish_id, grocery_id, amount)
          VALUES${dish.groceries.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`).join(',')}
          `, dish.groceries.flatMap((grocery) => [rows[0].id, grocery.id, grocery.amount])
        )
      }
      await this.client.query('COMMIT')
      return this.getById(rows[0].id)
    } catch (err) {
      await this.client.query('ROLLBACK')
      throw err;
    }
  }

  async delete(id) {
    await this.client.query('DELETE FROM diets WHERE id = $1', [id]);
  }
}

module.exports = DietsModel;