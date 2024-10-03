import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import Login from './pages/Login';
import Loader from './components/Loader';
import Diets from './pages/Diets/Diets';
import Groceries from './pages/Groceries/Groceries';
import UserContext from './contextes/UserContext';
import Dishes from './pages/Dishes/Dishes';
import Users from './pages/Users/Users';

axios.defaults.withCredentials = true
axios.interceptors.request.use(function (config) {
  config.url = `http://192.168.0.102:7777${config.url}`;
  return config
})

const Bootstrap = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
  }, [])

  const userContextValue = useMemo(() => ({
    user,
    setUser
  }), [user, setUser])

  const getMe = () => {
    axios.get('/me')
      .then(({ data }) => {
        setUser(data.user)
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      })
  }

  const onLogin = () => {
    getMe()
  }

  if (loading) {
    return (
      <div className="bootstrap">
        <Loader color="black" />
      </div>
    )
  }

  return (
    <React.StrictMode>
      <UserContext.Provider value={userContextValue}>
        <BrowserRouter>
          <Routes>
            <Route path="/groceries" element={user ? <Groceries /> : <Navigate to="/login" />} />
            <Route path="/dishes" element={user ? <Dishes /> : <Navigate to="/login" />} />
            <Route path="/diets" element={user ? <Diets /> : <Navigate to="/login" />} />
            <Route path="/users" element={user?.isAdmin ? <Users /> : <Navigate to="/login" />} />
            <Route path="/login" element={user ? <Navigate to="/groceries" /> : <Login onLogin={onLogin} />} />
            <Route path="*" element={<Navigate to="/groceries" />} />
          </Routes>
        </BrowserRouter>
      </UserContext.Provider>
    </React.StrictMode>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Bootstrap />
);