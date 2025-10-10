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
  Alert,
  CircularProgress,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  InputAdornment,
  TablePagination 
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon,
  Build as DefectIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { objectsAPI, defectsAPI } from '../../services/api';

const Objects = () => {
  const navigate = useNavigate();
  
  const [objects, setObjects] = useState([]);
  const [selectedObject, setSelectedObject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [objectHistory, setObjectHistory] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    start_date: '',
    end_date: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [addDefectDialogOpen, setAddDefectDialogOpen] = useState(false);
  const [defectFormData, setDefectFormData] = useState({
    title: '',
    description: '',
    priority_id: '2',
    due_date: ''
  });
  const [defectFormErrors, setDefectFormErrors] = useState({});
  const [searchParams, setSearchParams] = useState({
    name: '',
    address: '',
    start_date: '',
    end_date: '',
    status: '',
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

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isManager = user.role === 'Менеджер';

  const defectPriorities = [
    { id: 1, name: 'Низкий', color: 'success' },
    { id: 2, name: 'Средний', color: 'warning' },
    { id: 3, name: 'Высокий', color: 'error' }
  ];

  const statusOptions = [
    { value: '', label: 'Все статусы' },
    { value: 'not_started', label: 'Не начат' },
    { value: 'planned', label: 'Запланирован' },
    { value: 'in_progress', label: 'В работе' },
    { value: 'completed', label: 'Завершен' }
  ];

  const sortOptions = [
    { value: 'name:ASC', label: 'Название (А-Я)' },
    { value: 'name:DESC', label: 'Название (Я-А)' },
    { value: 'address:ASC', label: 'Адрес (А-Я)' },
    { value: 'address:DESC', label: 'Адрес (Я-А)' },
    { value: 'start_date:ASC', label: 'Дата начала (сначала старые)' },
    { value: 'start_date:DESC', label: 'Дата начала (сначала новые)' },
    { value: 'end_date:ASC', label: 'Дата окончания (сначала старые)' },
    { value: 'end_date:DESC', label: 'Дата окончания (сначала новые)' }
  ];

  useEffect(() => {
    loadObjects();
  }, [searchParams, pagination.page, pagination.limit]);

  const loadObjects = async () => {
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

      const response = await objectsAPI.searchObjects(params);
      if (response.data.success) {
        setObjects(response.data.objects || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('Error loading objects:', error);
      setError(error.response?.data?.message || 'Ошибка при загрузке списка объектов');
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
      name: '',
      address: '',
      start_date: '',
      end_date: '',
      status: '',
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

  const handleAddDefect = async () => {
    const errors = {};
    if (!defectFormData.title?.trim()) errors.title = 'Название обязательно';

    if (Object.keys(errors).length > 0) {
      setDefectFormErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const response = await defectsAPI.addDefect({
        ...defectFormData,
        object_id: selectedObject.id
      });
      if (response.data.success) {
        setSuccess('Дефект успешно создан');
        setAddDefectDialogOpen(false);
        setDefectFormData({ title: '', description: '', priority_id: '2', due_date: '' });
        setDefectFormErrors({});
        setSelectedObject(null);
      }
    } catch (error) {
      console.error('Error adding defect:', error);
      setError(error.response?.data?.message || 'Ошибка при создании дефекта');
    } finally {
      setLoading(false);
    }
  };

  const openAddDefectDialog = (object) => {
    setSelectedObject(object);
    setDefectFormData({ title: '', description: '', priority_id: '2', due_date: '' });
    setDefectFormErrors({});
    setAddDefectDialogOpen(true);
  };

  const closeAddDefectDialog = () => {
    setAddDefectDialogOpen(false);
    setDefectFormErrors({});
    setSelectedObject(null);
  };

  const handleDefectFormChange = (field, value) => {
    setDefectFormData(prev => ({ ...prev, [field]: value }));
    if (defectFormErrors[field]) {
      setDefectFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddObject = async () => {
    const errors = {};
    if (!formData.name?.trim()) errors.name = 'Название обязательно';
    if (!formData.address?.trim()) errors.address = 'Адрес обязателен';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const response = await objectsAPI.addObject(formData);
      if (response.data.success) {
        setSuccess('Объект успешно создан');
        setAddDialogOpen(false);
        setFormData({ name: '', description: '', address: '', start_date: '', end_date: '' });
        setFormErrors({});
        loadObjects();
      }
    } catch (error) {
      console.error('Error adding object:', error);
      setError(error.response?.data?.message || 'Ошибка при создании объекта');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateObject = async () => {
    const errors = {};
    if (!formData.name?.trim()) errors.name = 'Название обязательно';
    if (!formData.address?.trim()) errors.address = 'Адрес обязателен';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const response = await objectsAPI.updateObject(selectedObject.id, formData);
      if (response.data.success) {
        setSuccess('Объект успешно обновлен');
        setEditDialogOpen(false);
        setFormData({ name: '', description: '', address: '', start_date: '', end_date: '' });
        setFormErrors({});
        loadObjects();
      }
    } catch (error) {
      console.error('Error updating object:', error);
      setError(error.response?.data?.message || 'Ошибка при обновлении объекта');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteObject = async () => {
    if (!selectedObject) return;

    setLoading(true);
    try {
      const response = await objectsAPI.deleteObject(selectedObject.id);
      if (response.data.success) {
        setSuccess('Объект успешно удален');
        setDeleteDialogOpen(false);
        setSelectedObject(null);
        loadObjects();
      }
    } catch (error) {
      console.error('Error deleting object:', error);
      setError(error.response?.data?.message || 'Ошибка при удалении объекта');
    } finally {
      setLoading(false);
    }
  };

  const openAddDialog = () => {
    setFormData({ name: '', description: '', address: '', start_date: '', end_date: '' });
    setFormErrors({});
    setAddDialogOpen(true);
  };

  const openEditDialog = (object) => {
    setSelectedObject(object);
    setFormData({
      name: object.name || '',
      description: object.description || '',
      address: object.address || '',
      start_date: object.start_date ? object.start_date.split('T')[0] : '',
      end_date: object.end_date ? object.end_date.split('T')[0] : ''
    });
    setFormErrors({});
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (object) => {
    setSelectedObject(object);
    setDeleteDialogOpen(true);
  };

  const openObjectDetail = (object) => {
    navigate(`/objects/${object.id}`);
  };

  const closeAllDialogs = () => {
    setAddDialogOpen(false);
    setEditDialogOpen(false);
    setDeleteDialogOpen(false);
    setHistoryDialogOpen(false);
    setAddDefectDialogOpen(false);
    setFormData({ name: '', description: '', address: '', start_date: '', end_date: '' });
    setFormErrors({});
    setSelectedObject(null);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const getStatus = (object) => {
    const now = new Date();
    const startDate = object.start_date ? new Date(object.start_date) : null;
    const endDate = object.end_date ? new Date(object.end_date) : null;

    if (!startDate) return { label: 'Не начат', color: 'default' };
    if (now < startDate) return { label: 'Запланирован', color: 'info' };
    if (endDate && now > endDate) return { label: 'Завершен', color: 'success' };
    return { label: 'В работе', color: 'primary' };
  };

  const hasActiveFilters = () => {
    return searchParams.name || searchParams.address || searchParams.start_date || searchParams.end_date || searchParams.status;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Объекты
        </Typography>
        {isManager && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAddDialog}
          >
            Добавить объект
          </Button>
        )}
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
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Поиск по названию..."
                value={searchParams.name}
                onChange={(e) => handleSearchChange('name', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Поиск по адресу..."
                value={searchParams.address}
                onChange={(e) => handleSearchChange('address', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={3}>
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
            <Grid item xs={12} md={3}>
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
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel shrink={true}>Статус</InputLabel>
                  <Select
                    value={searchParams.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    label="Статус"
                    displayEmpty
                  >
                    <MenuItem value="">
                      <em>Все статусы</em>
                    </MenuItem>
                    {statusOptions.filter(option => option.value !== '').map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Дата начала от"
                    type="date"
                    value={searchParams.start_date}
                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Дата окончания до"
                    type="date"
                    value={searchParams.end_date}
                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
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
                <TableCell>Название</TableCell>
                <TableCell>Адрес</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Дата начала</TableCell>
                <TableCell>Дата окончания</TableCell>
                <TableCell align="center">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && objects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : objects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    {hasActiveFilters() ? 'Нет объектов, соответствующих фильтрам' : 'Нет данных об объектах'}
                  </TableCell>
                </TableRow>
              ) : (
                objects.map((object) => {
                  const status = getStatus(object);
                  return (
                    <TableRow key={object.id} hover>
                      <TableCell>
                        <Box 
                          onClick={() => openObjectDetail(object)}
                          sx={{
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                              borderRadius: 1
                            },
                            p: 1,
                            ml: -1,
                            mr: -1
                          }}
                        >
                          <Typography 
                            variant="body1" 
                            color="primary"
                            sx={{
                              fontWeight: 500,
                              whiteSpace: 'normal',
                              wordBreak: 'break-word'
                            }}
                          >
                            {object.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{object.address}</TableCell>
                      <TableCell>
                        <Chip 
                          label={status.label} 
                          color={status.color} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>{formatDate(object.start_date)}</TableCell>
                      <TableCell>{formatDate(object.end_date)}</TableCell>
                      <TableCell align="center">
                        {isManager && (
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'nowrap' }}>
                            <IconButton
                              color="success"
                              onClick={() => openAddDefectDialog(object)}
                              title="Добавить дефект"
                            >
                              <DefectIcon />
                            </IconButton>
                            <IconButton
                              color="warning"
                              onClick={() => openEditDialog(object)}
                              title="Редактировать"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() => openDeleteDialog(object)}
                              title="Удалить"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
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

      <Dialog open={addDialogOpen} onClose={closeAllDialogs} maxWidth="md" fullWidth>
        <DialogTitle>Добавить объект</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название *"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => handleFormChange('name', e.target.value)}
            error={!!formErrors.name}
            helperText={formErrors.name}
            disabled={loading}
            sx={{ mt: 2 }}
          />
          <TextField
            margin="dense"
            label="Описание"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={formData.description}
            onChange={(e) => handleFormChange('description', e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="dense"
            label="Адрес *"
            fullWidth
            variant="outlined"
            value={formData.address}
            onChange={(e) => handleFormChange('address', e.target.value)}
            error={!!formErrors.address}
            helperText={formErrors.address}
            disabled={loading}
          />
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Дата начала"
                type="date"
                fullWidth
                variant="outlined"
                value={formData.start_date}
                onChange={(e) => handleFormChange('start_date', e.target.value)}
                disabled={loading}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Дата окончания"
                type="date"
                fullWidth
                variant="outlined"
                value={formData.end_date}
                onChange={(e) => handleFormChange('end_date', e.target.value)}
                disabled={loading}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAllDialogs} disabled={loading}>
            Отмена
          </Button>
          <Button 
            onClick={handleAddObject} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialogOpen} onClose={closeAllDialogs} maxWidth="md" fullWidth>
        <DialogTitle>Редактировать объект</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название *"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => handleFormChange('name', e.target.value)}
            error={!!formErrors.name}
            helperText={formErrors.name}
            disabled={loading}
            sx={{ mt: 2 }}
          />
          <TextField
            margin="dense"
            label="Описание"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={formData.description}
            onChange={(e) => handleFormChange('description', e.target.value)}
            disabled={loading}
          />
          <TextField
            margin="dense"
            label="Адрес *"
            fullWidth
            variant="outlined"
            value={formData.address}
            onChange={(e) => handleFormChange('address', e.target.value)}
            error={!!formErrors.address}
            helperText={formErrors.address}
            disabled={loading}
          />
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Дата начала"
                type="date"
                fullWidth
                variant="outlined"
                value={formData.start_date}
                onChange={(e) => handleFormChange('start_date', e.target.value)}
                disabled={loading}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Дата окончания"
                type="date"
                fullWidth
                variant="outlined"
                value={formData.end_date}
                onChange={(e) => handleFormChange('end_date', e.target.value)}
                disabled={loading}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAllDialogs} disabled={loading}>
            Отмена
          </Button>
          <Button 
            onClick={handleUpdateObject} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={closeAllDialogs}>
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить объект "{selectedObject?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAllDialogs} variant="contained">
            Отмена
          </Button>
          <Button 
            onClick={handleDeleteObject} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={historyDialogOpen} onClose={closeAllDialogs} maxWidth="lg" fullWidth>
        <DialogTitle>
          История изменений объекта: {selectedObject?.name}
        </DialogTitle>
        <DialogContent>
          {objectHistory.length === 0 ? (
            <Typography>История изменений отсутствует</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Дата изменения</TableCell>
                    <TableCell>Пользователь</TableCell>
                    <TableCell>Изменения</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {objectHistory.map((historyItem) => (
                    <TableRow key={historyItem.id}>
                      <TableCell>
                        {new Date(historyItem.changed_at).toLocaleString('ru-RU')}
                      </TableCell>
                      <TableCell>
                        {historyItem.user?.full_name || 'Неизвестный пользователь'}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {historyItem.changes || 'Изменения не указаны'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAllDialogs} variant="contained">
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addDefectDialogOpen} onClose={closeAddDefectDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Добавить дефект к объекту: {selectedObject?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Объект: {selectedObject?.name} - {selectedObject?.address}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Название дефекта *"
            fullWidth
            variant="outlined"
            value={defectFormData.title}
            onChange={(e) => handleDefectFormChange('title', e.target.value)}
            error={!!defectFormErrors.title}
            helperText={defectFormErrors.title}
            disabled={loading}
          />
          <TextField
            margin="dense"
            label="Описание"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={defectFormData.description}
            onChange={(e) => handleDefectFormChange('description', e.target.value)}
            disabled={loading}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Приоритет</InputLabel>
            <Select
              value={defectFormData.priority_id}
              onChange={(e) => handleDefectFormChange('priority_id', e.target.value)}
              disabled={loading}
              label="Приоритет"
            >
              {defectPriorities.map((priority) => (
                <MenuItem key={priority.id} value={priority.id}>
                  {priority.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Срок выполнения"
            type="date"
            fullWidth
            variant="outlined"
            value={defectFormData.due_date}
            onChange={(e) => handleDefectFormChange('due_date', e.target.value)}
            disabled={loading}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddDefectDialog} disabled={loading}>
            Отмена
          </Button>
          <Button 
            onClick={handleAddDefect} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Создать дефект'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Objects;