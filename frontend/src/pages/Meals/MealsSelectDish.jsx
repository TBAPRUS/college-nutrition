import { Box, Button, Divider, FormControl, Input, InputLabel, List, ListItem, ListItemButton, Modal, Paper, Typography } from "@mui/material";
import axios from "axios";
import { Fragment, memo, useContext, useEffect, useMemo, useState } from "react";

export default function MealsSelectDish(props) {
  const [search, setSearch] = useState('')
  const [dishes, setDishes] = useState([]);

  const getDishes = (() => {
    let requestNumber = 0;
    return (search) => {
      requestNumber++;
      const currentNumber = requestNumber;
      axios.get('/dishes', {
        params: { limit: 10, offset: 0, name: search }
      })
        .then((data) => {
          if (requestNumber !== currentNumber) return;
          setDishes(data.data.dishes)
        })
        .catch((error) => {
          console.log(error)
        })
    }
  })()
  
  const handleChangeSearch = (event) => {
    setSearch(event.target.value)
    getDishes(event.target.value);
  }

  const handleSelectItem = (item) => {
    props.onSelect({ ...item })
    handleClose()
  }

  const handleClose = () => {
    setSearch('')
    setDishes([])
    props.onClose();
  }

  return (
    <Modal
      open={props.open}
    >
      <Box
        sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 400, backgroundColor: '#fff', boxShadow: 24, p: 2
        }}
      >
        <Typography variant="h6">
          Выберете блюдо для добавления в историю приёмов пищи
        </Typography>
        <Divider sx={{ marginBottom: '8px' }} />
        <FormControl variant="standard" sx={{ marginBottom: '16px' }}>
          <InputLabel htmlFor="dish-name">Поиск по названию</InputLabel>
          <Input
            id="dish-name"
            value={search}
            onChange={handleChangeSearch}
          />
        </FormControl>
        {
          dishes.length
          ? <>
              <List component={Paper} sx={{ maxHeight: '250px', overflowY: 'scroll' }}>
                {
                  dishes.map((dish) => (
                    <ListItem key={dish.id}>
                      <ListItemButton onClick={() => handleSelectItem(dish)}>
                        { dish.name }
                      </ListItemButton>
                    </ListItem>
                  ))
                }
              </List>
            </>
          : null
        }
        <Box sx={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleClose}
          >
            Отменить
          </Button>
        </Box>
      </Box>
    </Modal>
  )
}