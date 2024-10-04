import { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Box, Divider, Tooltip, IconButton, Avatar, Menu, MenuItem, ListItemIcon, Typography } from '@mui/material';
import { Logout } from '@mui/icons-material';
import axios from 'axios';
import UserContext from '../contextes/UserContext';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useContext(UserContext)

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.target)
  }

  const handleClose = () => {
    setAnchorEl(null);
  }

  const handleLogout = async () => {
    try {
      await axios.post('/logout');
      setUser(null)
      navigate('/login')
    } catch (err) {
      console.log(err)
    }
  }

  const getStyle = (pathname) => {
    return {
      paddingBottom: '4px',
      color: pathname === location.pathname ? '#0d47a1' : '#42a5f5',
      borderBottom: pathname === location.pathname ? '2px solid #0d47a1' : '',
    }
  }

  return (
    <div>
      <Box
        my={2}
        gap={4}
        sx={{display: 'flex', alignItems: 'center',
        textAlign: 'center', background: 'primary.light',
        justifyContent: 'center'}}
      >
        {
          !user.isAdmin
          ? (
              <Link
                to="/meals"
                style={getStyle("/meals")}
              >
                Питание
              </Link>
            )
          : null
        }
        <Link
          to="/groceries"
          style={getStyle("/groceries")}
        >
          Продукты
        </Link>
        {
          !user.isAdmin
          ? (
              <Link
                to="/dishes"
                style={getStyle("/dishes")}
              >
                Блюда
              </Link>
            )
          : null
        }
        {
          user.isAdmin
          ? (
              <Link
                to="/users"
                style={getStyle("/users")}
              >
                Пользователи
              </Link>
            )
          : null
        }
        {
          !user.isAdmin
          ? <Link
              to="/diets"
              style={getStyle("/diets")}
            >
              Рационы
            </Link>
          : null
        }
        <Tooltip title="Управление аккаунтом">
          <IconButton
            onClick={handleClick}
            size="small"
            sx={{ ml: 2 }}
            aria-controls={open ? 'account-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
          >
            <Avatar sx={{ width: 32, height: 32 }}></Avatar>
          </IconButton>
        </Tooltip>
      </Box>
      <Divider />
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
              '&::before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Typography sx={{ textAlign: 'center', marginBottom: '4px' }}>
          Логин: { user.login }
        </Typography>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Выйти из аккаунта
        </MenuItem>
      </Menu>
    </div>
  )
}