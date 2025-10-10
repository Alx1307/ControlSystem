import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Link
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  History as HistoryIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { defectsAPI, historyAPI } from '../../services/api';

const DefectDetail = () => {
  const { defectId } = useParams();
  const navigate = useNavigate();
  const [defect, setDefect] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [defectHistory, setDefectHistory] = useState([]);

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
          <IconButton
            color="info"
            onClick={openHistoryDialog}
            title="История изменений"
          >
            <HistoryIcon />
          </IconButton>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/defects')}
          >
            Назад
          </Button>
        </Box>
      </Box>

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
                        onClick={() => navigate(`/defects/edit/${defect.id}`)}
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

      <Dialog open={historyDialogOpen} onClose={closeHistoryDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          История изменений дефекта: {defect.title}
        </DialogTitle>
        <DialogContent>
          {defectHistory.length === 0 ? (
            <Typography>История изменений отсутствует</Typography>
          ) : (
            <Box sx={{ mt: 2 }}>
              {defectHistory.map((historyItem) => (
                <Paper key={historyItem.id} sx={{ p: 2, mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="subtitle2">
                        {historyItem.user?.full_name || 'Неизвестный пользователь'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(historyItem.changed_at).toLocaleString('ru-RU')}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {historyItem.changes || 'Изменения не указаны'}
                  </Typography>
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