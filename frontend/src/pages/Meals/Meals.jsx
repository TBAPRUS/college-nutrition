import { useEffect, useMemo, useState } from "react";
import Layout from "../Layout";
import axios from "axios";
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Box, Tooltip, TablePagination, Button, Input } from "@mui/material";
import LoadingButton from "../../components/LoadingButton";
import MealsSelectDish from "./MealsSelectDish";
import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { LineChart } from "@mui/x-charts";

export default function Meals() {
  const [meals, setMeals] = useState([])
  const [statistic, setStatistic] = useState(null)
  const [selectedDiet, setSelectedDiet] = useState(null)
  const [newMeal, setNewMeal] = useState(null)

  const [updatedMeals, setUpdatedMeals] = useState({})
  const [creatingLoading, setCreatingLoading] = useState(false)
  const [selectingDish, setSelectingDish] = useState(false)

  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    getMeals()
  }, [search, offset, limit])

  useEffect(() => {
    getStatistic()    
  }, [])

  useEffect(() => {
    axios.get('/diets/selected')
      .then(({ data }) => {
        if (data) {
          setSelectedDiet({
            ...data,
            dishes: data.dishes.map((dish) => ({
              ...dish,
              creatingLoading: false
            }))
          })
        }
      })
      .catch(err => console.log(err))
  }, [])

  const mealsToView = useMemo(() => meals.map((meal) => {
    let weight = 0;
    let proteins = 0;
    let fats = 0;
    let carbohydrates = 0;

    meal.groceries.forEach((grocery) => {
      weight += grocery.amount;
      proteins += grocery.proteins * grocery.amount / 100;
      fats += grocery.fats * grocery.amount / 100;
      carbohydrates += grocery.carbohydrates * grocery.amount / 100;
    })

    if (weight === 0) return {...meal, calories: 0, proteins: 0, fats: 0, carbohydrates: 0}

    return {
      ...meal,
      calories: (proteins * 4.1 + fats * 9.29 + carbohydrates * 4.2) / weight,
      proteins: proteins / weight,
      fats: fats / weight,
      carbohydrates: carbohydrates / weight,
    }
  }), [meals])

  const dietMealsToView = useMemo(() => {
    if (!selectedDiet || offset !== 0) {
      return []
    }

    const today = new Date();
    const eatenDishes = {}
    meals.forEach(({dishId, eatenAt}) => {
      const date = new Date(eatenAt)
      if (date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate()) {
        eatenDishes[dishId] = true
      }
    })
    return selectedDiet.dishes
      .filter((dish) => !eatenDishes[dish.id])
      .map((dish) => {
        let weight = 0;
        let proteins = 0;
        let fats = 0;
        let carbohydrates = 0;

        dish.groceries.forEach((grocery) => {
          weight += grocery.amount;
          proteins += grocery.proteins * grocery.amount / 100;
          fats += grocery.fats * grocery.amount / 100;
          carbohydrates += grocery.carbohydrates * grocery.amount / 100;
        })

        const date = new Date();
        date.setHours(parseInt(dish.time.slice(0, 2)))
        date.setMinutes(parseInt(dish.time.slice(3, 5)))

        if (weight === 0) return {...dish, eatenAt: date.toISOString(), calories: 0, proteins: 0, fats: 0, carbohydrates: 0}

        return {
          ...dish,
          eatenAt: date.toISOString(),
          calories: (proteins * 4.1 + fats * 9.29 + carbohydrates * 4.2) / weight * dish.amount,
          proteins: proteins / weight * dish.amount,
          fats: fats / weight * dish.amount,
          carbohydrates: carbohydrates / weight * dish.amount,
        }
      })
    }, [selectedDiet, meals]
  )

  const dietDishesId = useMemo(() => selectedDiet ?selectedDiet.dishes.reduce((acc, cur) => {
    acc[cur.id] = true
    return acc
  }, {}) : {}, [selectedDiet])

  const series = useMemo(() => {
    const now = new Date()
    const days = new Array(7).fill(null).map((_, i) => {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0, 0)
      return day
    }).reverse().reduce((acc, cur, i) => {
      acc[cur.toISOString()] = i
      return acc
    }, {})
    
    const calories = [0, 0, 0, 0, 0, 0, 0]
    const proteins = [0, 0, 0, 0, 0, 0, 0]
    const fats = [0, 0, 0, 0, 0, 0, 0]
    const carbohydrates = [0, 0, 0, 0, 0, 0, 0]
    
    for (const key in statistic) {
      calories[days[key]] += statistic[key].calories
      proteins[days[key]] += statistic[key].proteins
      fats[days[key]] += statistic[key].fats
      carbohydrates[days[key]] += statistic[key].carbohydrates
    }
    
    return [
      { curve: "linear", data: calories.map((item) => item.toFixed(2)), label: 'Калорийность' },
      { curve: "linear", data: proteins.map((item) => item.toFixed(2)), label: 'Белки' },
      { curve: "linear", data: fats.map((item) => item.toFixed(2)), label: 'Жиры' },
      { curve: "linear", data: carbohydrates.map((item) => item.toFixed(2)), label: 'Углеводы' },
    ]
  }, [statistic])

  const now = new Date()
  const xAxis = new Array(7).fill(null).map((_, i) => {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0, 0)
    return day
  }).reverse()

  const getStatistic = () => {
    let requestNum = 0
    return (() => {
      requestNum++;
      const currentNum = requestNum;
      return axios.get('/statistic', {
        params: { timezoneOffset: new Date().getTimezoneOffset() }
      })
        .then(({ data }) => {
          if (currentNum !== requestNum) return;
          setStatistic(data)
        })
        .catch((error) => {
          console.log(error)
        })
    })()
  }

  const getMeals = () => {
    let requestNum = 0
    return (() => {
      requestNum++;
      const currentNum = requestNum;
      return axios.get('/meals', {
        params: { limit, offset, name: search }
      })
        .then(({ data }) => {
          if (currentNum !== requestNum) return;
          setTotal(data.total)
          setMeals(data.meals.map((meal) => ({
            ...meal,
            removingLoading: false,
            editingLoading: false,
          })))
        })
        .catch((error) => {
          console.log(error)
        })
    })()
  }

  const handleChangePage = (_, page) => {
    setOffset(page * limit)
  }
  
  const handleChangeRowsPerPage = (event) => {
    setLimit(event.target.value)
    setOffset(Math.floor(offset / event.target.value) * event.target.value)
  }

  const handleAddDish = async (dish) => {
    let weight = 0;
    let proteins = 0;
    let fats = 0;
    let carbohydrates = 0;

    dish.groceries.forEach((grocery) => {
      weight += grocery.amount;
      proteins += grocery.proteins * grocery.amount / 100;
      fats += grocery.fats * grocery.amount / 100;
      carbohydrates += grocery.carbohydrates * grocery.amount / 100;
    })
    
    let cpfc;
    if (weight === 0) {
      cpfc = {
        calories: 0,
        proteins: 0,
        fats: 0,
        carbohydrates: 0,
      }
    } else {
      cpfc = {
        calories: (proteins * 4.1 + fats * 9.29 + carbohydrates * 4.2) / weight,
        proteins: proteins / weight,
        fats: fats / weight,
        carbohydrates: carbohydrates / weight,
      }
    }

    setNewMeal({
      ...cpfc,
      amount: '',
      dishId: dish.id,
      eatenAt: dayjs(),
      groceries: dish.groceries,
      name: dish.name,
    })
  }

  const handleStartEditingMeal = (id) => {
    const meal = meals.find((meal) => meal.id == id)
    setUpdatedMeals((updatedMeals) => ({
      ...updatedMeals,
      [id]: {
        amount: meal.amount,
        eatenAt: dayjs(meal.eatenAt),
      }
    }))
  }

  const handleStopEditingMeal = (id) => {
    setUpdatedMeals((updatedMeals) => ({
      ...updatedMeals,
      [id]: null
    }))
  }

  const handleChangeMealAmount = (event, id) => {
    setUpdatedMeals((updatedMeals) => ({
      ...updatedMeals,
      [id]: {
        ...updatedMeals[id],
        amount: event.target.value
      }
    }))
  }

  const handleChangeMealEatenAt = (event, id) => {
    setUpdatedMeals((updatedMeals) => ({
      ...updatedMeals,
      [id]: {
        ...updatedMeals[id],
        eatenAt: event
      }
    }))
  }

  const addMeal = async (data) => {
    const date = new Date();
    date.setHours(parseInt(data.time.slice(0, 2)), parseInt(data.time.slice(3, 5)), 0, 0)

    try {
      await axios.post('/meals', {
        dishId: data.id,
        eatenAt: date.toISOString(),
        amount: data.amount
      })
      await getMeals()
      await getStatistic()
    } catch (err) {
      console.log(err)
    }
  }

  const handleAddDietMeal = async (id) => {
    setSelectedDiet((selectedDiet) => ({...selectedDiet, dishes: selectedDiet.dishes.map((dish) => dish.id === id ? ({...dish, creatingLoading: true}) : dish)}))
    await addMeal(selectedDiet.dishes.find((dish) => dish.id === id))
    setSelectedDiet((selectedDiet) => ({...selectedDiet, dishes: selectedDiet.dishes.map((dish) => dish.id === id ? ({...dish, creatingLoading: false}) : dish)}))
  }

  const handleRemoveMeal = async (id) => {
    setMeals((meals) => meals.map((meal) => meal.id === id ? ({...meal, removingLoading: true}) : meal))
    try {
      await axios.delete(`/meals/${id}`)
      await getMeals()
      await getStatistic()
    } catch (err) {
      console.log(err)
    }
    setMeals((meals) => meals.map((meal) => meal.id === id ? ({...meal, removingLoading: false}) : meal))
  }

  const handleEditMeal = async (id) => {
    setMeals((meals) => meals.map((meal) => meal.id === id ? ({...meal, editingLoading: true}) : meal))
    try {
      await axios.put(`/meals/${id}`, {
        amount: updatedMeals[id].amount,
        eatenAt: updatedMeals[id].eatenAt.toISOString(),
      })
      handleStopEditingMeal(id)
      getMeals()
      getStatistic()
    } catch (err) {
      console.log(err)
    }
    setMeals((meals) => meals.map((meal) => meal.id === id ? ({...meal, editingLoading: false}) : meal))
  }

  const handleCreateNewMeal = async () => {
    setCreatingLoading(true)
    try {
      await axios.post('/meals', {
        dishId: newMeal.dishId,
        eatenAt: newMeal.eatenAt,
        amount: newMeal.amount,
      })
      setNewMeal(null)
      getMeals()
      getStatistic()
    } catch (err) {
      console.log(err)
    }
    setCreatingLoading(false)
  }

  const bgColorByMeal = (meal) => {
    const today = new Date();
    const date = new Date(meal.eatenAt)
    if (dietDishesId[meal.dishId] && date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate()) {
      return '#1976d210'
    }
    return 'white'
  }

  const stringDateToView = (stringDate) => {
    const date = new Date(stringDate)
    const addZero = (num) => num >= 10 ? num.toString() : `0${num}`
    return `${addZero(date.getDate())}.${addZero(date.getMonth() + 1)}.${date.getFullYear()} ${addZero(date.getHours())}:${addZero(date.getMinutes())}`
  }

  const canEdit = (id) => {
    return parseInt(updatedMeals[id].amount) > 0 && updatedMeals[id].eatenAt?.isValid()
  }

  const canAdd = parseInt(newMeal?.amount) > 0 && newMeal?.eatenAt?.isValid();
  const weekAgo = (() => {
    const week = new Date()
    week.setDate(week.getDate() - 7)
    return dayjs(week)
  })()
  const today = dayjs()

  return (
    <Layout>
      <Typography variant="h4" mb="8px">
        Сводка информации о питании
      </Typography>
      <LineChart
        height={300}
        xAxis={[
          {
            data: xAxis,
            tickMinStep: 3600 * 1000 * 24,
            scaleType: 'time',
            valueFormatter: (date) => date.toLocaleDateString('ru-RU')
          }
        ]}
        series={series}
      />
      <Typography variant="h4" mb="8px">
        Приёмы пищи
      </Typography>
      <TableContainer sx={{ maxHeight: '827px' }} component={Paper}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>
                Название (100 г. продукта)
              </TableCell>
              <TableCell>
                Вес
              </TableCell>
              <TableCell>
                Калорийность
              </TableCell>
              <TableCell>
                Белки
              </TableCell>
              <TableCell>
                Жиры
              </TableCell>
              <TableCell>
                Углеводы
              </TableCell>
              <TableCell>
                Дата и время
              </TableCell>
              <TableCell>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {
              dietMealsToView.length > 0
              ? <TableRow>
                  <TableCell colSpan={8}>
                    <Typography variant="h6">
                      Блюда из выбранного рациона питания:
                    </Typography>
                  </TableCell>
                </TableRow>
              : null
            }
            {dietMealsToView.map((row) => (
              <TableRow
                key={row.id}
                sx={{ background: '#1976d210' }}
              >
                <TableCell>
                  { row.name }
                </TableCell>
                <TableCell>
                  { row.amount } г.
                </TableCell>
                <TableCell>
                  { row.calories.toFixed(2) } ккал
                </TableCell>
                <TableCell>
                  { parseFloat(row.proteins).toFixed(2) } г.
                </TableCell>
                <TableCell>
                  { parseFloat(row.fats).toFixed(2) } г.
                </TableCell>
                <TableCell>
                  { parseFloat(row.carbohydrates).toFixed(2) } г.
                </TableCell>
                <TableCell>
                  { stringDateToView(row.eatenAt) }
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: '8px', justifyContent: 'flex-end'}}>
                    <Tooltip title="Добавить блюдо из рациона в приёмы пищи" arrow>
                      <Box>
                        <LoadingButton
                          loading={row.creatingLoading}
                          variant="contained"
                          onClick={() => handleAddDietMeal(row.id)}
                        >
                          Добавить
                        </LoadingButton>
                      </Box>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {
              dietMealsToView.length > 0
              ? <TableRow>
                  <TableCell colSpan={8}>
                    <Typography variant="h6">
                    История приёмов пищи:
                    </Typography>
                  </TableCell>
                </TableRow>
              : null
            }
            {
              newMeal
              ? <TableRow>
                  <TableCell>
                    { newMeal.name }
                  </TableCell>
                  <TableCell>
                    <Input
                      sx={{ marginRight: "4px", maxWidth: "60px" }}
                      placeholder="Вес"
                      type="number"
                      value={newMeal.amount}
                      onChange={(event) => setNewMeal((newMeal) => ({...newMeal, amount: event.target.value}))}
                    />
                    г.
                  </TableCell>
                  <TableCell>
                    { (newMeal.calories * newMeal.amount).toFixed(2) } ккал
                  </TableCell>
                  <TableCell>
                    { (newMeal.proteins * newMeal.amount).toFixed(2) } г.
                  </TableCell>
                  <TableCell>
                    { (newMeal.fats * newMeal.amount).toFixed(2) } г.
                  </TableCell>
                  <TableCell>
                    { (newMeal.carbohydrates * newMeal.amount).toFixed(2) } г.
                  </TableCell>
                  <TableCell>
                    <DateTimePicker
                      ampm={false}
                      minDate={weekAgo}
                      maxDate={today}
                      value={newMeal.eatenAt}
                      onChange={(event) => setNewMeal((newMeal) => ({...newMeal, eatenAt: event}))}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: '8px', justifyContent: 'flex-end'}}>
                      {
                        newMeal
                        ? <>
                            <LoadingButton
                              loading={creatingLoading}
                              disabled={!canAdd}
                              variant="contained"
                              onClick={handleCreateNewMeal}
                            >
                              Добавить
                            </LoadingButton>
                            <Button
                              variant="outlined"
                              onClick={() => setNewMeal(null)}
                            >
                              Отменить
                            </Button>
                          </> 
                        : <Button
                            variant="contained"
                            onClick={() => setSelectingDish(true)}
                          >
                            Добавить
                          </Button>
                      }
                    </Box>
                  </TableCell>
                </TableRow>
              : <TableRow>
                  <TableCell />
                  <TableCell />
                  <TableCell />
                  <TableCell />
                  <TableCell />
                  <TableCell />
                  <TableCell />
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: '8px', justifyContent: 'flex-end'}}>
                      <Button
                        variant="contained"
                        onClick={() => setSelectingDish(true)}
                      >
                        Добавить
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
            }
            {mealsToView.map((row) => (
              <TableRow
                key={row.id}
                sx={{ background: bgColorByMeal(row) }}
              >
                <TableCell>
                  { row.name }
                </TableCell>
                <TableCell>
                  {
                    updatedMeals[row.id]
                    ? <Input
                        sx={{ marginRight: "4px", maxWidth: "60px" }}
                        placeholder="Вес"
                        type="number"
                        value={updatedMeals[row.id].amount}
                        onChange={(event) => handleChangeMealAmount(event, row.id)}
                      />
                    : row.amount
                  }
                  г.
                </TableCell>
                <TableCell>
                  { (row.calories * (updatedMeals[row.id] ? updatedMeals[row.id].amount : row.amount)).toFixed(2) } ккал
                </TableCell>
                <TableCell>
                  { parseFloat(row.proteins * (updatedMeals[row.id] ? updatedMeals[row.id].amount : row.amount)).toFixed(2) } г.
                </TableCell>
                <TableCell>
                  { parseFloat(row.fats * (updatedMeals[row.id] ? updatedMeals[row.id].amount : row.amount)).toFixed(2) } г.
                </TableCell>
                <TableCell>
                  { parseFloat(row.carbohydrates * (updatedMeals[row.id] ? updatedMeals[row.id].amount : row.amount)).toFixed(2) } г.
                </TableCell>
                <TableCell>
                  { 
                    updatedMeals[row.id]
                    ? <DateTimePicker
                        ampm={false}
                        minDate={weekAgo}
                        maxDate={today}
                        value={updatedMeals[row.id].eatenAt}
                        onChange={(event) => handleChangeMealEatenAt(event, row.id)}
                      />
                    : stringDateToView(row.eatenAt)
                  }
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: '8px', justifyContent: 'flex-end'}}>
                    {
                      updatedMeals[row.id]
                      ? <>
                          <LoadingButton
                            loading={row.editingLoading}
                            variant="contained"
                            disabled={!canEdit(row.id)}
                            onClick={() => handleEditMeal(row.id)}
                          >
                            Сохранить
                          </LoadingButton>
                          <Button
                            variant="outlined"
                            onClick={() => handleStopEditingMeal(row.id)}
                          >
                            Отменить
                          </Button>
                        </>
                      : <>
                          <Button
                            variant="contained"
                            color="warning"
                            onClick={() => handleStartEditingMeal(row.id)}
                          >
                            Изменить
                          </Button>
                          <LoadingButton
                            loading={row.removingLoading}
                            variant="contained"
                            color="error"
                            onClick={() => handleRemoveMeal(row.id)}
                          >
                            Удалить
                          </LoadingButton>
                        </>
                    }
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        labelRowsPerPage={'Строк на странице'}
        component={Paper}
        sx={{ marginTop: '12px' }}
        count={total}
        page={Math.floor(offset / limit)}
        rowsPerPage={limit}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      <MealsSelectDish
        open={selectingDish}
        onClose={() => setSelectingDish(false)}
        onSelect={handleAddDish}
      />
    </Layout>
  )
}