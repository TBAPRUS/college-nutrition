class GroceriesModel {
  constructor(database) {
    this.database = database;
    this.client = null;
  }

  async setup() {
    this.client = await this.database.getClient();
  }

  async get(params = {}) {
    const queryParams = [];
    const where = [];
    if (params.userId === undefined) {
      where.push('user_id IS NULL');
    } else {
      where.push(`user_id = $${queryParams.length + 1}`);
      queryParams.push(params.userId);
    }
    if (typeof params.name === 'string') {
      where.push(`LOWER(name) LIKE $${queryParams.length + 1}`);
      queryParams.push(params.name.toLowerCase());
    }
    if (typeof params.isLiquid === 'boolean') {
      where.push(`is_liquid = $${queryParams.length + 1}`);
      queryParams.push(params.isLiquid);
    }

    let orderBy = '';
    if (params.orderBy && ['id', 'name', 'proteins', 'fats', 'carbohydrates'].includes(params.orderBy)) {
      orderBy = `ORDER BY ${params.orderBy} ${params.order?.toLowerCase() === 'desc' ? 'DESC' : 'ASC'}`;
    } else {
      orderBy = `ORDER BY name ASC`;
    }

    const limit = `LIMIT $${queryParams.length + 1}`;
    queryParams.push(params.limit || 20);
    const offset = `OFFSET $${queryParams.length + 1}`;
    queryParams.push(params.offset || 0);

    const [groceries, total] = await Promise.all([
      await this.client.query(`
          SELECT *
          FROM 
            (SELECT groceries.id, COUNT(dish_id) as dishes_count
            FROM
              (SELECT id FROM groceries ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ${orderBy} ${limit} ${offset}) groceries
            LEFT JOIN dishes_groceries dg ON dg.grocery_id = groceries.id
            GROUP BY groceries.id) g
          INNER JOIN groceries ON groceries.id = g.id
          ${orderBy}
        `,
        queryParams
      ),
      await this.client.query(
        `SELECT COUNT(*) FROM groceries ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`,
        queryParams.slice(0, -2)
      )
    ]);
    return {
      groceries: groceries.rows.map((grocery) => ({
        ...grocery,
        dish_count: parseInt(grocery.dish_count)
      })),
      total: parseInt(total.rows[0].count)
    };
  }

  async getById(id) {
    const { rows } = await this.client.query('SELECT * FROM groceries WHERE id = $1', [id]);
    return rows[0];
  }

  async create(grocery, userId) {
    let res = null
    if (userId) {
      const { rows } = await this.client.query(
        `INSERT INTO groceries(user_id, name, proteins, fats, carbohydrates, is_liquid) VALUES($1, $2, $3, $4, $5, $6) RETURNING *`,
        [userId, grocery.name, grocery.proteins, grocery.fats, grocery.carbohydrates, grocery.isLiquid]
      )
      res = rows[0];
    } else {
      const { rows } = await this.client.query(
        `INSERT INTO groceries(name, proteins, fats, carbohydrates, is_liquid) VALUES($1, $2, $3, $4, $5) RETURNING *`,
        [grocery.name, grocery.proteins, grocery.fats, grocery.carbohydrates, grocery.isLiquid]
      )
      res = rows[0];
    }
    return res
  }

  async delete(id) {
    await this.client.query('DELETE FROM groceries WHERE id = $1', [id]);
  }
}

module.exports = GroceriesModel;