const Database = require('./Database')

const database = new Database();
database.getClient()
  .then(async (client) => {
    try {
      await client.query(`
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
      `);
      console.log('Success clear');
    } catch (err) {
      console.error(err);
    }
    process.exit();
  });