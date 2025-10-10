import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  ArrowBack as BackIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { objectsAPI, defectsAPI } from '../../services/api';

const ObjectDetail = () => {
  const { objectId } = useParams();
  const navigate = useNavigate();
  const [object, setObject] = useState(null);
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [defectsLoading, setDefectsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
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

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isManager = user.role === 'Менеджер';

  useEffect(() => {
    if (objectId) {
      loadObjectDetail();
      loadObjectDefects();
    }
  }, [objectId]);

  const loadObjectDetail = async () => {
    setLoading(true);
    try {
      const response = await objectsAPI.getObject(objectId);
      if (response.data.success) {
        setObject(response.data.object);
      } else {
        setError('Объект не найден');
      }
    } catch (error) {
      console.error('Error loading object:', error);
      setError(error.response?.data?.message || 'Ошибка при загрузке данных объекта');
    } finally {
      setLoading(false);
    }
  };

  const loadObjectDefects = async () => {
    setDefectsLoading(true);
    try {
      const response = await objectsAPI.getObjectDefects(objectId);
      if (response.data.success) {
        setDefects(response.data.defects || []);
      }
    } catch (error) {
      console.error('Error loading object defects:', error);
      setDefects([]);
    } finally {
      setDefectsLoading(false);
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
      const response = await objectsAPI.updateObject(objectId, formData);
      if (response.data.success) {
        setSuccess('Объект успешно обновлен');
        setEditDialogOpen(false);
        setFormData({ name: '', description: '', address: '', start_date: '', end_date: '' });
        setFormErrors({});
        loadObjectDetail();
      }
    } catch (error) {
      console.error('Error updating object:', error);
      setError(error.response?.data?.message || 'Ошибка при обновлении объекта');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteObject = async () => {
    if (!object) return;

    setLoading(true);
    try {
      const response = await objectsAPI.deleteObject(objectId);
      if (response.data.success) {
        setDeleteDialogOpen(false);
        navigate('/objects');
      }
    } catch (error) {
      console.error('Error deleting object:', error);
      setError(error.response?.data?.message || 'Ошибка при удалении объекта');
    } finally {
      setLoading(false);
    }
  };

  const loadObjectHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await objectsAPI.getObjectHistory(objectId);
      if (response.data.success) {
        setObjectHistory(response.data.history || []);
      }
    } catch (error) {
      console.error('Error loading object history:', error);
      setError('Ошибка при загрузке истории изменений');
    } finally {
      setHistoryLoading(false);
    }
  };
  
  const openHistoryDialog = async () => {
    setHistoryDialogOpen(true);
    await loadObjectHistory();
  };
  
  const closeHistoryDialog = () => {
    setHistoryDialogOpen(false);
  };

  const openEditDialog = () => {
    if (!object) return;
    
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

  const openDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setFormErrors({});
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
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
    if (!object) return { label: 'Неизвестно', color: 'default' };
    
    const now = new Date();
    const startDate = object.start_date ? new Date(object.start_date) : null;
    const endDate = object.end_date ? new Date(object.end_date) : null;

    if (!startDate) return { label: 'Не начат', color: 'default' };
    if (now < startDate) return { label: 'Запланирован', color: 'info' };
    if (endDate && now > endDate) return { label: 'Завершен', color: 'success' };
    return { label: 'В работе', color: 'primary' };
  };

  const getFieldLabel = (field) => {
    const labels = {
      name: 'Название',
      address: 'Адрес',
      description: 'Описание',
      start_date: 'Дата начала',
      end_date: 'Дата окончания'
    };
    return labels[field] || field;
  };

  const defectPriorities = [
    { id: 1, name: 'Низкий', color: 'success' },
    { id: 2, name: 'Средний', color: 'warning' },
    { id: 3, name: 'Высокий', color: 'error' }
  ];
  
  const formatHistoryValue = (field, value) => {
    if (!value && value !== 0) return 'Не указано';
    
    if (field.includes('date')) {
      return formatDate(value);
    }
    
    return String(value);
  };

  const getDefectStatus = (statusId) => {
    const statuses = {
      1: { label: 'Новый', color: 'default' },
      2: { label: 'В работе', color: 'primary' },
      3: { label: 'На проверке', color: 'info' },
      4: { label: 'Закрыт', color: 'success' },
      5: { label: 'Отменен', color: 'error' }
    };
    return statuses[statusId] || { label: 'Неизвестно', color: 'default' };
  };

  const getDefectPriority = (priorityId) => {
    const priorities = {
      1: { label: 'Низкий', color: 'success' },
      2: { label: 'Средний', color: 'warning' },
      3: { label: 'Высокий', color: 'error' }
    };
    return priorities[priorityId] || { label: 'Неизвестно', color: 'default' };
  };

  const getActionLabel = (action) => {
    const actions = {
      CREATE: 'Создание',
      UPDATE: 'Изменение',
      DELETE: 'Удаление'
    };
    return actions[action] || action;
  };
  
  const getActionColor = (action) => {
    const colors = {
      CREATE: 'success',
      UPDATE: 'primary',
      DELETE: 'error'
    };
    return colors[action] || 'default';
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
        object_id: objectId
      });
      if (response.data.success) {
        setSuccess('Дефект успешно создан');
        setAddDefectDialogOpen(false);
        setDefectFormData({ title: '', description: '', priority_id: '2', due_date: '' });
        setDefectFormErrors({});
        loadObjectDefects();
      }
    } catch (error) {
      console.error('Error adding defect:', error);
      setError(error.response?.data?.message || 'Ошибка при создании дефекта');
    } finally {
      setLoading(false);
    }
  };

  const openAddDefectDialog = () => {
    setDefectFormData({ title: '', description: '', priority_id: '2', due_date: '' });
    setDefectFormErrors({});
    setAddDefectDialogOpen(true);
  };
  
  const closeAddDefectDialog = () => {
    setAddDefectDialogOpen(false);
    setDefectFormErrors({});
  };
  
  const handleDefectFormChange = (field, value) => {
    setDefectFormData(prev => ({ ...prev, [field]: value }));
    if (defectFormErrors[field]) {
      setDefectFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (loading && !object) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!object && !loading) {
    return (
      <Box>
        <Alert severity="error">
          {error || 'Объект не найден'}
        </Alert>
        <Button 
          startIcon={<BackIcon />} 
          onClick={() => navigate('/objects')}
          sx={{ mt: 2 }}
        >
          Назад к списку объектов
        </Button>
      </Box>
    );
  }

  const status = getStatus(object);

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate('/objects')}
          sx={{ cursor: 'pointer' }}
        >
          Объекты
        </Link>
        <Typography color="text.primary">{object?.name}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {object?.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip label={status.label} color={status.color} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/objects')}
          >
            Назад
          </Button>
        </Box>
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

      {object && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Информация
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Название
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {object.name}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Адрес
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {object.address}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Описание
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {object.description || 'Описание отсутствует'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Дата начала
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(object.start_date)}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Дата окончания
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(object.end_date)}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Действия
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      startIcon={<HistoryIcon />}
                      onClick={openHistoryDialog}
                      variant="outlined"
                    >
                      История изменений
                    </Button>
                    {isManager && (
                      <>
                        <Button
                          startIcon={<AddIcon />}
                          onClick={openAddDefectDialog}
                          variant="outlined"
                          color="success"
                        >
                          Добавить дефект
                        </Button>
                        <Button
                          startIcon={<EditIcon />}
                          onClick={openEditDialog}
                          variant="outlined"
                        >
                          Редактировать
                        </Button>
                        <Button
                          startIcon={<DeleteIcon />}
                          onClick={openDeleteDialog}
                          color="error"
                          variant="outlined"
                        >
                          Удалить
                        </Button>
                      </>
                    )}
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Статус
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">Текущий статус:</Typography>
                      <Chip label={status.label} color={status.color} size="small" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">Дата начала:</Typography>
                      <Typography variant="body2">
                        {formatDate(object.start_date)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">Дата окончания:</Typography>
                      <Typography variant="body2">
                        {formatDate(object.end_date)}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Дефекты объекта
                </Typography>
                
                {defectsLoading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" py={3}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      Загрузка дефектов...
                    </Typography>
                  </Box>
                ) : defects.length === 0 ? (
                  <Typography color="text.secondary">
                    Нет зарегистрированных дефектов
                  </Typography>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Название</TableCell>
                          <TableCell>Статус</TableCell>
                          <TableCell>Приоритет</TableCell>
                          <TableCell>Исполнитель</TableCell>
                          <TableCell>Срок</TableCell>
                          <TableCell align="center">Действия</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {defects.map((defect) => {
                          const defectStatus = getDefectStatus(defect.status_id);
                          const defectPriority = getDefectPriority(defect.priority_id);
                          
                          return (
                            <TableRow key={defect.id} hover>
                              <TableCell>{defect.title}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={defectStatus.label} 
                                  color={defectStatus.color} 
                                  size="small" 
                                />
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={defectPriority.label} 
                                  color={defectPriority.color} 
                                  size="small" 
                                />
                              </TableCell>
                              <TableCell>
                                {defect.assignee?.full_name || 'Не назначен'}
                              </TableCell>
                              <TableCell>{formatDate(defect.due_date)}</TableCell>
                              <TableCell align="center">
                              <Button
                                size="small"
                                onClick={() => navigate(`/defects/${defect.id}`, { 
                                    state: { fromObject: true, objectId: objectId } 
                                })}
                                >
                                Подробнее
                              </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Dialog open={editDialogOpen} onClose={closeEditDialog} maxWidth="md" fullWidth>
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
          <Button onClick={closeEditDialog} disabled={loading}>
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

      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog}>
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить объект "{object?.name}"?
            {defects.length > 0 && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                Внимание: с объектом связано {defects.length} дефект(ов). Они также будут удалены.
              </Typography>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} variant="contained">
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

      <Dialog open={historyDialogOpen} onClose={closeHistoryDialog} maxWidth="lg" fullWidth scroll="paper">
        <DialogTitle>
          История изменений объекта: {object?.name}
        </DialogTitle>
        <DialogContent>
          {historyLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={3}>
              <CircularProgress size={24} />
              <Typography variant="body2" sx={{ ml: 2 }}>
                Загрузка истории...
              </Typography>
            </Box>
          ) : objectHistory.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              История изменений отсутствует
            </Typography>
          ) : (
            <Box sx={{ mt: 2 }}>
              {objectHistory.map((historyItem) => (
                <Paper key={historyItem.id} sx={{ p: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {historyItem.user?.full_name || 'Неизвестный пользователь'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(historyItem.changed_at).toLocaleString('ru-RU')}
                      </Typography>
                    </Box>
                    <Chip 
                      label={getActionLabel(historyItem.action)} 
                      color={getActionColor(historyItem.action)} 
                      size="small" 
                    />
                  </Box>
                  
                  {historyItem.action === 'CREATE' ? (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Объект создан со следующими данными:
                      </Typography>
                      {Object.entries(historyItem.changes).map(([field, value]) => (
                        <Box key={field} sx={{ display: 'flex', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ minWidth: 140, fontWeight: 'medium' }}>
                            {getFieldLabel(field)}:
                          </Typography>
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {formatHistoryValue(field, value)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : historyItem.action === 'DELETE' ? (
                    <Box>
                      <Typography variant="body2" color="error" gutterBottom>
                        Объект удален. Данные на момент удаления:
                      </Typography>
                      {Object.entries(historyItem.changes).map(([field, value]) => (
                        <Box key={field} sx={{ display: 'flex', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ minWidth: 140, fontWeight: 'medium' }}>
                            {getFieldLabel(field)}:
                          </Typography>
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {formatHistoryValue(field, value)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Измененные поля:
                      </Typography>
                      {Object.entries(historyItem.changes).map(([field, changes]) => {
                        if (!changes || changes.old === null || changes.new === null) return null;
                        
                        return (
                          <Box key={field} sx={{ mb: 1 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {getFieldLabel(field)}:
                            </Typography>
                            <Box sx={{ display: 'flex', ml: 2, alignItems: 'center' }}>
                              <Typography variant="body2" color="error" sx={{ flex: 1 }}>
                                <s>{formatHistoryValue(field, changes.old)}</s>
                              </Typography>
                              <Typography variant="body2" sx={{ mx: 1 }}>→</Typography>
                              <Typography variant="body2" color="success" sx={{ flex: 1 }}>
                                {formatHistoryValue(field, changes.new)}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeHistoryDialog} variant="contained">
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addDefectDialogOpen} onClose={closeAddDefectDialog} maxWidth="md" fullWidth>
        <DialogTitle>Добавить дефект к объекту: {object?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Объект: {object?.name} - {object?.address}
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

export default ObjectDetail;