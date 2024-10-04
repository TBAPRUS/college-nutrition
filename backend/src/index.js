const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors')
const AuthController = require('./controllers/AuthController');
const GroceriesController = require('./controllers/GroceriesController');
const DishesController = require('./controllers/DishesController');
const AuthModel = require('./models/AuthModel');
const UsersModel = require('./models/UsersModel')
const Database = require('./Database');
const ErrorHandler = require('./errors/ErrorHandler');
const GroceriesModel = require('./models/GroceriesModel');
const DishesModel = require('./models/DishesModel');
const UsersController = require('./controllers/UsersController');
const DietsController = require('./controllers/DietsController');
const DietsModel = require('./models/DietsModel');

const database = new Database();
const authModel = new AuthModel('secret');
const usersModel = new UsersModel(database);
const groceriesModel = new GroceriesModel(database);
const dishesModel = new DishesModel(database);
const dietsModel = new DietsModel(database);
const authController = new AuthController(authModel, usersModel);
const groceriesController = new GroceriesController(groceriesModel);
const dishesController = new DishesController(dishesModel);
const usersController = new UsersController(usersModel, authModel);
const dietsController = new DietsController(dietsModel)
const errorHandler = new ErrorHandler();

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}))
app.use(cookieParser());
app.use(express.json());
app.use(authController.auth)

app.post('/login', authController.login);
app.post('/logout', authController.logout);
app.post('/register', authController.register);

app.use(authController.authed);

app.get('/me', authController.me);

app.get('/groceries', groceriesController.get);
app.get('/groceries/:id', groceriesController.getById);
app.post('/groceries', groceriesController.post);
app.delete('/groceries/:id', groceriesController.delete);

app.get('/dishes', dishesController.get);
app.get('/dishes/:id', dishesController.getById);
app.post('/dishes', dishesController.post);
app.put('/dishes/:id', dishesController.put);
app.delete('/dishes/:id', dishesController.delete);

app.get('/users', usersController.get);
app.post('/users', usersController.post);
app.patch('/users/:id', usersController.patch);

app.get('/diets', dietsController.get);
app.post('/diets', dietsController.post);
app.put('/diets/:id', dietsController.put);
app.delete('/diets/:id', dietsController.delete);

app.get('/diets/selected', dietsController.getSelected);
app.post('/diets/select', dietsController.select);

app.get('/test', (req, res) => res.status(200).end('good'))

app.use(errorHandler.handle)

// app.get('/groceries', groceries.get);

async function main() {
  await usersModel.setup();
  await groceriesModel.setup();
  await dishesModel.setup();
  await dietsModel.setup();
  app.listen(7777, () => {
    console.log('server listening on 7777');
  });
}

main();