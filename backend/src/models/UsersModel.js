const Database = require("../Database")

class UsersModel {
  constructor(database) {
    this.database = database;
    this.client = null;
  }

  async setup() {
    this.client = await this.database.getClient();
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
}

module.exports = UsersModel;