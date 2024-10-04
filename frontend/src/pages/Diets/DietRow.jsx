import { Fragment, useMemo, useState } from "react";
import { Box, Button, Collapse, Divider, IconButton, Input, List, ListItem, ListItemButton, ListItemText, Modal, Paper, styled, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, tooltipClasses, Typography } from "@mui/material";
import LoadingButton from "../../components/LoadingButton";
import { Add, ExpandLess, ExpandMore } from "@mui/icons-material";
import axios from "axios";
import { TimePicker } from "@mui/x-date-pickers";
import AddDishToDiet from "./AddDishToDiet";
import dayjs from "dayjs";

export default function DietRow(props) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [addingOpen, setAddingOpen] = useState(false)
  const [removingLoading, setRemovingLoading] = useState(false)
  const [savingLoading, setSavingLoading] = useState(false)
  const [selectingLoading, setSelectingLoading] = useState(false)

  const [addedDishes, setAddedDishes] = useState([])
  const [removedDishes, setRemovedDishes] = useState({})
  const [updatedDishes, setUpdatedDishes] = useState({})
  const [name, setName] = useState('')

  const diet = useMemo(() => {
    let amount = 0
    let weight = 0
    let proteins = 0
    let fats = 0
    let carbohydrates = 0
    
    const dishes = props.diet.dishes.map((dish) => {
      let dishWeight = 0
      let dishProteins = 0
      let dishFats = 0
      let dishCarbohydrates = 0

      dish.groceries.forEach((grocery) => {
        weight += grocery.amount
        dishWeight += grocery.amount
        dishProteins += grocery.proteins * grocery.amount / 100
        dishFats += grocery.fats * grocery.amount / 100
        dishCarbohydrates += grocery.carbohydrates * grocery.amount / 100
      })

      amount += dish.amount
      proteins += dishProteins / dishWeight * dish.amount
      fats += dishFats / dishWeight * dish.amount
      carbohydrates += dishCarbohydrates / dishWeight * dish.amount

      if (dishWeight == 0) {
        return {
          ...dish,
          calories: 0,
          proteins: 0,
          fats: 0,
          carbohydrates: 0
        }
      }

      return {
        ...dish,
        calories: (dishProteins * 4.1 + dishFats * 9.29 + dishCarbohydrates * 4.2) / dishWeight,
        proteins: dishProteins / dishWeight,
        fats: dishFats / dishWeight,
        carbohydrates: dishCarbohydrates / dishWeight,
      }
    })

    if (weight === 0) {
      return {...props.diet, dishes, amount, calories: 0, proteins: 0, fats: 0, carbohydrates: 0}
    }

    return {
      ...props.diet,
      dishes,
      amount: amount,
      calories: proteins * 4.1 + fats * 9.29 + carbohydrates * 4.2,
      proteins: proteins,
      fats: fats,
      carbohydrates: carbohydrates,
    }
  }, [props.diet])
  
  const containedDishesId = useMemo(() =>
    [diet.dishes.map(({id}) => id), addedDishes.map(({id}) => id)].flat(),
    [diet.dishes, addedDishes]
  )

  const addedDishesToView = useMemo(() => addedDishes.map((dish) => {
    let weight = 0
    let proteins = 0
    let fats = 0
    let carbohydrates = 0
    
    dish.groceries.forEach((grocery) => {
      weight += grocery.amount
      proteins += grocery.proteins * grocery.amount / 100
      fats += grocery.fats * grocery.amount / 100
      carbohydrates += grocery.carbohydrates * grocery.amount / 100
    })

    if (weight == 0) {
      return {...dish, calories: 0, proteins: 0, fats: 0, carbohydrates: 0}
    }

    proteins = proteins / weight * (dish.amount || 0)
    fats = fats / weight * (dish.amount || 0)
    carbohydrates = carbohydrates / weight * (dish.amount || 0)

    return {
      ...dish,
      calories: proteins * 4.1 + fats * 9.29 + carbohydrates * 4.2,
      proteins,
      fats,
      carbohydrates,
    }
  }), [addedDishes])

  const formatDate = (date) => {
    const addZero = (num) => num >= 10 ? num.toString() : `0${num}`
    return `${addZero(date.hour())}:${addZero(date.minute())}`
  }

  const handleStartEditing = () => {
    setEditing(true)
    setName(diet.name)
    setOpen(true)
    setUpdatedDishes(diet.dishes.reduce((acc, cur) => {
      acc[cur.id] = {amount: cur.amount, time: cur.time}
      return acc
    }, {}))
  }

  const handleEndEditing = () => {
    setEditing(false)
    setName(diet.name)
    setAddedDishes([])
    setUpdatedDishes({})
    setRemovedDishes({})
  }

  const onRemoveDish = (id) => {
    setRemovedDishes((removedDishes) => ({
      ...removedDishes,
      [id]: true
    }))
  }

  const onUndoRemoveDish = (id) => {
    setRemovedDishes((removedDishes) => ({
      ...removedDishes,
      [id]: false
    }))
  }

  const handleChangeAmount = (event, id) => {
    const isAdded = addedDishes.find((grocery) => grocery.id === id)
    if (isAdded) {
      setAddedDishes((dishes) =>
        dishes.map((dish) => dish.id == id ? {...dish, amount: event.target.value} : dish))
    } else {
      setUpdatedDishes((updatedDishes) => ({
        ...updatedDishes,
        [id]: {
          ...updatedDishes[id],
          amount: event.target.value
        }
      }))
    }
  }

  const handleChangeTime = (value, id) => {
    const isAdded = addedDishes.find((grocery) => grocery.id === id)
    if (isAdded) {
      setAddedDishes((dishes) =>
        dishes.map((dish) => dish.id == id ? {...dish, time: value} : dish))
    } else {
      setUpdatedDishes((updatedDishes) => ({
        ...updatedDishes,
        [id]: {
          ...updatedDishes[id],
          time: value
        }
      }))
    }
  }

  const handleAddDish = (dish) => {
    setAddedDishes(((dishes) => [{
      ...dish,
      amount: '',
      time: dayjs().hour(0).minute(0)
    }, ...dishes]))
  }

  const handleRemoveAddedDish = (id) => {
    setAddedDishes((dishes) => dishes.filter((dish) => dish.id !== id))
  }

  const handleClickRemove = async () => {
    setRemovingLoading(true)
    try {
      await axios.delete(`/diets/${diet.id}`)
    } catch (err) {
      console.log(err)
    }
    setRemovingLoading(false)
    props.onRemove()
  }

  const handleSave = async () => {
    setSavingLoading(true)
    try {
      await axios.put(`/diets/${diet.id}`, {
        name,
        dishes: [
          ...addedDishes.map((dish) => ({id: dish.id, amount: parseInt(dish.amount), time: formatDate(dish.time)})),
          ...diet.dishes
            .filter(({id}) => !removedDishes[id])
            .map((dish) => ({
              id: dish.id,
              amount: parseInt(updatedDishes[dish.id] ? updatedDishes[dish.id].amount : dish.amount),
              time: updatedDishes[dish.id] ? formatDate(updatedDishes[dish.id].time) : formatDate(dish.time)
            }))
        ]
      })
      setAddedDishes([])
      setUpdatedDishes({})
      setRemovedDishes({})
      setEditing(false)
    } catch (err) {
      console.log(err)
    }
    setSavingLoading(false)
    setEditing(false)
    props.onSave()
  }

  const handleSelectDiet = async (dietId) => {
    setSelectingLoading(true)
    try {
      await axios.post('/diets/select', {dietId})
    } catch (err) {
      console.log(err)
    }
    setSelectingLoading(false)
    props.onSelect()
  }

  const handleChangeName = (event) => {
    setName(event.target.value)
  }

  const canEdit = useMemo(
    () => name?.length > 0 &&
      !diet.dishes
        .filter(({id}) => !removedDishes[id] && updatedDishes[id])
        .find((dish) => !updatedDishes[dish.id].time || !(updatedDishes[dish.id].time.hour() >= 0 && updatedDishes[dish.id].time.minute() >= 0) || !(parseInt(updatedDishes[dish.id].amount) > 0)) &&
      !addedDishes.find((dish) => !dish.amount || !dish.time),
    [name, diet, removedDishes, updatedDishes, addedDishes]
  )

  console.log(addedDishes)

  return (
    <>
      <TableRow sx={{ background: diet.selected ? '#1976d210' : '', '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </TableCell>
        <TableCell>
          {
            editing
            ? (
                <Input
                  placeholder="Название"
                  value={name}
                  onChange={handleChangeName}
                />
              )
            : diet.name
          }
        </TableCell>
        <TableCell>
          { diet.amount } г.
        </TableCell>
        <TableCell>
          { diet.calories.toFixed(2) } ккал
        </TableCell>
        <TableCell>
          { diet.proteins.toFixed(2) } г.
        </TableCell>
        <TableCell>
          { diet.fats.toFixed(2) } г.
        </TableCell>
        <TableCell>
          { diet.carbohydrates.toFixed(2) } г.
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', gap: '8px', justifyContent: 'flex-end'}}>
            {
              editing
              ? (
                  <Fragment>
                    <LoadingButton
                      variant="contained"
                      loading={savingLoading}
                      disabled={!canEdit}
                      onClick={handleSave}
                    >
                      Сохранить
                    </LoadingButton>
                    <Button
                      variant="outlined"
                      onClick={handleEndEditing}
                    >
                      Отменить
                    </Button>
                  </Fragment>
                )
              : (
                  <Fragment>
                    {
                      diet.selected
                      ? <Tooltip title="Отменить выбор рациона как активного">
                          <Box>
                            <Button
                              variant="outlined"
                              onClick={() => handleSelectDiet(null)}
                            >
                              Отменить
                            </Button>
                          </Box>
                        </Tooltip>
                      : <Tooltip title="Выбрать рацион как активный, активный рацион будет отображаться в питании">
                          <Box>
                            <Button
                              variant="contained"
                              onClick={() => handleSelectDiet(diet.id)}
                            >
                              Выбрать
                            </Button>
                          </Box>
                        </Tooltip>
                    }
                    <Button
                      variant="contained"
                      color="warning"
                      onClick={handleStartEditing}
                    >
                      Изменить
                    </Button>
                    <LoadingButton
                      loading={removingLoading}
                      variant="contained"
                      color="error"
                      onClick={handleClickRemove}
                    >
                      Удалить
                    </LoadingButton>
                  </Fragment>
                )
            }
          </Box>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={open} sx={{ padding: "12px 4px" }} timeout="auto" unmountOnExit>
            <Typography variant="h6">
              Расписание приёма пищи
            </Typography>
            <TableContainer component={Paper}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      Название
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
                      Время
                    </TableCell>
                    <TableCell>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {
                    editing
                    ? (
                        <TableRow key="row">
                          <TableCell />
                          <TableCell />
                          <TableCell />
                          <TableCell />
                          <TableCell />
                          <TableCell />
                          <TableCell />
                          <TableCell sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => setAddingOpen(true)}
                            >
                              Добавить
                            </Button>
                          </TableCell>
                        </TableRow>
                    )
                    : null
                  }
                  {addedDishesToView.map((row) => (
                    <TableRow key={row.id} sx={{ background: '#ebffe2' }}>
                      <TableCell>
                        { row.name }
                      </TableCell>
                      <TableCell>
                        <Input
                          sx={{ marginRight: "4px", maxWidth: "60px" }}
                          placeholder="Вес"
                          type="number"
                          value={row.amount}
                          onChange={(event) => handleChangeAmount(event, row.id)}
                        />
                        г.
                      </TableCell>
                      <TableCell>
                        { row.calories.toFixed(2) } ккал
                      </TableCell>
                      <TableCell>
                        { row.proteins.toFixed(2) } г.
                      </TableCell>
                      <TableCell>
                        { row.fats.toFixed(2) } г.
                      </TableCell>
                      <TableCell>
                        { row.carbohydrates.toFixed(2) } г.
                      </TableCell>
                      <TableCell>
                        {
                          <TimePicker
                            ampm={false}
                            views={['hours', 'minutes']}
                            format="HH:mm"
                            value={row.time}
                            onChange={(event) => handleChangeTime(event, row.id)}
                          />
                        }
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Button
                            variant="contained"
                            size="small"
                            color="error"
                            onClick={() => handleRemoveAddedDish(row.id)}
                          >
                            Удалить
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {diet.dishes.map((row) => (
                    <TableRow
                      key={row.id}
                      sx={{ background: removedDishes[row.id] ? '#ffe2e2' : '#fff' }}
                    >
                      <TableCell>
                        { row.name }
                      </TableCell>
                      <TableCell>
                        {
                          editing
                          ? <Input
                              sx={{ marginRight: "4px", maxWidth: "60px" }}
                              placeholder="Вес"
                              type="number"
                              disabled={removedDishes[row.id] == true}
                              value={updatedDishes[row.id] !== undefined ? updatedDishes[row.id].amount : row.amount}
                              onChange={(event) => handleChangeAmount(event, row.id)}
                            />
                          : row.amount
                        }
                        г.
                      </TableCell>
                      <TableCell>
                        { (row.calories * (editing && updatedDishes[row.id] ? updatedDishes[row.id].amount : row.amount)).toFixed(2) } ккал
                      </TableCell>
                      <TableCell>
                        { (row.proteins * (editing && updatedDishes[row.id] ? updatedDishes[row.id].amount : row.amount)).toFixed(2) } г.
                      </TableCell>
                      <TableCell>
                        { (row.fats * (editing && updatedDishes[row.id] ? updatedDishes[row.id].amount : row.amount)).toFixed(2) } г.
                      </TableCell>
                      <TableCell>
                        { (row.carbohydrates * (editing && updatedDishes[row.id] ? updatedDishes[row.id].amount : row.amount)).toFixed(2) } г.
                      </TableCell>
                      <TableCell>
                        {
                          editing
                          ? <TimePicker
                              ampm={false}
                              views={['hours', 'minutes']}
                              disabled={removedDishes[row.id] == true}
                              format="HH:mm"
                              value={updatedDishes[row.id] !== undefined ? updatedDishes[row.id].time : row.time}
                              onChange={(event) => handleChangeTime(event, row.id)}
                            />
                          : formatDate(row.time)
                        }
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          {
                            editing
                            ? !removedDishes[row.id]
                              ? (
                                  <Button
                                    variant="contained"
                                    size="small"
                                    color="error"
                                    onClick={() => onRemoveDish(row.id)}
                                  >
                                    Удалить
                                  </Button>
                              )
                              : (
                                  <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => onUndoRemoveDish(row.id)}
                                  >
                                    Отменить
                                  </Button>
                              )
                            : null
                          }
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Collapse>
        </TableCell>
      </TableRow>
      <AddDishToDiet
        open={addingOpen}
        ids={containedDishesId}
        onClose={() => setAddingOpen(false)}
        onSelect={handleAddDish}
      />
    </>
  )
}