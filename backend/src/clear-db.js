const db = require('./db')

db.connect()
  .then(async () => {
    try {
      await db.query(`
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
`)
      console.log('Success clear');
    } catch (err) {
      console.error(err);
    }
  })