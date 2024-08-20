const express = require('express');
const cookieParser = require('cookie-parser');
const AuthController = require('./controllers/AuthController');
const GroceriesController = require('./controllers/GroceriesController');
const AuthService = require('./services/AuthService');
const UsersModel = require('./models/UsersModel')
const Database = require('./Database');
const ErrorHandler = require('./errors/ErrorHandler');
const GroceriesModel = require('./models/GroceriesModel');

const database = new Database();
const authService = new AuthService('secret');
const usersModel = new UsersModel(database);
const groceriesModel = new GroceriesModel(database);
const authController = new AuthController(authService, usersModel);
const groceriesController = new GroceriesController(groceriesModel);
const errorHandler = new ErrorHandler();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(authController.auth)

app.post('/login', authController.login);
app.post('/register', authController.register);

app.get('/groceries', groceriesController.get);
app.get('/groceries/:id', groceriesController.getById);

app.get('/test', (req, res) => res.status(200).end('good'))

app.use(errorHandler.handle)

// app.get('/groceries', groceries.get);

async function main() {
  await usersModel.setup();
  await groceriesModel.setup();
  app.listen(7777, () => {
    console.log('server listening on 7777');
  });
}

main();