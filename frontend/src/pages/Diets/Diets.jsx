import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Layout from "../Layout";
import { Box, FormControl, Input, InputLabel, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, TablePagination } from "@mui/material";
import UserContext from "../../contextes/UserContext";
import LoadingButton from "../../components/LoadingButton";
import DishRow from "../Dishes/DishRow";
import DietRow from "./DietRow";
import dayjs from "dayjs";

export default function Diets() {
  const { user } = useContext(UserContext)

  const [diets, setDiets] = useState([]);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDiets()
  }, [limit, offset, search, user])

  const getDiets = () => {
    let requestNum = 0
    return (() => {
      if (!user) return;
      requestNum++;
      const currentNum = requestNum;
      return axios.get('/diets', {
        params: { limit, offset, name: search }
      })
        .then(({ data }) => {
          if (currentNum !== requestNum) return;
          setTotal(data.total)
          setDiets(data.diets.map((diet) => ({
            ...diet,
            dishes: diet.dishes.map((dish) => ({
              ...dish,
              time: dayjs().hour(dish.time.slice(0, 2)).minute(dish.time.slice(3, 5))
            })),
            loading: false
          })))
        })
        .catch((error) => {
          console.log(error)
        })
    })()
  }

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
      await axios.post('/diets', {name})
      setName('')
      await getDiets()
    } catch (err) {
      console.log(err)
    }
    setLoading(false);
  }

  const handleRemoveDiet = () => {
    getDiets()
  }

  const handleSaveDiet = () => {
    getDiets()
  }

  const handleSelectDiet = () => {
    getDiets()
  }

  const isValid = useMemo(() => name?.length, [name]);

  return (
    <Layout>
      <Box>
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
              {diets.map((diet) => (
                <DietRow
                  key={diet.id}
                  diet={diet}
                  onRemove={handleRemoveDiet}
                  onSave={handleSaveDiet}
                  onSelect={handleSelectDiet}
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
    </Layout>
  )
}