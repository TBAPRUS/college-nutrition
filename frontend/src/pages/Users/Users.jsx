import { Fragment, useEffect, useMemo, useState } from "react";
import { Box, FormControl, InputLabel, Checkbox, Input, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Typography, Button } from "@mui/material";
import Layout from "../Layout";
import LoadingButton from "../../components/LoadingButton";
import axios from "axios";


export default function Users() {
  const [creatingLoading, setCreatingLoading] = useState(false)
  const [hasUniqueError, setHasUniqueError] = useState(false)

  const [users, setUsers] = useState([])
  const [editedUsers, setEditedUsers] = useState({})
  
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(10)
  const [offset, setOffset] = useState(0)

  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    getUsers()
  }, [limit, offset, search])

  const getUsers = (() => {
    let requestNum = 0
    return () => {
      requestNum++
      const currentNum = requestNum
      axios.get('/users', {
        params: { limit, offset, login: search }
      })
        .then(({ data }) => {
          if (currentNum !== requestNum) return;
          setTotal(data.total)
          setUsers(data.users)
        })
        .catch((error) => {
          console.log(error)
        })
    }
  })()

  const handleChangeSearch = (event) => {
    setSearch(event.target.value)
    setOffset(0)
  }

  const handleChangeLogin = (event) => {
    setLogin(event.target.value)
    setHasUniqueError(false)
  }

  const handleChangePassword = (event) => {
    setPassword(event.target.value)
  }

  const handleClickCreate = async () => {
    setCreatingLoading(true)
    try {
      await axios.post('/users', {login, password})
      setLogin('')
      setPassword('')
      getUsers()
    } catch (err) {
      if (err.response.data.message === 'Логин должен быть уникальным') {
        setHasUniqueError(true)
      }
      console.log(err)
    }
    setCreatingLoading(false)
  }

  const handleChangePage = (_, page) => {
    setOffset(page * limit)
  }

  const handleChangeRowsPerPage = (event) => {
    setLimit(event.target.value)
    setOffset(Math.floor(offset / event.target.value) * event.target.value)
  }

  const handleStartEditing = (id) => {
    setEditedUsers((editedUsers) => ({...editedUsers, [id]: {...users.find((user) => user.id === id), password: ''}}))
  }

  const handleStopEditing = (id) => {
    setEditedUsers((editedUsers) => {
      const newEditedUsers = {...editedUsers}
      delete newEditedUsers[id]
      return newEditedUsers
    })
  }

  const handleChangeUserLogin = (id, event) => {
    setEditedUsers((users) => ({...users, [id]: {...users[id], login: event.target.value, hasUniqueError: false}}))
  }

  const handleChangeUserPassword = (id, event) => {
    setEditedUsers((users) => ({...users, [id]: {...users[id], password: event.target.value}}))
  }
  
  const handleSaveUser = async (id) => {
    setEditedUsers((users) => ({...users, [id]: {...users[id], loading: true}}))
    try {
      await axios.patch(`/users/${id}`, {
        login: editedUsers[id].login,
        password: editedUsers[id].password || undefined,
      })
      handleStopEditing(id)
      getUsers()
    } catch (err) {
      if (err.response.data.message === 'Логин должен быть уникальным') {
        setEditedUsers((users) => ({...users, [id]: {...users[id], hasUniqueError: true}}))
      }
      console.log(err)
      setEditedUsers((users) => ({...users, [id]: {...users[id], loading: false}}))
    }
  }

  const isValidUser = (id) => {
    return editedUsers[id] && editedUsers[id].login?.length > 0 && (!editedUsers[id].password || editedUsers[id].password?.length > 0) && !editedUsers[id].hasUniqueError
  }

  const isValid = useMemo(() => login?.length && password?.length && !hasUniqueError, [login, password, hasUniqueError])
  
  return (
    <Layout>
      <Box sx={{ display: 'flex', width: '100%', gap: '32px', flexWrap: 'wrap' }}>
        <Box sx={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignContent: 'center' }}>
          <FormControl variant="standard">
            <InputLabel htmlFor="search">Поиск по логину</InputLabel>
            <Input
              id="search"
              value={search}
              onChange={handleChangeSearch}
            />
          </FormControl>
        </Box>
        <TableContainer sx={{ maxHeight: '827px' }} component={Paper}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>
                  ID
                </TableCell>
                <TableCell>
                  Логин
                </TableCell>
                <TableCell>
                  Пароль
                </TableCell>
                <TableCell>
                  Админ
                </TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell />
                <TableCell>
                  <Box>
                    <Input
                      placeholder="Логин"
                      value={login}
                      onChange={handleChangeLogin}
                    />
                    {
                      hasUniqueError ?
                      <Typography sx={{ fontSize: '12px', marginTop: '2px', color: '#bf0000' }}>
                        Логин должен быть уникальным
                      </Typography> : null
                    }
                  </Box>
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="Пароль"
                    type="password"
                    value={password}
                    onChange={handleChangePassword}
                  />
                </TableCell>
                <TableCell>
                  <Checkbox
                    sx={{ padding: '0' }}
                    disabled
                    checked={false}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: '8px', justifyContent: 'flex-end'}}>
                    <LoadingButton
                      loading={creatingLoading}
                      disabled={!isValid}
                      variant="contained"
                      onClick={handleClickCreate}
                    >
                      Создать
                    </LoadingButton>
                  </Box>
                </TableCell>
              </TableRow>
              {users.map((row) => (
                <TableRow
                  key={row.id}
                >
                  <TableCell>
                    { row.id }
                  </TableCell>
                  <TableCell>
                    {
                      editedUsers[row.id]
                      ?
                        <Box>
                          <Input
                            placeholder="Логин"
                            value={editedUsers[row.id].login}
                            onChange={(event) => handleChangeUserLogin(row.id, event)}
                          />
                          {
                            editedUsers[row.id].hasUniqueError ?
                            <Typography sx={{ fontSize: '12px', marginTop: '2px', color: '#bf0000' }}>
                              Логин должен быть уникальным
                            </Typography> : null
                          }
                        </Box>
                      : row.login
                    }
                  </TableCell>
                  <TableCell>
                    {
                      editedUsers[row.id]
                      ? <Box>
                          <Input
                            placeholder="Новый пароль"
                            type="password"
                            value={editedUsers[row.id].password}
                            onChange={(event) => handleChangeUserPassword(row.id, event)}
                          />
                          <Typography sx={{ fontSize: '12px', marginTop: '2px' }}>
                            Чтобы оставить прошлый пароль - оставьте поле пустым
                          </Typography>
                        </Box>
                      : '********'
                    }
                  </TableCell>
                  <TableCell>
                    {
                      editedUsers[row.id]
                      ? <Checkbox
                          disabled
                          sx={{ padding: '0' }}
                          checked={editedUsers[row.id].isAdmin}
                        />
                      : row.isAdmin ? 'Да' : 'Нет'
                    }
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: '8px', justifyContent: 'flex-end'}}>
                      {
                        editedUsers[row.id]
                        ? <Fragment>
                            <Button
                              variant="contained"
                              disabled={!isValidUser(row.id)}
                              onClick={() => handleSaveUser(row.id)}
                            >
                              Сохранить
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={() => handleStopEditing(row.id)}
                            >
                              Отменить
                            </Button>
                          </Fragment>
                        : <Fragment>
                            <Button
                              disabled={row.isAdmin}
                              variant="contained"
                              color="warning"
                              onClick={() => handleStartEditing(row.id)}
                            >
                              Изменить
                            </Button>
                          </Fragment>
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
    </Layout>
  )
}