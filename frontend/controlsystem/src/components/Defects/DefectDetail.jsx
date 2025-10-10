import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  History as HistoryIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { defectsAPI, historyAPI, objectsAPI, usersAPI  } from '../../services/api';

const DefectDetail = () => {
  const { defectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [defect, setDefect] = useState(null);
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [defectHistory, setDefectHistory] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    object_id: '',
    priority_id: '',
    due_date: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isManager = user.role === 'Менеджер';
  const isEngineer = user.role === 'Инженер';

  const defectStatuses = [
    { id: 1, name: 'Новый', color: 'default' },
    { id: 2, name: 'В работе', color: 'primary' },
    { id: 3, name: 'На проверке', color: 'info' },
    { id: 4, name: 'Закрыт', color: 'success' },
    { id: 5, name: 'Отменен', color: 'error' }
  ];

  const defectPriorities = [
    { id: 1, name: 'Низкий', color: 'success' },
    { id: 2, name: 'Средний', color: 'warning' },
    { id: 3, name: 'Высокий', color: 'error' }
  ];

  useEffect(() => {
    loadDefect();
    loadObjects();
    loadUsers();
  }, [defectId]);

  const loadDefect = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await defectsAPI.getDefect(defectId);
      if (response.data.success) {
        setDefect(response.data.defect);
      }
    } catch (error) {
      console.error('Error loading defect:', error);
      setError(error.response?.data?.message || 'Ошибка при загрузке дефекта');
    } finally {
      setLoading(false);
    }
  };

  const loadObjects = async () => {
    try {
      const response = await objectsAPI.getAllObjects();
      if (response.data.success) {
        setObjects(response.data.objects || []);
      }
    } catch (error) {
      console.error('Error loading objects:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await usersAPI.getAllUsers();
      if (response.data.success) {
        setUsers(response.data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadDefectHistory = async () => {
    try {
      const response = await historyAPI.getDefectHistory(defectId);
      if (response.data.success) {
        setDefectHistory(response.data.history || []);
      }
    } catch (error) {
      console.error('Error loading defect history:', error);
      setError('Ошибка при загрузке истории дефекта');
    }
  };

  const handleUpdateDefect = async () => {
    const errors = {};
    if (!formData.title?.trim()) errors.title = 'Название обязательно';
    if (!formData.object_id) errors.object_id = 'Объект обязателен';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const response = await defectsAPI.updateDefect(defectId, formData);
      if (response.data.success) {
        setSuccess('Дефект успешно обновлен');
        setEditDialogOpen(false);
        setFormData({ title: '', description: '', object_id: '', priority_id: '', due_date: '' });
        setFormErrors({});
        loadDefect();
      }
    } catch (error) {
      console.error('Error updating defect:', error);
      setError(error.response?.data?.message || 'Ошибка при обновлении дефекта');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDefect = async () => {
    if (!defect) return;

    setLoading(true);
    try {
      const response = await defectsAPI.deleteDefect(defectId);
      if (response.data.success) {
        setDeleteDialogOpen(false);
        navigate('/defects');
      }
    } catch (error) {
      console.error('Error deleting defect:', error);
      setError(error.response?.data?.message || 'Ошибка при удалении дефекта');
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = () => {
    if (!defect) return;
    
    setFormData({
      title: defect.title || '',
      description: defect.description || '',
      object_id: defect.object_id || '',
      priority_id: defect.priority_id?.toString() || '2',
      due_date: defect.due_date ? defect.due_date.split('T')[0] : ''
    });
    setFormErrors({});
    setEditDialogOpen(true);
  };

  const openHistoryDialog = async () => {
    await loadDefectHistory();
    setHistoryDialogOpen(true);
  };

  const closeHistoryDialog = () => {
    setHistoryDialogOpen(false);
  };

  const openDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setFormErrors({});
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

  const getStatusInfo = (statusId) => {
    return defectStatuses.find(s => s.id === statusId) || { name: 'Неизвестно', color: 'default' };
  };

  const getPriorityInfo = (priorityId) => {
    return defectPriorities.find(p => p.id === priorityId) || { name: 'Неизвестно', color: 'default' };
  };

  const getFieldLabel = (field) => {
    const labels = {
      title: 'Название',
      description: 'Описание',
      object_id: 'Объект',
      priority_id: 'Приоритет',
      status_id: 'Статус',
      assignee_id: 'Исполнитель',
      due_date: 'Срок выполнения',
      reporter_id: 'Создатель'
    };
    return labels[field] || field;
  };
  
  const formatHistoryValue = (field, value, historyItem = null, isOld = false) => {
    if (!value && value !== 0) return 'Не указано';
    
    if (field.includes('date')) {
      return formatDate(value);
    }
    
    if (field === 'status_id') {
      const status = getStatusInfo(parseInt(value));
      return status.name;
    }
    
    if (field === 'priority_id') {
      const priority = getPriorityInfo(parseInt(value));
      return priority.name;
    }
    
    if (field === 'object_id') {
      const object = objects.find(obj => obj.id === parseInt(value));
      return object ? object.name : `Объект ID: ${value}`;
    }
    
    if (field === 'assignee_id' || field === 'reporter_id') {
      if (!value) return 'Не назначен';
      
      const user = users.find(u => u.id === parseInt(value));
      if (user) {
        return `${user.full_name} (${user.email})`;
      }
      
      if (historyItem && historyItem.user && historyItem.user.id === parseInt(value)) {
        return `${historyItem.user.full_name} (${historyItem.user.email})`;
      }
      
      return `Пользователь ID: ${value}`;
    }
    
    return String(value);
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

  if (loading && !defect) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/defects')}>
          Назад к списку дефектов
        </Button>
      </Box>
    );
  }

  if (!defect) {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Дефект не найден
        </Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/defects')}>
          Назад к списку дефектов
        </Button>
      </Box>
    );
  }

  const statusInfo = getStatusInfo(defect.status_id);
  const priorityInfo = getPriorityInfo(defect.priority_id);

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate('/defects')}
          sx={{ cursor: 'pointer' }}
        >
          Дефекты
        </Link>
        <Typography color="text.primary">{defect.title}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {defect.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip label={statusInfo.name} color={statusInfo.color} />
            <Chip label={priorityInfo.name} color={priorityInfo.color} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => {
            if (location.state?.fromObject && location.state?.objectId) {
              navigate(`/objects/${location.state.objectId}`);
            } else {
              navigate('/defects');
            }
          }}
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

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Информация
            </Typography>
            <Typography variant="body1" paragraph>
              {defect.description || 'Описание отсутствует'}
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Объект
                </Typography>
                <Typography variant="body1">
                  {defect.object?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {defect.object?.address}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Создатель
                </Typography>
                <Typography variant="body1">
                  {defect.reporter?.full_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {defect.reporter?.email}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Исполнитель
                </Typography>
                <Typography variant="body1">
                  {defect.assignee?.full_name || 'Не назначен'}
                </Typography>
                {defect.assignee?.email && (
                  <Typography variant="body2" color="text.secondary">
                    {defect.assignee.email}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Срок выполнения
                </Typography>
                <Typography variant="body1">
                  {formatDate(defect.due_date)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Дата создания
                </Typography>
                <Typography variant="body1">
                  {new Date(defect.createdAt).toLocaleDateString('ru-RU')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Последнее обновление
                </Typography>
                <Typography variant="body1">
                  {new Date(defect.updatedAt).toLocaleDateString('ru-RU')}
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Статус:</Typography>
                    <Box sx={{ width: 8 }} />
                    <Chip label={statusInfo.name} color={statusInfo.color} size="small" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Приоритет:</Typography>
                    <Box sx={{ width: 8 }} />
                    <Chip label={priorityInfo.name} color={priorityInfo.color} size="small" />
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Dialog open={editDialogOpen} onClose={closeEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>Редактировать дефект</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название *"
            fullWidth
            variant="outlined"
            value={formData.title}
            onChange={(e) => handleFormChange('title', e.target.value)}
            error={!!formErrors.title}
            helperText={formErrors.title}
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
          <FormControl fullWidth margin="dense" error={!!formErrors.object_id}>
            <InputLabel>Объект *</InputLabel>
            <Select
              value={formData.object_id}
              onChange={(e) => handleFormChange('object_id', e.target.value)}
              disabled={loading}
              label="Объект *"
            >
              {objects.map((object) => (
                <MenuItem key={object.id} value={object.id}>
                  {object.name} - {object.address}
                </MenuItem>
              ))}
            </Select>
            {formErrors.object_id && (
              <Typography variant="caption" color="error">
                {formErrors.object_id}
              </Typography>
            )}
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Приоритет</InputLabel>
            <Select
              value={formData.priority_id}
              onChange={(e) => handleFormChange('priority_id', e.target.value)}
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
            value={formData.due_date}
            onChange={(e) => handleFormChange('due_date', e.target.value)}
            disabled={loading}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditDialog} disabled={loading}>
            Отмена
          </Button>
          <Button 
            onClick={handleUpdateDefect} 
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
            Вы уверены, что хотите удалить дефект "{defect?.title}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} variant="contained">
            Отмена
          </Button>
          <Button 
            onClick={handleDeleteDefect} 
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
          История изменений дефекта: {defect.title}
        </DialogTitle>
        <DialogContent>
          {defectHistory.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              История изменений отсутствует
            </Typography>
          ) : (
            <Box sx={{ mt: 2 }}>
              {defectHistory.map((historyItem) => (
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
                        Дефект создан со следующими данными:
                      </Typography>
                      {Object.entries(historyItem.changes).map(([field, value]) => (
                        <Box key={field} sx={{ display: 'flex', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ minWidth: 140, fontWeight: 'medium' }}>
                            {getFieldLabel(field)}:
                          </Typography>
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {formatHistoryValue(field, value, historyItem)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : historyItem.action === 'DELETE' ? (
                    <Box>
                      <Typography variant="body2" color="error" gutterBottom>
                        Дефект удален. Данные на момент удаления:
                      </Typography>
                      {Object.entries(historyItem.changes).map(([field, value]) => (
                        <Box key={field} sx={{ display: 'flex', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ minWidth: 140, fontWeight: 'medium' }}>
                            {getFieldLabel(field)}:
                          </Typography>
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {formatHistoryValue(field, value, historyItem)}
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
                        if (!changes || changes.old === undefined || changes.new === undefined) return null;
                        
                        if (changes.old === changes.new) return null;
                        
                        return (
                          <Box key={field} sx={{ mb: 1 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {getFieldLabel(field)}:
                            </Typography>
                            <Box sx={{ display: 'flex', ml: 2, alignItems: 'center' }}>
                              <Typography variant="body2" color="error" sx={{ flex: 1 }}>
                                <s>{formatHistoryValue(field, changes.old, historyItem, true)}</s>
                              </Typography>
                              <Typography variant="body2" sx={{ mx: 1 }}>→</Typography>
                              <Typography variant="body2" color="success" sx={{ flex: 1 }}>
                                {formatHistoryValue(field, changes.new, historyItem)}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      }).filter(Boolean)}
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
    </Box>
  );
};

export default DefectDetail;