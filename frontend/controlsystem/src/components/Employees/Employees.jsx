import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { authAPI } from '../../services/api';

const Employees = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    role: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const roles = ['Менеджер', 'Инженер', 'Наблюдатель'];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.getAllUsers();
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError(error.response?.data?.message || 'Ошибка при загрузке списка сотрудников');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    const errors = {};
    if (!formData.email) {
      errors.email = 'Email обязателен';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Введите корректный email';
    }
    if (!formData.role) {
      errors.role = 'Роль обязательна';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.addUser(formData.email, formData.role);
      if (response.data.success) {
        setSuccess('Сотрудник успешно добавлен');
        setAddDialogOpen(false);
        setFormData({ email: '', role: '' });
        setFormErrors({});
        loadUsers();
      }
    } catch (error) {
      console.error('Error adding user:', error);
      setError(error.response?.data?.message || 'Ошибка при добавлении сотрудника');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      const response = await authAPI.deleteUser(selectedUser.id);
      if (response.data.success) {
        setSuccess('Сотрудник успешно удален');
        setDeleteDialogOpen(false);
        setSelectedUser(null);
        loadUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error.response?.data?.message || 'Ошибка при удалении сотрудника');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const closeAddDialog = () => {
    setAddDialogOpen(false);
    setFormData({ email: '', role: '' });
    setFormErrors({});
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Сотрудники
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddDialogOpen(true)}
        >
          Добавить сотрудника
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ФИО</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Роль</TableCell>
                <TableCell align="center">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    Нет данных о сотрудниках
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      {user.full_name || 'Не завершил регистрацию'}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="error"
                        onClick={() => openDeleteDialog(user)}
                        disabled={loading}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={addDialogOpen} onClose={closeAddDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Добавить сотрудника</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={formData.email}
            onChange={(e) => handleFormChange('email', e.target.value)}
            error={!!formErrors.email}
            helperText={formErrors.email}
            disabled={loading}
          />
          <TextField
            select
            margin="dense"
            label="Роль"
            fullWidth
            variant="outlined"
            value={formData.role}
            onChange={(e) => handleFormChange('role', e.target.value)}
            error={!!formErrors.role}
            helperText={formErrors.role}
            disabled={loading}
          >
            {roles.map((role) => (
              <MenuItem key={role} value={role}>
                {role}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddDialog} disabled={loading}>
            Отмена
          </Button>
          <Button 
            onClick={handleAddUser} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog}>
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить сотрудника {selectedUser?.email}?
          </Typography>
          {selectedUser?.full_name && (
            <Typography variant="body2" color="text.secondary">
              ФИО: {selectedUser.full_name}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={closeDeleteDialog}
            variant="contained"
            disabled={loading}
          >
            Отмена
          </Button>
          <Button 
            onClick={handleDeleteUser} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Employees;