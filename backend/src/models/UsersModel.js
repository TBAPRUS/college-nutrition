const Database = require("../Database")

class UsersModel {

  constructor(database) {
    this.database = database;
    this.client = null;
  }

  async setup() {
    this.client = await this.database.getClient();
  }

  mapUser(user) {
    return { 
      id: user.id,
      login: user.login,
      isAdmin: user.is_admin
    }
  }

  async get(params = {}) {
    const queryParams = [];
    const where = [];
      
    if (typeof params.login === 'string') {
      where.push(`LOWER(login) LIKE $${queryParams.length + 1}`);
      queryParams.push(params.login.toLowerCase());
    }
    
    queryParams.push(params.limit || 20);
    const limit = `LIMIT $${queryParams.length}`;
    queryParams.push(params.offset || 0);
    const offset = `OFFSET $${queryParams.length}`;
    
    const [dishes, total] = await Promise.all([
      await this.client.query(`
          SELECT id, login, is_admin
          FROM users
          ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
          ORDER BY login ASC
          ${limit} ${offset}
        `,
        queryParams
      ),
      await this.client.query(
        `SELECT COUNT(*) FROM users ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`,
        queryParams.slice(0, -2)
      )
    ]);
    return {
      users: dishes.rows.map(this.mapUser),
      total: parseInt(total.rows[0].count)
    };
  }

  async create(login, password) {
    const res = await this.client.query(
      'INSERT INTO users(login, password) VALUES($1, $2) RETURNING id',
      [login, password]
    )
    const id = res.rows[0].id;
    return id;
  }
  
  async makeAdmin(id) {
    await this.client.query(
      'UPDATE users SET is_admin = $1 WHERE id = $2',
      [true, id]
    )
  }

  async findByLogin(login) {
    const res = await this.client.query(
      'SELECT * FROM users WHERE login = $1',
      [login]
    );
    return res.rows[0];
  }

  async findById(id) {
    const res = await this.client.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    delete res.rows[0].password;
    return this.mapUser(res.rows[0]);
  }

  async update(user) {
    let data = null
    if (user.password) {
      data = await this.client.query(
        'UPDATE users SET login = $1, password = $2 WHERE id = $3 and is_admin = FALSE RETURNING *',
        [user.login, user.password, user.id]
      )
    } else {
      data = await this.client.query(
        'UPDATE users SET login = $1 WHERE id = $2 and is_admin = FALSE RETURNING *',
        [user.login, user.id]
      )
    }
    if (data.rows[0]) {
      return this.mapUser(data.rows[0]);
    }
    return null
  }
}

module.exports = UsersModel;