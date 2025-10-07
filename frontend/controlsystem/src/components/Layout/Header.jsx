import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAuthenticated = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          ControlSystem
        </Typography>
        
        <Box>
          {isAuthenticated ? (
            <>
              <Typography variant="body1" component="span" sx={{ mr: 2 }}>
                {user.full_name} ({user.role})
              </Typography>
              <Button color="inherit" onClick={handleLogout}>
                Выйти
              </Button>
            </>
          ) : (
            <>
              {location.pathname !== '/login' && (
                <Button color="inherit" onClick={() => navigate('/login')}>
                  Войти
                </Button>
              )}
              {location.pathname !== '/register' && (
                <Button color="inherit" onClick={() => navigate('/register')}>
                  Регистрация
                </Button>
              )}
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;