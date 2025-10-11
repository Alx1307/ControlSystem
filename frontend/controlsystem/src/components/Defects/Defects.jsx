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
  Chip,
  Tooltip,
  Card,
  CardContent,
  Grid,
  InputAdornment,
  TablePagination
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon,
  Engineering as AssignIcon,
  Checklist as UpdateStatusIcon,
  Warning as WarningIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon
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
  const [searchParams, setSearchParams] = useState({
    title: '',
    description: '',
    object_id: '',
    status_id: '',
    priority_id: '',
    assignee_id: '',
    sortBy: 'title',
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

  const sortOptions = [
    { value: 'title:ASC', label: 'Название (А-Я)' },
    { value: 'title:DESC', label: 'Название (Я-А)' },
    { value: 'due_date:ASC', label: 'Срок (сначала ближайшие)' },
    { value: 'due_date:DESC', label: 'Срок (сначала поздние)' },
    { value: 'priority_id:DESC', label: 'Приоритет (высокий → низкий)' },
    { value: 'priority_id:ASC', label: 'Приоритет (низкий → высокий)' }
  ];

  const isDefectOverdue = (defect) => {
    if (!defect.due_date) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDate = new Date(defect.due_date);
    dueDate.setHours(0, 0, 0, 0);
    
    const completedStatuses = [4, 5];
    
    return dueDate < today && !completedStatuses.includes(defect.status_id);
  };

  const getOverdueDays = (dueDate) => {
    if (!dueDate) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

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
  }, [searchParams, pagination.page, pagination.limit]);

  const loadDefects = async () => {
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

      const response = await defectsAPI.searchDefects(params);
      if (response.data.success) {
        setDefects(response.data.defects || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || response.data.defects?.length || 0,
          totalPages: response.data.pagination?.totalPages || 1
        }));
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
      title: '',
      description: '',
      object_id: '',
      status_id: '',
      priority_id: '',
      assignee_id: '',
      sortBy: 'title',
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

  const hasActiveFilters = () => {
    return searchParams.title || searchParams.description || searchParams.object_id || searchParams.status_id || searchParams.priority_id || searchParams.assignee_id;
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

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Поиск по названию..."
                value={searchParams.title}
                onChange={(e) => handleSearchChange('title', e.target.value)}
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
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel shrink={true}>Статус</InputLabel>
                    <Select
                      value={searchParams.status_id || ''}
                      onChange={(e) => handleFilterChange('status_id', e.target.value)}
                      label="Статус"
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>Все статусы</em>
                      </MenuItem>
                      {defectStatuses.map(status => (
                        <MenuItem key={status.id} value={status.id}>
                          {status.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel shrink={true}>Приоритет</InputLabel>
                    <Select
                      value={searchParams.priority_id || ''}
                      onChange={(e) => handleFilterChange('priority_id', e.target.value)}
                      label="Приоритет"
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>Все приоритеты</em>
                      </MenuItem>
                      {defectPriorities.map(priority => (
                        <MenuItem key={priority.id} value={priority.id}>
                          {priority.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel shrink={true}>Объект</InputLabel>
                    <Select
                      value={searchParams.object_id || ''}
                      onChange={(e) => handleFilterChange('object_id', e.target.value)}
                      label="Объект"
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>Все объекты</em>
                      </MenuItem>
                      {objects.map(object => (
                        <MenuItem key={object.id} value={object.id}>
                          {object.name} - {object.address}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {isManager && (
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel shrink={true}>Исполнитель</InputLabel>
                      <Select
                        value={searchParams.assignee_id || ''}
                        onChange={(e) => handleFilterChange('assignee_id', e.target.value)}
                        label="Исполнитель"
                        displayEmpty
                      >
                        <MenuItem value="">
                          <em>Все исполнители</em>
                        </MenuItem>
                        <MenuItem value="unassigned">Не назначен</MenuItem>
                        {engineers.map(engineer => (
                          <MenuItem key={engineer.id} value={engineer.id}>
                            {engineer.full_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                <Grid item xs={12}>
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
          <Table sx={{ minWidth: 60 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: '22%', minWidth: 150 }}>Название</TableCell>
                <TableCell sx={{ width: '18%', minWidth: 140 }}>Объект</TableCell>
                <TableCell sx={{ width: '10%', minWidth: 100 }}>Статус</TableCell>
                <TableCell sx={{ width: '10%', minWidth: 100 }}>Приоритет</TableCell>
                <TableCell sx={{ width: '15%', minWidth: 130 }}>Исполнитель</TableCell>
                <TableCell sx={{ width: '10%', minWidth: 100 }}>Срок</TableCell>
                <TableCell sx={{ width: '15%', minWidth: 140 }} align="center">Действия</TableCell>
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
                    {hasActiveFilters() ? 'Нет дефектов, соответствующих фильтрам' : 'Нет данных о дефектах'}
                  </TableCell>
                </TableRow>
              ) : (
                defects.map((defect) => {
                  const statusInfo = getStatusInfo(defect.status_id);
                  const priorityInfo = getPriorityInfo(defect.priority_id);
                  const isOverdue = isDefectOverdue(defect);
                  const overdueDays = getOverdueDays(defect.due_date);
                  
                  return (
                    <TableRow 
                      key={defect.id} 
                      hover
                      sx={{
                        backgroundColor: isOverdue ? 'rgba(255, 0, 0, 0.04)' : 'inherit',
                        '&:hover': {
                          backgroundColor: isOverdue ? 'rgba(255, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                        }
                      }}
                    >
                      <TableCell sx={{ width: '22%', minWidth: 180, py: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Button
                            onClick={() => openDefectDetail(defect)}
                            sx={{ 
                              textTransform: 'none', 
                              justifyContent: 'flex-start',
                              textAlign: 'left',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              flex: 1,
                              maxWidth: 'calc(100% - 28px)',
                              minWidth: 0,
                              fontSize: '0.8125rem',
                              py: 0.5,
                              px: 1
                            }}
                            color="primary"
                          >
                            {defect.title}
                          </Button>
                          {isOverdue && (
                            <Tooltip title={`Просрочен на ${overdueDays} ${overdueDays === 1 ? 'день' : overdueDays < 5 ? 'дня' : 'дней'}`}>
                              <WarningIcon color="error" fontSize="small" sx={{ flexShrink: 0 }} />
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ width: '18%', minWidth: 140, py: 1 }}>
                        <Typography 
                          sx={{ 
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontSize: '0.8125rem'
                          }}
                        >
                          {defect.object?.name}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ width: '10%', minWidth: 100, py: 1 }}>
                        <Chip 
                          label={statusInfo.name} 
                          color={statusInfo.color} 
                          size="small" 
                          sx={{ fontSize: '0.75rem' }}
                        />
                      </TableCell>
                      <TableCell sx={{ width: '10%', minWidth: 100, py: 1 }}>
                        <Chip 
                          label={priorityInfo.name} 
                          color={priorityInfo.color} 
                          size="small" 
                          sx={{ fontSize: '0.75rem' }}
                        />
                      </TableCell>
                      <TableCell sx={{ width: '15%', minWidth: 130, py: 1 }}>
                        <Typography 
                          sx={{ 
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontSize: '0.8125rem'
                          }}
                        >
                          {defect.assignee?.full_name || 'Не назначен'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ width: '10%', minWidth: 100, py: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography 
                            sx={{ 
                              color: isOverdue ? 'error.main' : 'inherit',
                              fontWeight: isOverdue ? 'bold' : 'normal',
                              whiteSpace: 'nowrap',
                              fontSize: '0.8125rem'
                            }}
                          >
                            {formatDate(defect.due_date)}
                          </Typography>
                          {isOverdue && (
                            <Chip 
                              label={`+${overdueDays}`} 
                              color="error" 
                              size="small" 
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ width: '15%', minWidth: 140, py: 1 }} align="center">
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'center', 
                          gap: 0.25,
                          flexWrap: 'nowrap'
                        }}>
                          {canChangeStatus(defect) && (
                            <IconButton
                              color="success"
                              onClick={() => openStatusDialog(defect)}
                              title="Изменить статус"
                              size="small"
                              sx={{ minWidth: 32, width: 32, height: 32 }}
                            >
                              <UpdateStatusIcon fontSize="small" />
                            </IconButton>
                          )}
                          {canAssignDefect(defect) && (
                            <IconButton
                              color="info"
                              onClick={() => openAssignDialog(defect)}
                              title="Назначить инженера"
                              size="small"
                              sx={{ minWidth: 32, width: 32, height: 32 }}
                            >
                              <AssignIcon fontSize="small" />
                            </IconButton>
                          )}
                          {canEditDefect(defect) && (
                            <>
                              <IconButton
                                color="warning"
                                onClick={() => openEditDialog(defect)}
                                title="Редактировать"
                                size="small"
                                sx={{ minWidth: 32, width: 32, height: 32 }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                color="error"
                                onClick={() => openDeleteDialog(defect)}
                                title="Удалить"
                                size="small"
                                sx={{ minWidth: 32, width: 32, height: 32 }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </>
                          )}
                        </Box>
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