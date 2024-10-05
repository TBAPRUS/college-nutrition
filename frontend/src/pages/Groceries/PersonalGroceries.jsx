import { Box, FormControl, InputLabel, Checkbox, Input, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Button, TablePagination, Tooltip } from "@mui/material";
import axios from "axios";
import { useContext, useEffect, useMemo, useState } from "react";
import UserContext from "../../contextes/UserContext";
import LoadingButton from "../../components/LoadingButton";

export default function PersonalGroceries() {
  const { user } = useContext(UserContext)

  const [personalGroceries, setPersonalGroceries] = useState([]);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

  const [name, setName] = useState('');
  const [proteins, setProteins] = useState('');
  const [fats, setFats] = useState('');
  const [carbohydrates, setCarbohydrates] = useState('');
  const [isLiquid, setIsLiquid] = useState(false);
  const [gettingLoading, setGettingLoading] = useState(false);
  const [creatingLading, setCreatingLoading] = useState(false);

  useEffect(() => {
    getPersonalGroceries()
  }, [limit, offset, user]);

  const getPersonalGroceries = (() => {
    let requestNum = 0;
    return (newOffset) => {
      if (!user) return;
      if (newOffset !== undefined) setOffset(newOffset);
      requestNum++;
      const currentRequestNum = requestNum;
      setGettingLoading(true)
      return axios.get('/groceries', {
        params: { limit, offset: newOffset !== undefined ? newOffset : offset, userId: user.id, name: search }
      })
        .then(({ data }) => {
          if (currentRequestNum !== requestNum) return;
          setTotal(data.total)
          setPersonalGroceries(data.groceries.map((grocery) => ({
            ...grocery,
            calories: (grocery.proteins * 4.1 + grocery.fats * 9.29 + grocery.carbohydrates * 4.2),
            loading: false
          })))
        })
        .catch((error) => {
          console.log(error)
        })
        .finally(() => {
          setGettingLoading(false)
        })
    }
  })()

  const handleClickSearch = () => {
    getPersonalGroceries(0)
  }

  const handleChangeSearch = (event) => {
    setSearch(event.target.value)
    setOffset(0)
  }

  const handleChangeName = (event) => {
    setName(event.target.value)
  }

  const handleChangeProteins = (event) => {
    setProteins(event.target.value)
  }

  const handleChangeFats = (event) => {
    setFats(event.target.value)
  }

  const handleChangeCarbohydrates = (event) => {
    setCarbohydrates(event.target.value)
  }

  const handleChangeIsLiquid = (event) => {
    setIsLiquid(event.target.checked)
  }

  const handleChangePage = (_, page) => {
    setOffset(page * limit)
  }
  
  const handleChangeRowsPerPage = (event) => {
    setLimit(event.target.value)
    setOffset(Math.floor(offset / event.target.value) * event.target.value)
  }

  const handleClickCreate = async () => {
    setCreatingLoading(true);
    try {
      await axios.post('/groceries', {name, proteins, fats, carbohydrates, isLiquid})
      await getPersonalGroceries()
      setName('')
      setProteins('')
      setFats('')
      setCarbohydrates('')
      setIsLiquid(false)
    } catch (err) {
      console.log(err)
    }
    setCreatingLoading(false);
  }

  const handleRemoveGrocery = async (id) => {
    setPersonalGroceries((groceries) => groceries.map((grocery) => ({
      ...grocery,
      loading: id === grocery.id ? true : grocery.loading
    })))
    try {
      await axios.delete(`/groceries/${id}`);
      await getPersonalGroceries();
    } catch (err) {
      console.log(err)
      setPersonalGroceries((groceries) => groceries.map((grocery) => ({
        ...grocery,
        loading: id === grocery.id ? false : grocery.loading
      })))
    }
  }

  const isValid = useMemo(() =>
    name?.length && parseFloat(proteins) >= 0 && parseFloat(fats) >= 0 && parseFloat(carbohydrates) >= 0,
  [name, proteins, fats, carbohydrates]);

  return (
    <Box sx={{ flexGrow: '1', flexBasis: '1' }}>
      <Typography variant="h4" mb="8px">
        Персональные
      </Typography>
      <Box sx={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignContent: 'center' }}>
        <FormControl variant="standard">
          <InputLabel htmlFor="search">Поиск по названию</InputLabel>
          <Input
            id="search"
            value={search}
            onChange={handleChangeSearch}
            />
        </FormControl>

        <LoadingButton
          loading={gettingLoading}
          disabled={!search}
          variant="contained"
          onClick={handleClickSearch}
        >
          Поиск
        </LoadingButton>
      </Box>
      <TableContainer sx={{ maxHeight: '827px' }} component={Paper}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>
                Название (100 г. продукта)
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
                Жидкость
              </TableCell>
              <TableCell>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
                <TableCell>
                  <Input
                    placeholder="Название"
                    value={name}
                    onChange={handleChangeName}
                  />
                </TableCell>
                <TableCell />
                <TableCell>
                  <Input
                    sx={{ marginRight: "4px", maxWidth: "60px" }}
                    placeholder="Белки"
                    type="number"
                    value={proteins}
                    onChange={handleChangeProteins}
                  />
                  г.
                </TableCell>
                <TableCell>
                  <Input
                    sx={{ marginRight: "4px", maxWidth: "60px" }}
                    placeholder="Жиры"
                    type="number"
                    value={fats}
                    onChange={handleChangeFats}
                  />
                  г.
                </TableCell>
                <TableCell>
                  <Input
                    sx={{ marginRight: "4px", maxWidth: "60px" }}
                    placeholder="Углеводы"
                    type="number"
                    value={carbohydrates}
                    onChange={handleChangeCarbohydrates}
                  />
                  г.
                </TableCell>
                <TableCell>
                  <Checkbox
                    sx={{ padding: '0' }}
                    checked={isLiquid}
                    onChange={handleChangeIsLiquid}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: '8px', justifyContent: 'flex-end'}}>
                    <LoadingButton
                      loading={creatingLading}
                      disabled={!isValid}
                      variant="contained"
                      onClick={handleClickCreate}
                    >
                      Создать
                    </LoadingButton>
                  </Box>
                </TableCell>
            </TableRow>
            {personalGroceries.map((row) => (
              <TableRow
                key={row.id}
              >
                <TableCell>
                  { row.name }
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
                  { row.isLiquid ? 'Да' : 'Нет' }
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: '8px', justifyContent: 'flex-end'}}>
                    {
                      row.dishesCount > 0
                      ? <Tooltip title="Вы не можете удалить продукт, пока он используется в хотя бы одном блюде" arrow>
                          <Box>
                            <LoadingButton
                              loading={row.loading}
                              disabled
                              variant="contained"
                              color="error"
                            >
                              Удалить
                            </LoadingButton>
                          </Box>
                        </Tooltip>
                      : <LoadingButton
                          loading={row.loading}
                          variant="contained"
                          color="error"
                          onClick={() => handleRemoveGrocery(row.id)}
                        >
                          Удалить
                        </LoadingButton>
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
    </Box>
  )
}