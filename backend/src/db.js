const pg = require('pg')

module.exports = db = new pg.Client({
  host: 'localhost',
  port: 5432,
  database: 'nutrition',
  user: 'admin',
  password: 'secretpassword123',
})