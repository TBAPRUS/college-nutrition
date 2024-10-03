const Database = require("../Database");
const DishesModel = require("../models/DishesModel");

const database = new Database();
const dishesModel = new DishesModel(database)

async function init() {
  await dishesModel.setup()
  console.log(await dishesModel.get({
    userId: 2
  }))
}

init()
