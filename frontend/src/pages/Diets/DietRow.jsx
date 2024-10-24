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

  const addedDishesToView = useMemo(() => addedDishes.map((dish, i) => {
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
      key: dish.id + dish.time + i,
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
      acc[cur.key] = {amount: cur.amount, time: cur.time}
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
    const isAdded = addedDishesToView.findIndex((grocery) => grocery.key === id)
    if (isAdded !== -1) {
      setAddedDishes((dishes) =>
        dishes.map((dish, i) => i === isAdded ? {...dish, amount: event.target.value} : dish))
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
    const isAdded = addedDishesToView.findIndex((grocery) => grocery.key === id)
    if (isAdded !== -1) {
      setAddedDishes((dishes) =>
        dishes.map((dish, i) => i === isAdded ? {...dish, time: value} : dish))
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

  const handleRemoveAddedDish = (index) => {
    setAddedDishes((dishes) => dishes.filter((dish, i) => i !== index))
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
      console.log(updatedDishes)
      console.log(diet.dishes)
      await axios.put(`/diets/${diet.id}`, {
        name,
        dishes: [
          ...addedDishes.map((dish) => ({id: dish.id, amount: parseInt(dish.amount), time: formatDate(dish.time)})),
          ...diet.dishes
            .filter(({key}) => !removedDishes[key])
            .map((dish) => ({
              id: dish.id,
              amount: parseInt(updatedDishes[dish.key] ? updatedDishes[dish.key].amount : dish.amount),
              time: updatedDishes[dish.key] ? formatDate(updatedDishes[dish.key].time) : formatDate(dish.time)
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
        .filter(({key}) => !removedDishes[key] && updatedDishes[key])
        .find((dish) => !updatedDishes[dish.key]?.time?.isValid() || !(parseInt(updatedDishes[dish.key].amount) > 0)) &&
      !addedDishes.find((dish) => !(parseInt(dish.amount) > 0) || !dish?.time?.isValid()),
    [name, diet, removedDishes, updatedDishes, addedDishes]
  )

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
                  {addedDishesToView.map((row, i) => (
                    <TableRow key={row.key} sx={{ background: '#ebffe2' }}>
                      <TableCell>
                        { row.name }
                      </TableCell>
                      <TableCell>
                        <Input
                          sx={{ marginRight: "4px", maxWidth: "60px" }}
                          placeholder="Вес"
                          type="number"
                          value={row.amount}
                          onChange={(event) => handleChangeAmount(event, row.key)}
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
                            onChange={(event) => handleChangeTime(event, row.key)}
                          />
                        }
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Button
                            variant="contained"
                            size="small"
                            color="error"
                            onClick={() => handleRemoveAddedDish(i)}
                          >
                            Удалить
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {diet.dishes.map((row) => (
                    <TableRow
                      key={row.key}
                      sx={{ background: removedDishes[row.key] ? '#ffe2e2' : '#fff' }}
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
                              disabled={removedDishes[row.key] == true}
                              value={updatedDishes[row.key] !== undefined ? updatedDishes[row.key].amount : row.amount}
                              onChange={(event) => handleChangeAmount(event, row.key)}
                            />
                          : row.amount
                        }
                        г.
                      </TableCell>
                      <TableCell>
                        { (row.calories * (editing && updatedDishes[row.key] ? updatedDishes[row.key].amount : row.amount)).toFixed(2) } ккал
                      </TableCell>
                      <TableCell>
                        { (row.proteins * (editing && updatedDishes[row.key] ? updatedDishes[row.key].amount : row.amount)).toFixed(2) } г.
                      </TableCell>
                      <TableCell>
                        { (row.fats * (editing && updatedDishes[row.key] ? updatedDishes[row.key].amount : row.amount)).toFixed(2) } г.
                      </TableCell>
                      <TableCell>
                        { (row.carbohydrates * (editing && updatedDishes[row.key] ? updatedDishes[row.key].amount : row.amount)).toFixed(2) } г.
                      </TableCell>
                      <TableCell>
                        {
                          editing
                          ? <TimePicker
                              ampm={false}
                              views={['hours', 'minutes']}
                              disabled={removedDishes[row.key] == true}
                              format="HH:mm"
                              value={updatedDishes[row.key] !== undefined ? updatedDishes[row.key].time : row.time}
                              onChange={(event) => handleChangeTime(event, row.key)}
                            />
                          : formatDate(row.time)
                        }
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          {
                            editing
                            ? !removedDishes[row.key]
                              ? (
                                  <Button
                                    variant="contained"
                                    size="small"
                                    color="error"
                                    onClick={() => onRemoveDish(row.key)}
                                  >
                                    Удалить
                                  </Button>
                              )
                              : (
                                  <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => onUndoRemoveDish(row.key)}
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
        onClose={() => setAddingOpen(false)}
        onSelect={handleAddDish}
      />
    </>
  )
}