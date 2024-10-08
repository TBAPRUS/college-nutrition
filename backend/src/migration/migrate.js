const Database = require('../Database');
const AuthModel = require('../models/AuthModel');
const groceries = require('./groceries');

class Migrator {
  constructor (database, authModel) {
    this.database = database;
    this.authModel = authModel;
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
      await this.dishesTable();
      console.log('Success dishesTable');
      await this.fillDishes();
      console.log('Success fillDishes');
      await this.dishesGroceriesTable();
      console.log('Success dishesGroceriesTable');
      await this.fillDishesGroceriesTable();
      console.log('Success fillDishesGroceriesTable');
      await this.mealsTable();
      console.log('Success mealsTable');
      await this.fillMealsTable();
      console.log('Success fillMealsTable');
      await this.dietsTable();
      console.log('Success dietsTable');
      await this.fillDietsTable();
      console.log('Success fillDietsTable');
      await this.dietsDishesTable();
      console.log('Success dietsDishesTable');
      await this.fillDietsDishesTable();
      console.log('Success fillDietsDishesTable');

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

  async groceriesTable() {
    await this.client.query(`
CREATE TABLE IF NOT EXISTS groceries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(256) NOT NULL,
  proteins NUMERIC(5, 2) NOT NULL,
  fats NUMERIC(5, 2) NOT NULL,
  carbohydrates NUMERIC(5, 2) NOT NULL,
  is_liquid BOOLEAN NOT NULL
)
    `);
  }

  async dishesTable() {
    await this.client.query(`
CREATE TABLE IF NOT EXISTS dishes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  name VARCHAR(256) NOT NULL
)
    `);
  }

  async dishesGroceriesTable() {
    await this.client.query(`
CREATE TABLE IF NOT EXISTS dishes_groceries (
  dish_id INTEGER REFERENCES dishes(id) ON DELETE CASCADE NOT NULL,
  grocery_id INTEGER REFERENCES groceries(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  PRIMARY KEY (dish_id, grocery_id)
)
    `);
  }

  async mealsTable() {
    await this.client.query(`
CREATE TABLE IF NOT EXISTS meals (
  id SERIAL PRIMARY KEY,
  dish_id INTEGER REFERENCES dishes(id) ON DELETE CASCADE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  eaten_at TIMESTAMP NOT NULL,
  amount INTEGER NOT NULL
)
    `);
  }

  async dietsTable() {
    await this.client.query(`
CREATE TABLE IF NOT EXISTS diets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  name VARCHAR(256) NOT NULL
)
    `);
    await this.client.query(`
ALTER TABLE users
ADD selected_diet_id INTEGER REFERENCES diets(id) ON DELETE SET NULL
    `);
  }

  async dietsDishesTable() {
    await this.client.query(`
CREATE TABLE IF NOT EXISTS diets_dishes (
  id SERIAL PRIMARY KEY,
  diet_id INTEGER REFERENCES diets(id) ON DELETE CASCADE NOT NULL,
  dish_id INTEGER REFERENCES dishes(id) ON DELETE CASCADE NOT NULL,
  time TIME NOT NULL,
  amount INTEGER NOT NULL
)
    `);
  }

  async fillGroceries() {
    await Promise.all(groceries.map((grocery) => this.client.query(
      'INSERT INTO groceries(name, proteins, fats, carbohydrates, is_liquid) VALUES($1, $2, $3, $4, $5)',
      grocery
    )));
    // await Promise.all(groceries.map((grocery) => this.client.query(
    //   'INSERT INTO groceries(name, proteins, fats, carbohydrates, is_liquid, user_id) VALUES($1, $2, $3, $4, $5, $6)',
    //   [...grocery, 2]
    // )));
  }

  async fillDishes() {
    const dishes = [
      [2, 'Вареная гречка'],
      [2, 'Плов'],
      [2, 'Чай черный без сахара'],
      [2, 'Жаркое из курицы с картошкой']
    ]
    await Promise.all(dishes.map((dish) => this.client.query(
      'INSERT INTO dishes(user_id, name) VALUES($1, $2)',
      dish
    )))
  }

  async fillDishesGroceriesTable() {
    const data = [
      [1, 97, 100],
      [1, 179, 200],
      [2, 99, 1000],
      [2, 6, 1000],
      [2, 112, 1000],
      [2, 113, 200],
      [2, 180, 50],
      [2, 62, 250],
      [3, 169, 100],
      [4, 6, 500],
      [4, 110, 600],
      [4, 121, 200],
      [4, 109, 100],
      [4, 113, 130],
      [4, 180, 100],
      [4, 133, 20],
      [4, 138, 10],
      [4, 62, 75],
    ]
    await Promise.all(data.map((row) => this.client.query(
      'INSERT INTO dishes_groceries(dish_id, grocery_id, amount) VALUES($1, $2, $3)',
      row
    )))
  }

  async fillDietsTable() {
    const data = [
      [2, 'Будний день (еда с собой)'],
      [2, 'Будний день (столовая)'],
      [2, 'Тренировка - набор массы (3500 ккал)'],
    ]
    await Promise.all(data.map((row) => this.client.query(
      'INSERT INTO diets(user_id, name) VALUES($1, $2)',
      row
    )))
  }

  async fillDietsDishesTable() {
    const data = [
      [1, 1, '8:00', 250],
      [1, 3, '8:05', 450],
      [1, 2, '12:10', 400],
      [1, 4, '19:30', 400],
    ]
    await Promise.all(data.map((row) => this.client.query(
      'INSERT INTO diets_dishes(diet_id, dish_id, time, amount) VALUES($1, $2, $3, $4)',
      row
    )))
  }

  getDate(hoursAgo, minutesAge = 0) {
    const date = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    date.setHours(date.getHours() - hoursAgo)
    date.setMinutes(date.getMinutes() - minutesAge)
    return date.toISOString()
  }

  async fillMealsTable() {
    const data = [
      [1, 2, 0, 0, 470],
      [2, 2, 1, 0, 300],
      [3, 2, 2, 45, 500],
      [4, 2, 8, 25, 220],
      [1, 2, 12, 0, 350],
      [2, 2, 23, 11, 455],
      [3, 2, 34, 45, 233],
      [4, 2, 36, 2, 160],
      [3, 2, 56, 2, 600],
      [4, 2, 64, 2, 160],
      [4, 2, 78, 2, 160],
      [3, 2, 87, 2, 160],
      [4, 2, 95, 2, 160],
      [1, 2, 111, 0, 470],
      [1, 2, 111, 0, 470],
      [1, 2, 120, 0, 470],
      [4, 2, 144, 2, 160],
      [4, 2, 156, 2, 160],
    ]
    await Promise.all(data.map((row) => this.client.query(
      'INSERT INTO meals(dish_id, user_id, eaten_at, amount) VALUES($1, $2, $3, $4)',
      [row[0], row[1], this.getDate(row[2], row[3]), row[4]]
    )))
  }

  async fillAdmins() {
    await this.client.query(
      'INSERT INTO users(login, password, is_admin) VALUES($1, $2, $3)',
      ['admin', await this.authModel.genHash('admin'), true],
    )
  }

  async fillUsers() {
    const users = [
      ['user1', await this.authModel.genHash('user1')],
      ['user2', await this.authModel.genHash('user2')]
    ]
    await Promise.all((users.map((user) => this.client.query(
      'INSERT INTO users(login, password) VALUES($1, $2)',
      user,
    ))))
  }
}

async function main() {
  const database = new Database();
  const authModel = new AuthModel('');
  const migrator = new Migrator(database, authModel);
  await migrator.migrate();
  process.exit();
}

main();