import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  AppBar,
  Toolbar,
  Box,
  Container,
  IconButton,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Business as BusinessIcon,
  Build as DefectsIcon,
  People as PeopleIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { usersAPI } from '../../services/api';

const drawerWidth = 240;

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: ''
  });
  const [formErrors, setFormErrors] = useState({});
  
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const menuItems = [
    { text: 'Объекты', icon: <BusinessIcon />, path: '/objects' },
    { text: 'Дефекты', icon: <DefectsIcon />, path: '/defects' },
  ];

  if (user.role === 'Менеджер') {
    menuItems.push({ text: 'Сотрудники', icon: <PeopleIcon />, path: '/employees' });
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
  };

  const confirmLogout = () => {
    handleLogout();
    setLogoutDialogOpen(false);
  };

  const cancelLogout = () => {
    setLogoutDialogOpen(false);
  };

  const handleProfileClick = () => {
    setProfileData({
      full_name: user.full_name || '',
      email: user.email || ''
    });
    setFormErrors({});
    setError('');
    setSuccess('');
    setProfileDialogOpen(true);
  };

  const handleProfileUpdate = async () => {
    const errors = {};
    if (!profileData.full_name?.trim()) {
      errors.full_name = 'ФИО обязательно';
    }
    if (!profileData.email?.trim()) {
      errors.email = 'Email обязателен';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      errors.email = 'Введите корректный email';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await usersAPI.updateUser(user.id, {
        full_name: profileData.full_name.trim(),
        email: profileData.email.trim()
      });

      if (response.data.success) {
        setSuccess('Данные успешно обновлены');
        
        const updatedUser = {
          ...user,
          full_name: profileData.full_name.trim(),
          email: profileData.email.trim()
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setTimeout(() => {
          setProfileDialogOpen(false);
        }, 1000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || 'Ошибка при обновлении данных');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const closeProfileDialog = () => {
    setProfileDialogOpen(false);
    setFormErrors({});
    setError('');
    setSuccess('');
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          ControlSystem
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => {
          const isSelected = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                selected={isSelected}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'primary.main',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isSelected ? 'white' : 'inherit',
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Панель управления
          </Typography>
          <Typography 
            variant="body1" 
            component="span" 
            sx={{ 
              mr: 2, 
              cursor: 'pointer',
              textDecoration: 'underline',
              '&:hover': {
                opacity: 0.8
              }
            }}
            onClick={handleProfileClick}
          >
            {user.full_name} ({user.role})
          </Typography>
          <Button color="inherit" onClick={handleLogoutClick}>
            Выйти
          </Button>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              border: 'none',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Container maxWidth="lg">
          {children}
        </Container>
      </Box>

      <Dialog open={profileDialogOpen} onClose={closeProfileDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Редактирование профиля</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <TextField
            autoFocus
            margin="dense"
            label="ФИО"
            fullWidth
            variant="outlined"
            value={profileData.full_name}
            onChange={(e) => handleProfileChange('full_name', e.target.value)}
            error={!!formErrors.full_name}
            helperText={formErrors.full_name}
            disabled={loading}
            sx={{ mt: 2 }}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={profileData.email}
            onChange={(e) => handleProfileChange('email', e.target.value)}
            error={!!formErrors.email}
            helperText={formErrors.email}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeProfileDialog} disabled={loading}>
            Отмена
          </Button>
          <Button 
            onClick={handleProfileUpdate} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={logoutDialogOpen} onClose={cancelLogout}>
        <DialogTitle>Подтверждение выхода</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите выйти из системы?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelLogout} variant="contained">
            Отмена
          </Button>
          <Button 
            onClick={confirmLogout} 
            color="error" 
            variant="contained"
          >
            Выйти
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Layout;