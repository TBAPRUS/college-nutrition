const HttpError = require("../errors/HttpError");

class DishesModel {
  constructor(database) {
    this.database = database;
    this.client = null;
  }

  async setup() {
    this.client = await this.database.getClient();
  }

  mapFromDB(dishes) {
    return dishes.reduce((acc, cur) => {
      let dish = acc.find(({ id }) => id === cur.dish_id);
      if (!dish) {
        acc.push({
          id: cur.dish_id,
          name: cur.dish_name,
          userId: cur.dish_user_id,
          groceries: []
        })
        dish = acc[acc.length - 1];
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

    const [dishes, total] = await Promise.all([
      await this.client.query(`
          SELECT
            d.id as dish_id, d.name as dish_name, d.user_id as dish_user_id,
            dg.amount as grocery_amount,
            g.id as grocery_id, g.user_id as grocery_user_id, g.name as grocery_name, g.proteins as grocery_proteins, g.fats as grocery_fats, g.carbohydrates as grocery_carbohydrates, g.is_liquid as grocery_is_liquid
          FROM (SELECT * FROM dishes ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY name ASC ${limit} ${offset}) d
          LEFT JOIN dishes_groceries dg ON dg.dish_id = d.id
          LEFT JOIN groceries g ON dg.grocery_id = g.id
          ORDER BY d.name ASC
        `,
        queryParams
      ),
      await this.client.query(
        `SELECT COUNT(*) FROM dishes ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`,
        queryParams.slice(0, -2)
      )
    ]);
    return {
      dishes: this.mapFromDB(dishes.rows),
      total: parseInt(total.rows[0].count)
    };
  }

  async getById(id) {
    const { rows } = await this.client.query(`
      SELECT
        d.id as dish_id, d.name as dish_name, d.user_id as dish_user_id,
        dg.amount as grocery_amount,
        g.id as grocery_id, g.user_id as grocery_user_id, g.name as grocery_name, g.proteins as grocery_proteins, g.fats as grocery_fats, g.carbohydrates as grocery_carbohydrates, g.is_liquid as grocery_is_liquid
      FROM dishes d
      LEFT JOIN dishes_groceries dg ON dg.dish_id = d.id
      LEFT JOIN groceries g ON dg.grocery_id = g.id
      WHERE d.id = $1
    `, [id]);
    return this.mapFromDB(rows);
  }

  async create(dish, userId) {
    try {
      await this.client.query('BEGIN')
      const { rows } = await this.client.query(`
          INSERT INTO dishes(user_id, name)
          VALUES($1, $2)
          RETURNING id
        `,
        [userId, dish.name]
      )
      if (dish?.groceries?.length) {
        this.client.query(`
          INSERT INTO dishes_groceries(dish_id, grocery_id, amount)
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
      const issetDish = await this.client.query('SELECT id FROM dishes WHERE id = $1 AND user_id = $2', [dish.id, userId])
      if (!issetDish.rows.length) throw new HttpError('Not found', 404)

      const { rows } = await this.client.query('UPDATE dishes SET name = $1 WHERE id = $2 RETURNING id',
        [dish.name, dish.id]
      )
      await this.client.query('DELETE FROM dishes_groceries WHERE dish_id = $1', [dish.id])
      if (dish?.groceries?.length) {
        this.client.query(`
          INSERT INTO dishes_groceries(dish_id, grocery_id, amount)
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
    await this.client.query('DELETE FROM dishes WHERE id = $1', [id]);
  }
}

module.exports = DishesModel;