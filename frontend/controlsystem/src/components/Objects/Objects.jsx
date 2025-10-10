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
  Card,
  CardContent,
  Grid,
  Chip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon,
  Visibility as ViewIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { objectsAPI, historyAPI } from '../../services/api';

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

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isManager = user.role === 'Менеджер';

  useEffect(() => {
    loadObjects();
  }, []);

  const loadObjects = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await objectsAPI.getAllObjects();
      if (response.data.success) {
        setObjects(response.data.objects || []);
      }
    } catch (error) {
      console.error('Error loading objects:', error);
      setError(error.response?.data?.message || 'Ошибка при загрузке списка объектов');
    } finally {
      setLoading(false);
    }
  };

  const loadObjectHistory = async (objectId) => {
    try {
      const response = await historyAPI.getObjectHistory(objectId);
      if (response.data.success) {
        setObjectHistory(response.data.history || []);
      }
    } catch (error) {
      console.error('Error loading object history:', error);
      setError('Ошибка при загрузке истории объекта');
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

  const openHistoryDialog = async (object) => {
    setSelectedObject(object);
    await loadObjectHistory(object.id);
    setHistoryDialogOpen(true);
  };

  const closeAllDialogs = () => {
    setAddDialogOpen(false);
    setEditDialogOpen(false);
    setDeleteDialogOpen(false);
    setHistoryDialogOpen(false);
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
                    Нет данных об объектах
                  </TableCell>
                </TableRow>
              ) : (
                objects.map((object) => {
                  const status = getStatus(object);
                  return (
                    <TableRow key={object.id} hover>
                      <TableCell>
                        <Button
                          onClick={() => openObjectDetail(object)}
                          sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
                          color="primary"
                        >
                          {object.name}
                        </Button>
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
                        <IconButton
                          color="info"
                          onClick={() => openHistoryDialog(object)}
                          title="История изменений"
                        >
                          <HistoryIcon />
                        </IconButton>
                        {isManager && (
                          <>
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
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
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
    </Box>
  );
};

export default Objects;