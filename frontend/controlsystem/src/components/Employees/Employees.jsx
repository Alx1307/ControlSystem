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
  CircularProgress,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  Card,
  CardContent,
  InputAdornment,
  TablePagination 
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon
} from '@mui/icons-material';
import { usersAPI } from '../../services/api';

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

  const [searchParams, setSearchParams] = useState({
    search: '',
    role: '',
    sortBy: 'name',
    sortOrder: 'ASC'
  });
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [showFilters, setShowFilters] = useState(false);

  const roles = ['Менеджер', 'Инженер', 'Наблюдатель'];
  
  const sortOptions = [
    { value: 'name:ASC', label: 'ФИО (А-Я)' },
    { value: 'name:DESC', label: 'ФИО (Я-А)' },
    { value: 'email:ASC', label: 'Email (А-Я)' },
    { value: 'email:DESC', label: 'Email (Я-А)' },
    { value: 'role:ASC', label: 'Роль (А-Я)' },
    { value: 'role:DESC', label: 'Роль (Я-А)' }
  ];

  useEffect(() => {
    loadUsers();
  }, [searchParams, pagination.page, pagination.limit]);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        ...searchParams,
        page: pagination.page + 1,
        limit: pagination.limit
      };

      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) {
          delete params[key];
        }
      });

      const response = await usersAPI.searchUsers(params);
      if (response.data.success) {
        setUsers(response.data.users || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.total,
          totalPages: Math.ceil(response.data.total / pagination.limit)
        }));
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError(error.response?.data?.message || 'Ошибка при загрузке списка сотрудников');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (field, value) => {
    setSearchParams(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handleSortChange = (value) => {
    const [sortBy, sortOrder] = value.split(':');
    setSearchParams(prev => ({ ...prev, sortBy, sortOrder }));
  };

  const handleFilterChange = (field, value) => {
    setSearchParams(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const clearFilters = () => {
    setSearchParams({
      search: '',
      role: '',
      sortBy: 'name',
      sortOrder: 'ASC'
    });
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handlePageChange = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (event) => {
    setPagination(prev => ({
      ...prev,
      limit: parseInt(event.target.value, 10),
      page: 0
    }));
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
      const response = await usersAPI.addUser(formData.email, formData.role);
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
      const response = await usersAPI.deleteUser(selectedUser.id);
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

  const hasActiveFilters = () => {
    return searchParams.search || searchParams.role;
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Менеджер': return 'primary';
      case 'Инженер': return 'secondary';
      case 'Наблюдатель': return 'default';
      default: return 'default';
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

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Поиск по ФИО или email..."
                value={searchParams.search}
                onChange={(e) => handleSearchChange('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Сортировка</InputLabel>
                <Select
                  value={`${searchParams.sortBy}:${searchParams.sortOrder}`}
                  onChange={(e) => handleSortChange(e.target.value)}
                  label="Сортировка"
                  startAdornment={
                    <InputAdornment position="start">
                      <SortIcon />
                    </InputAdornment>
                  }
                >
                  {sortOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setShowFilters(!showFilters)}
                color={hasActiveFilters() ? "primary" : "inherit"}
              >
                Фильтры {hasActiveFilters() && '•'}
              </Button>
            </Grid>
          </Grid>

          {showFilters && (
            <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel shrink={true}>Роль</InputLabel>
                  <Select
                    value={searchParams.role || ''}
                    onChange={(e) => handleFilterChange('role', e.target.value)}
                    label="Роль"
                    displayEmpty
                  >
                    <MenuItem value="">
                      <em>Все роли</em>
                    </MenuItem>
                    {roles.map(role => (
                      <MenuItem key={role} value={role}>
                        {role}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="secondary"
                    onClick={clearFilters}
                    disabled={!hasActiveFilters()}
                    sx={{ height: '56px' }}
                  >
                    Сбросить фильтры
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

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
                    {hasActiveFilters() ? 'Нет сотрудников, соответствующих фильтрам' : 'Нет данных о сотрудниках'}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Typography 
                        variant="body1" 
                        sx={{
                          fontWeight: user.full_name ? 500 : 400,
                          color: user.full_name ? 'text.primary' : 'text.secondary'
                        }}
                      >
                        {user.full_name || 'Не завершил регистрацию'}
                      </Typography>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.role} 
                        color={getRoleColor(user.role)}
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="error"
                        onClick={() => openDeleteDialog(user)}
                        disabled={loading}
                        title="Удалить сотрудника"
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
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={pagination.total}
          rowsPerPage={pagination.limit}
          page={pagination.page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          labelRowsPerPage="Строк на странице:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} из ${count !== -1 ? count : `более ${to}`}`
          }
        />
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
          {selectedUser?.role && (
            <Typography variant="body2" color="text.secondary">
              Роль: {selectedUser.role}
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