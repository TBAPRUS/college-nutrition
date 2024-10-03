import { Box, FormControl, Input, InputLabel, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, TablePagination } from "@mui/material";
import axios from "axios";
import { useContext, useEffect, useMemo, useState } from "react";
import UserContext from "../../contextes/UserContext";
import LoadingButton from "../../components/LoadingButton";
import DishRow from "./DishRow";

export default function PersonalDishes() {
  const { user } = useContext(UserContext)

  const [personalDishes, setPersonalDishes] = useState([]);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPersonalDishes()
  }, [limit, offset, search, user])

  const getPersonalDishes = () => {
    let requestNum = 0
    return (() => {
      if (!user) return;
      requestNum++;
      const currentNum = requestNum;
      return axios.get('/dishes', {
        params: { limit, offset, name: search }
      })
        .then(({ data }) => {
          if (currentNum !== requestNum) return;
          setTotal(data.total)
          setPersonalDishes(data.dishes.map((dish) => ({
            ...dish,
            loading: false
          })))
        })
        .catch((error) => {
          console.log(error)
        })
    })()
  }

  const dishes = useMemo(
    () => personalDishes,
    [personalDishes, search, limit, offset]
  )

  const handleChangeSearch = (event) => {
    setSearch(event.target.value)
    setOffset(0)
  }

  const handleChangeName = (event) => {
    setName(event.target.value)
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
      await axios.post('/dishes', {name, groceries: []})
      setName('')
      await getPersonalDishes()
    } catch (err) {
      console.log(err)
    }
    setLoading(false);
  }

  const handleRemoveDish = () => {
    getPersonalDishes()
  }

  const handleEditDish = () => {
    getPersonalDishes()
  }

  const isValid = useMemo(() => name?.length, [name]);

  return (
    <Box sx={{ flexGrow: '1', flexBasis: '1' }}>
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
              <TableCell sx={{ width: '30px' }}>
              </TableCell>
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
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell />
              <TableCell>
                <Input
                  placeholder="Название"
                  value={name}
                  onChange={handleChangeName}
                />
              </TableCell>
              <TableCell />
              <TableCell />
              <TableCell />
              <TableCell />
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
            {dishes.map((dish) => (
              <DishRow
                key={dish.id}
                dish={dish}
                onRemove={handleRemoveDish}
                onEdit={handleEditDish}
              />
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