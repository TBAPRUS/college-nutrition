const Database = require('../Database');
const AuthService = require('../services/AuthService');
const groceries = require('./groceries');

class Migrator {
  constructor (database, authService) {
    this.database = database;
    this.authService = authService;
    this.client = null;
  }

  async migrate() {
    try {
      this.client = await this.database.getClient();

      this.client.query('BEGIN');
      
      await this.usersTable();
      console.log('Success usersTable');
      await this.fillAdmins();
      console.log('Success fillAdmins');
      await this.fillUsers();
      console.log('Success fillUsers');
      await this.groceriesTable();
      console.log('Success groceriesTable');
      await this.fillGroceries();
      console.log('Success fillGroceries');

      await this.client.query('COMMIT');
      console.log('Success migrate')
    } catch (err) {
      console.error(err)
      if (this.client) {
        await this.client.query('ROLLBACK');
      }
    } finally {
      if (this.client) {
        await this.client.release();
      }
    }
  }

  async usersTable() {
    await this.client.query(`
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  login VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(150) NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE
);
  `);
  }

  async fillAdmins() {
    await this.client.query(
      'INSERT INTO users(login, password, is_admin) VALUES($1, $2, $3)',
      ['admin', await this.authService.genHash('admin'), true],
    )
  }

  async fillUsers() {
    const users = [
      ['user1', await this.authService.genHash('user1')],
      ['user2', await this.authService.genHash('user2')]
    ]
    await Promise.all((users.map((user) => this.client.query(
      'INSERT INTO users(login, password) VALUES($1, $2)',
      user,
    ))))
  }

  async groceriesTable() {
    await this.client.query(`
CREATE TABLE IF NOT EXISTS groceries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(128) NOT NULL,
  proteins NUMERIC(5, 2) NOT NULL,
  fats NUMERIC(5, 2) NOT NULL,
  carbohydrates NUMERIC(5, 2) NOT NULL,
  is_liquid BOOLEAN NOT NULL
)
    `);
  }

  async fillGroceries() {
    await Promise.all((groceries.map((grocery) => this.client.query(
      'INSERT INTO groceries(name, proteins, fats, carbohydrates, is_liquid) VALUES($1, $2, $3, $4, $5)',
      grocery
    ))));
  }
}

async function main() {
  const database = new Database();
  const authService = new AuthService('');
  const migrator = new Migrator(database, authService);
  await migrator.migrate();
  process.exit();
}

main();