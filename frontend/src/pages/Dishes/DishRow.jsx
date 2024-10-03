import { Fragment, useMemo, useState } from "react";
import { Box, Button, Collapse, Divider, IconButton, Input, List, ListItem, ListItemButton, ListItemText, Modal, Paper, styled, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, tooltipClasses, Typography } from "@mui/material";
import LoadingButton from "../../components/LoadingButton";
import { Add, ExpandLess, ExpandMore } from "@mui/icons-material";
import AddGroceryToDish from "./AddGroceryToDish";
import axios from "axios";

export default function DishRow(props) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editingOpen, setEditingOpen] = useState(false)
  const [editingLoading, setEditingLoading] = useState(false)
  const [addingOpen, setAddingOpen] = useState(false)
  const [removingOpen, setRemovingOpen] = useState(false)
  const [removingLoading, setRemovingLoading] = useState(false)

  const [addedGroceries, setAddedGroceries] = useState([])
  const [removedGroceries, setRemovedGroceries] = useState({})
  const [updatedGroceries, setUpdatedGroceries] = useState({})
  const [name, setName] = useState('')

  const dish = useMemo(() => {
    let weight = 0;
    let proteins = 0;
    let fats = 0;
    let carbohydrates = 0;

    props.dish.groceries.forEach((grocery) => {
      weight += grocery.amount;
      proteins += grocery.proteins * grocery.amount / 100;
      fats += grocery.fats * grocery.amount / 100;
      carbohydrates += grocery.carbohydrates * grocery.amount / 100;
    })
    
    if (weight === 0) {
      return {
        ...props.dish,
        calories: 0,
        proteins: 0,
        fats: 0,
        carbohydrates: 0,
      }
    }

    return {
      ...props.dish,
      calories: (proteins * 4.1 + fats * 9.29 + carbohydrates * 4.2) * 100 / weight,
      proteins: proteins * 100 / weight,
      fats: fats * 100 / weight,
      carbohydrates: carbohydrates * 100 / weight,
    }
  }, [props.dish])

  const containedDishesId = useMemo(() =>
    [dish.groceries.map(({id}) => id), addedGroceries.map(({id}) => id)].flat(),
    [dish.groceries, addedGroceries]
  )

  const canEdit = useMemo(
    () => name?.length > 0 && !addedGroceries.find(({amount}) => !(parseInt(amount) > 0))
      && !dish.groceries.find(({id, amount}) => updatedGroceries[id] !== undefined ? !(parseInt(updatedGroceries[id]) > 0) : !(parseInt(amount) > 0)),
    [name, dish.groceries, addedGroceries, updatedGroceries]
  )

  const handleStartEditing = () => {
    setEditing(true)
    setEditingOpen(false)
    setOpen(true)
    setName(props.dish.name)
  }
  
  const handleEndEditing = () => {
    setEditing(false)
    setOpen(false)
    setName(props.dish.name)
    setAddedGroceries([])
    setRemovedGroceries({})
    setUpdatedGroceries({})
  }

  const handleEdit = async () => {
    setEditingLoading(true)
    try {
      await axios.put(`/dishes/${dish.id}`, {
        name,
        groceries: [
          ...addedGroceries.map((grocery) => ({id: grocery.id, amount: parseInt(grocery.amount)})),
          ...dish.groceries
          .filter(({id}) => !removedGroceries[id])
          .map((grocery) => ({id: grocery.id, amount: parseInt(updatedGroceries[grocery.id] !== undefined ? updatedGroceries[grocery.id] : grocery.amount)}))
        ]
      })
    } catch (err) {
      console.log(err)
    }
    setEditingLoading(false)
    setEditing(false)
    setAddedGroceries([])
    setRemovedGroceries({})
    setUpdatedGroceries({})
    props.onEdit()
  }

  const handleChangeName = (event) => {
    setName(event.target.value)
  }

  const onRemoveGrocery = (id) => {
    setRemovedGroceries((removedGroceries) => ({
      ...removedGroceries,
      [id]: true
    }))
  }

  const onUndoRemoveGrocery = (id) => {
    setRemovedGroceries((removedGroceries) => ({
      ...removedGroceries,
      [id]: false
    }))
  }

  const handleSelectGrocery = (grocery) => {
    setAddedGroceries(((groceries) => [{...grocery, amount: ''}, ...groceries]))
  }
  
  const handleChangeAmount = (event, id) => {
    const isAdded = addedGroceries.find((grocery) => grocery.id === id)
    if (isAdded) {
      setAddedGroceries((groceries) =>
        groceries.map((grocery) => grocery.id == id ? {...grocery, amount: event.target.value} : grocery))
    } else {
      setUpdatedGroceries((updatedGroceries) => ({
        ...updatedGroceries,
        [id]: event.target.value
      }))
    }
  }
  
  const handleRemoveAddedGrocery = (id) => {
    setAddedGroceries(((groceries) => groceries.filter((grocery) => grocery.id !== id)))
  }

  const handleRemoveDish = async () => {
    setRemovingLoading(true)
    try {
      await axios.delete(`/dishes/${dish.id}`)
    } catch (err) {
      console.log(err)
    }
    setRemovingLoading(false)
    setRemovingOpen(false)
    props.onRemove()
  }

  return (
    <Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
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
            : dish.name
          }
        </TableCell>
        <TableCell>
          { dish.calories.toFixed(2) } ккал
        </TableCell>
        <TableCell>
          { dish.proteins.toFixed(2) } г.
        </TableCell>
        <TableCell>
          { dish.fats.toFixed(2) } г.
        </TableCell>
        <TableCell>
          { dish.carbohydrates.toFixed(2) } г.
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', gap: '8px', justifyContent: 'flex-end'}}>
            {
              editing
              ? (
                  <Fragment>
                    <LoadingButton
                      variant="contained"
                      loading={editingLoading}
                      disabled={!canEdit}
                      onClick={handleEdit}
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
                    <Button
                      variant="contained"
                      color="warning"
                      onClick={() => setEditingOpen(true)}
                    >
                      Изменить
                    </Button>
                    <LoadingButton
                      loading={dish.loading}
                      variant="contained"
                      color="error"
                      onClick={() => setRemovingOpen(true)}
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
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={open} sx={{ padding: "12px 4px" }} timeout="auto" unmountOnExit>
            <Typography variant="h6">
              Состав
            </Typography>
            <TableContainer component={Paper}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      Название (100 г. продукта)
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
                      Вес
                    </TableCell>
                    <TableCell>
                      Жидкость
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
                  {addedGroceries.map((row) => (
                    <TableRow key={row.id} sx={{ background: '#ebffe2' }}>
                      <TableCell>
                        { row.name }
                      </TableCell>
                      <TableCell>
                        { row.proteins } г.
                      </TableCell>
                      <TableCell>
                        { row.fats } г.
                      </TableCell>
                      <TableCell>
                        { row.carbohydrates } г.
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
                        { row.isLiquid ? 'Да' : 'Нет' }
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Button
                            variant="contained"
                            size="small"
                            color="error"
                            onClick={() => handleRemoveAddedGrocery(row.id)}
                          >
                            Удалить
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {dish.groceries.map((row) => (
                    <TableRow
                      key={row.id}
                      sx={{ background: removedGroceries[row.id] ? '#ffe2e2' : '#fff' }}
                    >
                      <TableCell>
                        { row.name }
                      </TableCell>
                      <TableCell>
                        { row.proteins } г.
                      </TableCell>
                      <TableCell>
                        { row.fats } г.
                      </TableCell>
                      <TableCell>
                        { row.carbohydrates } г.
                      </TableCell>
                      <TableCell>
                        {
                          editing
                          ? <Input
                              sx={{ marginRight: "4px", maxWidth: "60px" }}
                              placeholder="Вес"
                              type="number"
                              value={updatedGroceries[row.id] !== undefined ? updatedGroceries[row.id] : row.amount}
                              onChange={(event) => handleChangeAmount(event, row.id)}
                            />
                          : row.amount
                        }
                        г.
                      </TableCell>
                      <TableCell>
                        { row.isLiquid ? 'Да' : 'Нет' }
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          {
                            editing
                            ? !removedGroceries[row.id]
                              ? (
                                  <Button
                                    variant="contained"
                                    size="small"
                                    color="error"
                                    onClick={() => onRemoveGrocery(row.id)}
                                  >
                                    Удалить
                                  </Button>
                              )
                              : (
                                  <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => onUndoRemoveGrocery(row.id)}
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
      <Modal
        open={editingOpen}
      >
        <Box
          sx={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 400, backgroundColor: '#fff', boxShadow: 24, p: 2
          }}
        >
          <Typography variant="h6">
            Вы уверены, что хотите изменить блюдо?
          </Typography>
          <Divider sx={{ marginBottom: '8px' }} />
          <Typography variant="p">
            Изменение блюда затронет расчёт КБЖУ, в котором участвует данное блюдо.
          </Typography>
          <Box sx={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button
              variant="contained"
              size="small"
              onClick={handleStartEditing}
            >
              Изменить
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setEditingOpen(false)}
            >
              Отменить
            </Button>
          </Box>
        </Box>
      </Modal>
      <Modal
        open={removingOpen}
      >
        <Box
          sx={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 400, backgroundColor: '#fff', boxShadow: 24, p: 2
          }}
        >
          <Typography variant="h6">
            Вы уверены, что хотите удалить блюдо?
          </Typography>
          <Divider sx={{ marginBottom: '8px' }} />
          <Typography variant="p">
            Удаление блюда затронет расчёт КБЖУ, в котором участвует данное блюдо.
          </Typography>
          <Box sx={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <LoadingButton
              loading={removingLoading}
              variant="contained"
              size="small"
              color="error"
              onClick={handleRemoveDish}
            >
              Удалить
            </LoadingButton>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setRemovingOpen(false)}
            >
              Отменить
            </Button>
          </Box>
        </Box>
      </Modal>
      <AddGroceryToDish
        open={addingOpen}
        ids={containedDishesId}
        onClose={() => setAddingOpen(false)}
        onSelect={handleSelectGrocery}
      />
    </Fragment>
  )
}