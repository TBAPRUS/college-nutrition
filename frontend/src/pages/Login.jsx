import { useState } from 'react';
import axios from "axios";
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Card, CardContent, CardActions, Box, Typography, IconButton, Input, InputLabel, InputAdornment, FormControl, Alert } from '@mui/material';
import LoadingButton from '../components/LoadingButton'

export default function Login({ onLogin }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChangeLogin = (event) => {
    setLogin(event.target.value);
    setError('');
  }

  const handleChangePassword = (event) => {
    setPassword(event.target.value);
    setError('');
  }

  const handleClickShowPassword = () => {
    setShowPassword((showPassword) => !showPassword);
  }

  const handleClickButton = async () => {
    setLoading(true);
    try {
      await axios.post('/login', {
        login,
        password
      });
      onLogin();
    } catch (error) {
      setError(error.response.data.message);
    } finally {
      setLoading(false);
    }
  }

  const disabled = !login || !password;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <Card variant="outlined">
        <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h5">
            Вход
          </Typography>
          <FormControl sx={{ m: 1, width: '30ch' }} variant="standard">
            <InputLabel htmlFor="login">Логин</InputLabel>
            <Input
              id="login"
              value={login}
              onChange={handleChangeLogin}
            />
          </FormControl>
          <FormControl sx={{ m: 1, width: '30ch' }} variant="standard">
            <InputLabel htmlFor="password">Пароль</InputLabel>
            <Input
              id="password"
              value={password}
              onChange={handleChangePassword}
              type={showPassword ? 'text' : 'password'}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              }
            />
          </FormControl>
        </CardContent>
        <CardActions sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Box sx={{ display: 'flex', alignSelf: 'flex-end', justifyContent: 'flex-end' }}>
            <LoadingButton
              loading={loading}
              disabled={disabled}
              variant="contained"
              onClick={handleClickButton}
            >
              Войти
            </LoadingButton>
          </Box>
           {
            error && <Alert severity="error">
              { error }
            </Alert>
           }
        </CardActions>
      </Card>
    </Box>
  )
}