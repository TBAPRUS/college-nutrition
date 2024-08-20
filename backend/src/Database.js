const pg = require('pg')

class Database {
  constructor() {
    this.pool = new pg.Pool({
      host: 'localhost',
      port: 5432,
      database: 'nutrition',
      user: 'admin',
      password: 'secretpassword123',
    })
  }

  getClient() {
    return this.pool.connect();
  }
}

module.exports = Database;