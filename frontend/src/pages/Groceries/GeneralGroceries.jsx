import { Box, FormControl, Input, InputLabel, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Checkbox, TablePagination, Tooltip } from "@mui/material";
import axios from "axios";
import { useContext, useEffect, useMemo, useState } from "react";
import UserContext from "../../contextes/UserContext";
import LoadingButton from "../../components/LoadingButton";

export default function GeneralGroceries() {
  const { user } = useContext(UserContext)

  const [generalGroceries, setGeneralGroceries] = useState([]);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

  const [name, setName] = useState('');
  const [proteins, setProteins] = useState('');
  const [fats, setFats] = useState('');
  const [carbohydrates, setCarbohydrates] = useState('');
  const [isLiquid, setIsLiquid] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getGeneralGroceries()
  }, [])

  const getGeneralGroceries = () => {
    if (!user) return;
    return axios.get('/groceries', {
      params: { limit: 300, offset: 0 }
    })
      .then(({ data }) => {
        setTotal(data.total)
        setGeneralGroceries(data.groceries.map((grocery) => ({
          ...grocery,
          calories: (grocery.proteins * 4.1 + grocery.fats * 9.29 + grocery.carbohydrates * 4.2),
          loading: false
        })))
      })
      .catch((error) => {
        console.log(error)
      })
  }

  const filteredGroceries = useMemo(
    () => generalGroceries
      .filter((grocery) => grocery.name.toLowerCase().indexOf(search.toLowerCase()) !== -1),
    [generalGroceries, search]
  )

  const groceries = useMemo(
    () => filteredGroceries
      .filter((_, i) => i >= offset && i < offset + limit),
    [filteredGroceries, limit, offset]
  )

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
    setLoading(true);
    try {
      await axios.post('/groceries', {name, proteins, fats, carbohydrates, isLiquid})
      await getGeneralGroceries()
      setName('')
      setProteins('')
      setFats('')
      setCarbohydrates('')
      setIsLiquid(false)
    } catch (err) {
      console.log(err)
    }
    setLoading(false);
  }

  const handleRemoveGrocery = async (id) => {
    setGeneralGroceries((groceries) => groceries.map((grocery) => ({
      ...grocery,
      loading: id === grocery.id ? true : grocery.loading
    })))
    try {
      await axios.delete(`/groceries/${id}`);
      setGeneralGroceries((groceries) => groceries.filter((grocery) => grocery.id !== id))
    } catch (err) {
      console.log(err)
      setGeneralGroceries((groceries) => groceries.map((grocery) => ({
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
        Общие
      </Typography>
      <Box sx={{ marginBottom: '12px' }}>
        <FormControl variant="standard">
          <InputLabel htmlFor="search">Поиск по названию</InputLabel>
          <Input
            id="search"
            value={search}
            onChange={handleChangeSearch}
          />
        </FormControl>
      </Box>
      <TableContainer sx={{ maxHeight: '827px' }} component={Paper}>
        <Table stickyHeader >
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
            {
              user.isAdmin &&
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
                      loading={loading}
                      disabled={!isValid}
                      variant="contained"
                      onClick={handleClickCreate}
                    >
                      Создать
                    </LoadingButton>
                  </Box>
                </TableCell>
              </TableRow>
            }
            {groceries.map((row) => (
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
                      user.isAdmin 
                      ? <LoadingButton
                          loading={row.loading}
                          variant="contained"
                          color="error"
                          onClick={() => handleRemoveGrocery(row.id)}
                        >
                          Удалить
                        </LoadingButton>
                      : null
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
        count={filteredGroceries?.length || 0}
        page={Math.floor(offset / limit)}
        rowsPerPage={limit}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  )
}