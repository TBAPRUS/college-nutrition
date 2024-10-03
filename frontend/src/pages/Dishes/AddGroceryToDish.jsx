import { Box, Button, Divider, FormControl, Input, InputLabel, List, ListItem, ListItemButton, Modal, Paper, Typography } from "@mui/material";
import axios from "axios";
import { Fragment, memo, useContext, useEffect, useMemo, useState } from "react";
import UserContext from "../../contextes/UserContext";

export default function AddGroceryToDish(props) {
  const { user } = useContext(UserContext)
  const [search, setSearch] = useState('')
  const [groceries, setGroceries] = useState([]);

  const getGroceries = (() => {
    let requestNumber = 0;
    return (search) => {
      requestNumber++;
      const currentNumber = requestNumber;
      Promise.all([
        axios.get('/groceries', {
          params: { limit: 10, offset: 0, userId: user.id, name: search }
        }),
        axios.get('/groceries', {
          params: { limit: 10, offset: 0, name: search }
        })
      ]).then(([personal, general]) => {
          if (requestNumber !== currentNumber) return;
          setGroceries([...personal.data.groceries, ...general.data.groceries].filter(({id}) => !ids[id]))
        })
        .catch((error) => {
          console.log(error)
        })
    }
  })()
  
  const ids = useMemo(() => props.ids.reduce((acc, cur) => ({...acc, [cur]: true}), {}))

  const handleChangeSearch = (event) => {
    setSearch(event.target.value)
    getGroceries(event.target.value);
  }

  const handleSelectItem = (item) => {
    props.onSelect({ ...item })
    handleClose()
  }

  const handleClose = () => {
    setSearch('')
    setGroceries([])
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
          Добавить продукт в состав блюда.
        </Typography>
        <Divider sx={{ marginBottom: '8px' }} />
        <FormControl variant="standard" sx={{ marginBottom: '16px' }}>
          <InputLabel htmlFor="grocery-name">Поиск по названию</InputLabel>
          <Input
            id="grocery-name"
            value={search}
            onChange={handleChangeSearch}
          />
        </FormControl>
        {
          groceries.length
          ? <Fragment>
              <List component={Paper} sx={{ maxHeight: '250px', overflowY: 'scroll' }}>
                {
                  groceries.map((grocery) => (
                    <ListItem key={grocery.id}>
                      <ListItemButton onClick={() => handleSelectItem(grocery)}>
                        { grocery.name }
                      </ListItemButton>
                    </ListItem>
                  ))
                }
              </List>
            </Fragment>
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