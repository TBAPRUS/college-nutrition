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
    if (params.userId !== undefined) {
      if (params.userId === null) {
        where.push('user_id IS NULL');
      } else {
        where.push(`user_id = $${queryParams.length + 1}`);
        queryParams.push(params.userId);
      }
    }
    if (typeof params.name === 'string') {
      where.push(`name LIKE $${queryParams.length + 1}`);
      queryParams.push(params.name);
    }
    if (typeof params.isLiquid === 'boolean') {
      where.push(`is_liquid = $${queryParams.length + 1}`);
      queryParams.push(params.isLiquid);
    }

    let orderBy = '';
    if (params.orderBy && ['id', 'name', 'proteins', 'fats', 'carbohydrates'].includes(params.orderBy)) {
      orderBy = `ORDER BY ${params.orderBy} ${params.order?.toLowerCase() === 'desc' ? 'DESC' : 'ASC'}`;
    }

    const limit = `LIMIT $${queryParams.length + 1}`;
    queryParams.push(params.limit || 20);
    const offset = `OFFSET $${queryParams.length + 1}`;
    queryParams.push(params.offset || 0);

    const [groceries, total] = await Promise.all([
      await this.client.query(
        `SELECT * FROM groceries ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ${orderBy} ${limit} ${offset}`,
        queryParams
      ),
      await this.client.query(
        `SELECT COUNT(*) FROM groceries ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ${orderBy} ${limit} ${offset}`,
        queryParams
      )
    ]);
    
    return {
      groceries: groceries.rows,
      total: total.rows[0].count
    };
  }

  async getById(id) {
    const { rows } = await this.client.query('SELECT * FROM groceries WHERE id = $1', [id]);
    return rows[0];
  }
}

module.exports = GroceriesModel;