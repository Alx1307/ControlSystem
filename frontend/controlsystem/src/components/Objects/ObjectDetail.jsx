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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  ArrowBack as BackIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Delete as DeleteIcon
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
          <IconButton
            color="info"
            onClick={() => navigate(`/objects/${objectId}/history`)}
            title="История изменений"
          >
            <HistoryIcon />
          </IconButton>
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
                      onClick={() => navigate(`/objects/${objectId}/history`)}
                      variant="outlined"
                    >
                      История изменений
                    </Button>
                    {isManager && (
                      <>
                        <Button
                          startIcon={<EditIcon />}
                          onClick={() => navigate(`/objects/${objectId}/edit`)}
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
                                  onClick={() => navigate(`/defects/${defect.id}`)}
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
    </Box>
  );
};

export default ObjectDetail;