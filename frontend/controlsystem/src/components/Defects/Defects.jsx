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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon,
  Engineering as AssignIcon,
  Checklist as UpdateStatusIcon
} from '@mui/icons-material';
import { defectsAPI, usersAPI, historyAPI, objectsAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const Defects = () => {
  const navigate = useNavigate();

  const [defects, setDefects] = useState([]);
  const [objects, setObjects] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [selectedDefect, setSelectedDefect] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [defectHistory, setDefectHistory] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    object_id: '',
    priority_id: '',
    due_date: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [selectedEngineer, setSelectedEngineer] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

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

  const getAvailableStatuses = (currentStatusId) => {
    if (isManager) {
      return defectStatuses.filter(status => [4, 5].includes(status.id));
    } else if (isEngineer) {
      return defectStatuses.filter(status => [2, 3].includes(status.id));
    }
    return [];
  };

  useEffect(() => {
    loadDefects();
    loadObjects();
    if (isManager) {
      loadEngineers();
    }
  }, []);

  const loadDefects = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await defectsAPI.getAllDefects();
      if (response.data.success) {
        setDefects(response.data.defects || []);
      }
    } catch (error) {
      console.error('Error loading defects:', error);
      setError(error.response?.data?.message || 'Ошибка при загрузке списка дефектов');
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

  const loadEngineers = async () => {
    try {
      const response = await usersAPI.getAllUsers();
      if (response.data.success) {
        const engineers = response.data.users.filter(u => u.role === 'Инженер');
        setEngineers(engineers);
      }
    } catch (error) {
      console.error('Error loading engineers:', error);
    }
  };

  const loadDefectHistory = async (defectId) => {
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

  const handleAddDefect = async () => {
    const errors = {};
    if (!formData.title?.trim()) errors.title = 'Название обязательно';
    if (!formData.object_id) errors.object_id = 'Объект обязателен';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const response = await defectsAPI.addDefect(formData);
      if (response.data.success) {
        setSuccess('Дефект успешно создан');
        setAddDialogOpen(false);
        setFormData({ title: '', description: '', object_id: '', priority_id: '', due_date: '' });
        setFormErrors({});
        loadDefects();
      }
    } catch (error) {
      console.error('Error adding defect:', error);
      setError(error.response?.data?.message || 'Ошибка при создании дефекта');
    } finally {
      setLoading(false);
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
      const response = await defectsAPI.updateDefect(selectedDefect.id, formData);
      if (response.data.success) {
        setSuccess('Дефект успешно обновлен');
        setEditDialogOpen(false);
        setFormData({ title: '', description: '', object_id: '', priority_id: '', due_date: '' });
        setFormErrors({});
        loadDefects();
      }
    } catch (error) {
      console.error('Error updating defect:', error);
      setError(error.response?.data?.message || 'Ошибка при обновлении дефекта');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDefect = async () => {
    if (!selectedDefect) return;

    setLoading(true);
    try {
      const response = await defectsAPI.deleteDefect(selectedDefect.id);
      if (response.data.success) {
        setSuccess('Дефект успешно удален');
        setDeleteDialogOpen(false);
        setSelectedDefect(null);
        loadDefects();
      }
    } catch (error) {
      console.error('Error deleting defect:', error);
      setError(error.response?.data?.message || 'Ошибка при удалении дефекта');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDefect = async () => {
    if (!selectedDefect || !selectedEngineer) return;

    setLoading(true);
    try {
      const response = await defectsAPI.assignDefect(selectedDefect.id, selectedEngineer);
      if (response.data.success) {
        setSuccess('Инженер успешно назначен');
        setAssignDialogOpen(false);
        setSelectedEngineer('');
        loadDefects();
      }
    } catch (error) {
      console.error('Error assigning defect:', error);
      setError(error.response?.data?.message || 'Ошибка при назначении инженера');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedDefect || !selectedStatus) return;

    setLoading(true);
    try {
      const response = await defectsAPI.updateDefectStatus(selectedDefect.id, selectedStatus);
      if (response.data.success) {
        setSuccess('Статус дефекта успешно обновлен');
        setStatusDialogOpen(false);
        setSelectedStatus('');
        loadDefects();
      }
    } catch (error) {
      console.error('Error updating defect status:', error);
      setError(error.response?.data?.message || 'Ошибка при обновлении статуса');
    } finally {
      setLoading(false);
    }
  };

  const openAddDialog = () => {
    setFormData({ title: '', description: '', object_id: '', priority_id: '2', due_date: '' });
    setFormErrors({});
    setAddDialogOpen(true);
  };

  const openEditDialog = (defect) => {
    setSelectedDefect(defect);
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

  const openDeleteDialog = (defect) => {
    setSelectedDefect(defect);
    setDeleteDialogOpen(true);
  };

  const openDefectDetail = (defect) => {
    navigate(`/defects/${defect.id}`);
  };

  const openAssignDialog = (defect) => {
    setSelectedDefect(defect);
    setSelectedEngineer(defect.assignee_id || '');
    setAssignDialogOpen(true);
  };

  const openStatusDialog = (defect) => {
    setSelectedDefect(defect);
    setSelectedStatus(defect.status_id?.toString() || '');
    setStatusDialogOpen(true);
  };

  const closeAllDialogs = () => {
    setAddDialogOpen(false);
    setEditDialogOpen(false);
    setDeleteDialogOpen(false);
    setAssignDialogOpen(false);
    setStatusDialogOpen(false);
    setHistoryDialogOpen(false);
    setFormData({ title: '', description: '', object_id: '', priority_id: '', due_date: '' });
    setFormErrors({});
    setSelectedEngineer('');
    setSelectedStatus('');
    setSelectedDefect(null);
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

  const canEditDefect = (defect) => {
    return isManager;
  };

  const canAssignDefect = (defect) => {
    return isManager;
  };

  const canChangeStatus = (defect) => {
    if (isManager) return true;
    if (isEngineer && defect.assignee_id === user.id) return true;
    return false;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Дефекты
        </Typography>
        {isManager && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAddDialog}
          >
            Добавить дефект
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
                <TableCell>Объект</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Приоритет</TableCell>
                <TableCell>Исполнитель</TableCell>
                <TableCell>Срок</TableCell>
                <TableCell align="center">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && defects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : defects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Нет данных о дефектах
                  </TableCell>
                </TableRow>
              ) : (
                defects.map((defect) => {
                  const statusInfo = getStatusInfo(defect.status_id);
                  const priorityInfo = getPriorityInfo(defect.priority_id);
                  
                  return (
                    <TableRow key={defect.id} hover>
                      <TableCell>
                        <Button
                          onClick={() => openDefectDetail(defect)}
                          sx={{ textTransform: 'none', justifyContent: 'flex-start' }}
                          color="primary"
                        >
                          {defect.title}
                        </Button>
                      </TableCell>
                      <TableCell>{defect.object?.name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={statusInfo.name} 
                          color={statusInfo.color} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={priorityInfo.name} 
                          color={priorityInfo.color} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        {defect.assignee?.full_name || 'Не назначен'}
                      </TableCell>
                      <TableCell>{formatDate(defect.due_date)}</TableCell>
                      <TableCell align="center">
                        {canChangeStatus(defect) && (
                          <IconButton
                            color="secondary"
                            onClick={() => openStatusDialog(defect)}
                            title="Изменить статус"
                          >
                            <UpdateStatusIcon />
                          </IconButton>
                        )}
                        {canAssignDefect(defect) && (
                          <IconButton
                            color="info"
                            onClick={() => openAssignDialog(defect)}
                            title="Назначить инженера"
                          >
                            <AssignIcon />
                          </IconButton>
                        )}
                        {canEditDefect(defect) && (
                          <>
                            <IconButton
                              color="warning"
                              onClick={() => openEditDialog(defect)}
                              title="Редактировать"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() => openDeleteDialog(defect)}
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
        <DialogTitle>Добавить дефект</DialogTitle>
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
          <Button onClick={closeAllDialogs} disabled={loading}>
            Отмена
          </Button>
          <Button 
            onClick={handleAddDefect} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialogOpen} onClose={closeAllDialogs} maxWidth="md" fullWidth>
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
          <Button onClick={closeAllDialogs} disabled={loading}>
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

      <Dialog open={deleteDialogOpen} onClose={closeAllDialogs}>
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить дефект "{selectedDefect?.title}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAllDialogs} variant="contained">
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

      <Dialog open={assignDialogOpen} onClose={closeAllDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>Назначить инженера</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Дефект: {selectedDefect?.title}
          </Typography>
          <FormControl fullWidth margin="dense">
            <InputLabel>Инженер</InputLabel>
            <Select
              value={selectedEngineer}
              onChange={(e) => setSelectedEngineer(e.target.value)}
              disabled={loading}
              label="Инженер"
            >
              <MenuItem value="">Не назначен</MenuItem>
              {engineers.map((engineer) => (
                <MenuItem key={engineer.id} value={engineer.id}>
                  {engineer.full_name} ({engineer.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAllDialogs} disabled={loading}>
            Отмена
          </Button>
          <Button 
            onClick={handleAssignDefect} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Назначить'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={statusDialogOpen} onClose={closeAllDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>Изменить статус дефекта</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Дефект: {selectedDefect?.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Текущий статус: {getStatusInfo(selectedDefect?.status_id).name}
          </Typography>
          <FormControl fullWidth margin="dense">
            <InputLabel>Новый статус</InputLabel>
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              disabled={loading}
              label="Новый статус"
            >
              {getAvailableStatuses(selectedDefect?.status_id).map((status) => (
                <MenuItem key={status.id} value={status.id}>
                  {status.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAllDialogs} disabled={loading}>
            Отмена
          </Button>
          <Button 
            onClick={handleUpdateStatus} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Обновить'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={historyDialogOpen} onClose={closeAllDialogs} maxWidth="lg" fullWidth>
        <DialogTitle>
          История изменений дефекта: {selectedDefect?.title}
        </DialogTitle>
        <DialogContent>
          {defectHistory.length === 0 ? (
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
                  {defectHistory.map((historyItem) => (
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

export default Defects;