const db = require('./db')

async function groceriesTable() {
  await db.query(`
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  login VARCHAR(150) NOT NULL,
  password VARCHAR(150) NOT NULL
);
`)
}

db.connect()
  .then(async () => {
    try {
      await groceriesTable();
      console.log('Success groceriesTable');
    } catch (err) {
      console.error(err);
    }
  })