const express = require('express');
const groceries = require('./controllers/groceries');
const db = require('./db');

const app = express()

app.post('/login', () => {})
app.post('/register', () => {})
app.get('/logout', () => {})

app.get('/groceries', groceries.get)

db.connect()
  .then(() => {
    console.log('db connected')
    app.listen(8000, () => {
      console.log('server listening on 8000')
    });
  })