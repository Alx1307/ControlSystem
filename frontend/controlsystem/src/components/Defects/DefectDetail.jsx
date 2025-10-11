import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
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
  MenuItem,
  Tooltip,
  Avatar,
  IconButton,
  Divider,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  History as HistoryIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Engineering as AssignIcon,
  Checklist as UpdateStatusIcon,
  Comment as CommentIcon,
  AttachFile as AttachFileIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  Visibility as PreviewIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { defectsAPI, historyAPI, objectsAPI, usersAPI, commentsAPI, attachmentsAPI  } from '../../services/api';

const DefectDetail = () => {
  const { defectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [defect, setDefect] = useState(null);
  const [objects, setObjects] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
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
  const [selectedEngineer, setSelectedEngineer] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [deleteCommentDialog, setDeleteCommentDialog] = useState({
    open: false,
    commentId: null,
    commentContent: ''
  });
  const [attachments, setAttachments] = useState([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleteAttachmentDialog, setDeleteAttachmentDialog] = useState({
    open: false,
    attachmentId: null,
    fileName: ''
  });

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

  const canComment = () => {
    if (!defect) return false;
    if (isManager) return true;
    if (isEngineer && defect.assignee_id === user.id) return true;
    return false;
  };

  const canUploadAttachment = () => {
    if (!defect) return false;
    if (isManager) return true;
    if (isEngineer && defect.assignee_id === user.id) return true;
    return false;
  };

  const canDeleteAttachment = (attachment) => {
    if (!defect || !attachment) return false;
    if (isManager && attachment.uploaded_by === user.id) return true;
    if (isEngineer && defect.assignee_id === user.id && attachment.uploaded_by === user.id) return true;
    return false;
  };

  const isDefectOverdue = (defect) => {
    if (!defect || !defect.due_date) return false;
    
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

  const canAssignDefect = (defect) => {
    return isManager;
  };

  const canChangeStatus = (defect) => {
    if (isManager) return true;
    if (isEngineer && defect.assignee_id === user.id) return true;
    return false;
  };

  useEffect(() => {
    loadDefect();
    loadObjects();
    loadUsers();
    loadComments();
    loadAttachments();
    if (isManager) {
      loadEngineers();
    }
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

  const loadComments = async () => {
    setCommentsLoading(true);
    try {
      const response = await commentsAPI.getDefectComments(defectId);
      if (response.data.success) {
        setComments(response.data.comments || []);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      setError(error.response?.data?.message || 'Ошибка при загрузке комментариев');
    } finally {
      setCommentsLoading(false);
    }
  };

  const loadAttachments = async () => {
    setAttachmentsLoading(true);
    try {
      const response = await attachmentsAPI.getDefectAttachments(defectId);
      if (response.data.success) {
        setAttachments(response.data.attachments || []);
      }
    } catch (error) {
      console.error('Error loading attachments:', error);
      setError(error.response?.data?.message || 'Ошибка при загрузке вложений');
    } finally {
      setAttachmentsLoading(false);
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

  const handleAssignDefect = async () => {
    if (!defect || !selectedEngineer) return;

    setLoading(true);
    try {
      const response = await defectsAPI.assignDefect(defectId, selectedEngineer);
      if (response.data.success) {
        setSuccess('Инженер успешно назначен');
        setAssignDialogOpen(false);
        setSelectedEngineer('');
        loadDefect();
      }
    } catch (error) {
      console.error('Error assigning defect:', error);
      setError(error.response?.data?.message || 'Ошибка при назначении инженера');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!defect || !selectedStatus) return;

    setLoading(true);
    try {
      const response = await defectsAPI.updateDefectStatus(defectId, selectedStatus);
      if (response.data.success) {
        setSuccess('Статус дефекта успешно обновлен');
        setStatusDialogOpen(false);
        setSelectedStatus('');
        loadDefect();
      }
    } catch (error) {
      console.error('Error updating defect status:', error);
      setError(error.response?.data?.message || 'Ошибка при обновлении статуса');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await commentsAPI.addComment(defectId, {
        content: newComment.trim()
      });
      if (response.data.success) {
        setNewComment('');
        setSuccess('Комментарий успешно добавлен');
        loadComments();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setError(error.response?.data?.message || 'Ошибка при добавлении комментария');
    }
  };

  const handleUpdateComment = async (commentId) => {
    if (!editCommentText.trim()) return;

    try {
      const response = await commentsAPI.updateComment(commentId, {
        content: editCommentText.trim()
      });
      if (response.data.success) {
        setEditingComment(null);
        setEditCommentText('');
        setSuccess('Комментарий успешно обновлен');
        loadComments();
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      setError(error.response?.data?.message || 'Ошибка при обновлении комментария');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await commentsAPI.deleteComment(commentId);
      if (response.data.success) {
        setSuccess('Комментарий успешно удален');
        loadComments();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError(error.response?.data?.message || 'Ошибка при удалении комментария');
    }
  };

  const handleUploadAttachment = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await attachmentsAPI.uploadAttachment(defectId, formData);
      if (response.data.success) {
        setSuccess('Файл успешно загружен');
        setUploadDialogOpen(false);
        setSelectedFile(null);
        loadAttachments();
      }
    } catch (error) {
      console.error('Error uploading attachment:', error);
      setError(error.response?.data?.message || 'Ошибка при загрузке файла');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    try {
      const response = await attachmentsAPI.deleteAttachment(attachmentId);
      if (response.data.success) {
        setSuccess('Файл успешно удален');
        setDeleteAttachmentDialog({ open: false, attachmentId: null, fileName: '' });
        loadAttachments();
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      setError(error.response?.data?.message || 'Ошибка при удалении файла');
    }
  };

  const handleDownloadAttachment = async (attachmentId, fileName) => {
    try {
      const response = await attachmentsAPI.downloadAttachment(attachmentId);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      setError(error.response?.data?.message || 'Ошибка при скачивании файла');
    }
  };

  const handlePreviewAttachment = async (attachmentId) => {
    try {
      const response = await attachmentsAPI.previewAttachment(attachmentId, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: response.data.type });
      const url = window.URL.createObjectURL(blob);
      
      const newWindow = window.open(url, '_blank');
      
      if (newWindow) {
        newWindow.onload = () => {
          window.URL.revokeObjectURL(url);
        };
      } else {
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 1000);
      }
    } catch (error) {
      console.error('Error previewing attachment:', error);
      setError(error.response?.data?.message || 'Ошибка при просмотре файла');
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <AttachFileIcon color="primary" />;
    if (fileType === 'application/pdf') return <AttachFileIcon color="error" />;
    if (fileType.includes('word') || fileType.includes('document')) return <AttachFileIcon color="info" />;
    if (fileType.includes('excel') || fileType.includes('sheet')) return <AttachFileIcon color="success" />;
    return <AttachFileIcon />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const startEditComment = (comment) => {
    setEditingComment(comment.id);
    setEditCommentText(comment.content);
  };

  const cancelEditComment = () => {
    setEditingComment(null);
    setEditCommentText('');
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

  const openAssignDialog = () => {
    if (!defect) return;
    
    setSelectedEngineer(defect.assignee_id || '');
    setAssignDialogOpen(true);
  };

  const openStatusDialog = () => {
    if (!defect) return;
    
    setSelectedStatus(defect.status_id?.toString() || '');
    setStatusDialogOpen(true);
  };

  const openHistoryDialog = async () => {
    await loadDefectHistory();
    setHistoryDialogOpen(true);
  };

  const openUploadDialog = () => {
    setUploadDialogOpen(true);
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

  const closeAssignDialog = () => {
    setAssignDialogOpen(false);
    setSelectedEngineer('');
  };

  const closeStatusDialog = () => {
    setStatusDialogOpen(false);
    setSelectedStatus('');
  };

  const closeUploadDialog = () => {
    setUploadDialogOpen(false);
    setSelectedFile(null);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Не указана';
    return new Date(dateString).toLocaleString('ru-RU');
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
  const isOverdue = isDefectOverdue(defect);
  const overdueDays = getOverdueDays(defect.due_date);

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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="h4" component="h1">
              {defect.title}
            </Typography>
            {isOverdue && (
              <Tooltip title={`Просрочен на ${overdueDays} ${overdueDays === 1 ? 'день' : overdueDays < 5 ? 'дня' : 'дней'}`}>
                <WarningIcon color="error" />
              </Tooltip>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip label={statusInfo.name} color={statusInfo.color} />
            <Chip label={priorityInfo.name} color={priorityInfo.color} />
            {isOverdue && (
              <Chip 
                label={`Просрочен на ${overdueDays} ${overdueDays === 1 ? 'день' : overdueDays < 5 ? 'дня' : 'дней'}`} 
                color="error" 
                variant="outlined"
              />
            )}
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
          <Paper sx={{ p: 3, mb: 3 }}>
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
            </Grid>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachFileIcon />
                Вложения
              </Typography>
              {canUploadAttachment() && (
                <Button
                  startIcon={<AddIcon />}
                  onClick={openUploadDialog}
                  variant="contained"
                  size="small"
                >
                  Добавить файл
                </Button>
              )}
            </Box>

            {attachmentsLoading ? (
              <Box display="flex" justifyContent="center" py={3}>
                <CircularProgress />
              </Box>
            ) : attachments.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={3}>
                Вложений пока нет
              </Typography>
            ) : (
              <List>
                {attachments.map((attachment) => (
                  <ListItem key={attachment.id} divider>
                    <ListItemIcon>
                      {getFileIcon(attachment.file_type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={attachment.file_name}
                      secondary={
                        <Box component="div">
                          <Typography variant="caption" display="block">
                            Загружено: {formatDateTime(attachment.uploaded_at)}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Пользователь: {attachment.uploadedBy?.full_name}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Тип: {attachment.file_type}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {attachment.file_type.startsWith('image/') && (
                          <IconButton
                            size="small"
                            onClick={() => handlePreviewAttachment(attachment.id)}
                            title="Просмотреть"
                          >
                            <PreviewIcon />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => handleDownloadAttachment(attachment.id, attachment.file_name)}
                          title="Скачать"
                        >
                          <DownloadIcon />
                        </IconButton>
                        {canDeleteAttachment(attachment) && (
                          <IconButton
                            size="small"
                            onClick={() => setDeleteAttachmentDialog({ 
                              open: true, 
                              attachmentId: attachment.id, 
                              fileName: attachment.file_name 
                            })}
                            title="Удалить"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
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

                  {canChangeStatus(defect) && (
                    <Button
                      startIcon={<UpdateStatusIcon />}
                      onClick={openStatusDialog}
                      variant="outlined"
                      color="success"
                    >
                      Изменить статус
                    </Button>
                  )}
                  
                  {canAssignDefect(defect) && (
                    <Button
                      startIcon={<AssignIcon />}
                      onClick={openAssignDialog}
                      variant="outlined"
                      color="info"
                    >
                      Назначить инженера
                    </Button>
                  )}

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

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CommentIcon />
              Комментарии
            </Typography>

            {canComment() && (
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Добавить комментарий..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  variant="outlined"
                  sx={{ mb: 1 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                  >
                    Добавить комментарий
                  </Button>
                </Box>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            {commentsLoading ? (
              <Box display="flex" justifyContent="center" py={3}>
                <CircularProgress />
              </Box>
            ) : comments.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={3}>
                Комментариев пока нет
              </Typography>
            ) : (
              <Box sx={{ maxHeight: '600px', overflowY: 'auto' }}>
                {comments.map((comment) => (
                  <Card key={comment.id} sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
                    <CardContent sx={{ pb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                            {comment.user?.full_name?.charAt(0) || 'U'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {comment.user?.full_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDateTime(comment.created_at)}
                            </Typography>
                          </Box>
                        </Box>
                        
                        {comment.user_id === user.id && (
                          <Box>
                            <IconButton
                              size="small"
                              onClick={() => startEditComment(comment)}
                              title="Редактировать"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => setDeleteCommentDialog({ open: true, commentId: comment.id, commentContent: comment.content })}
                              title="Удалить"
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </Box>

                      {editingComment === comment.id ? (
                        <Box>
                          <TextField
                            fullWidth
                            multiline
                            rows={3}
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            variant="outlined"
                            size="small"
                            sx={{ mb: 1 }}
                          />
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button
                              size="small"
                              onClick={cancelEditComment}
                            >
                              Отмена
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleUpdateComment(comment.id)}
                              disabled={!editCommentText.trim()}
                            >
                              Сохранить
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {comment.content}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={uploadDialogOpen} onClose={closeUploadDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Загрузить файл</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Дефект: {defect?.title}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button variant="outlined" component="span" fullWidth>
                Выбрать файл
              </Button>
            </label>
            {selectedFile && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Выбранный файл: {selectedFile.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Размер: {formatFileSize(selectedFile.size)}
                </Typography>
              </Box>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Разрешены: изображения (JPEG, PNG, GIF, WEBP), PDF, документы (DOC, DOCX), таблицы (XLS, XLSX), текстовые файлы. Максимальный размер: 10MB.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeUploadDialog} disabled={uploading}>
            Отмена
          </Button>
          <Button 
            onClick={handleUploadAttachment} 
            variant="contained" 
            disabled={!selectedFile || uploading}
          >
            {uploading ? <CircularProgress size={24} /> : 'Загрузить'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={deleteAttachmentDialog.open} 
        onClose={() => setDeleteAttachmentDialog({ open: false, attachmentId: null, fileName: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить файл "{deleteAttachmentDialog.fileName}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteAttachmentDialog({ open: false, attachmentId: null, fileName: '' })}
            variant="outlined"
          >
            Отмена
          </Button>
          <Button 
            onClick={() => handleDeleteAttachment(deleteAttachmentDialog.attachmentId)} 
            color="error" 
            variant="contained"
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

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

      <Dialog open={assignDialogOpen} onClose={closeAssignDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Назначить инженера</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Дефект: {defect?.title}
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
          <Button onClick={closeAssignDialog} disabled={loading}>
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

      <Dialog open={statusDialogOpen} onClose={closeStatusDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Изменить статус дефекта</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Дефект: {defect?.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Текущий статус: {getStatusInfo(defect?.status_id).name}
          </Typography>
          <FormControl fullWidth margin="dense">
            <InputLabel>Новый статус</InputLabel>
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              disabled={loading}
              label="Новый статус"
            >
              {getAvailableStatuses(defect?.status_id).map((status) => (
                <MenuItem key={status.id} value={status.id}>
                  {status.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeStatusDialog} disabled={loading}>
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

      <Dialog 
        open={deleteCommentDialog.open} 
        onClose={() => setDeleteCommentDialog({ open: false, commentId: null, commentContent: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить этот комментарий?
          </Typography>
          {deleteCommentDialog.commentContent && (
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                mt: 2, 
                backgroundColor: 'grey.50',
                maxHeight: '120px',
                overflow: 'auto'
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {deleteCommentDialog.commentContent.length > 200 
                  ? deleteCommentDialog.commentContent.substring(0, 200) + '...' 
                  : deleteCommentDialog.commentContent
                }
              </Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteCommentDialog({ open: false, commentId: null, commentContent: '' })}
            variant="outlined"
          >
            Отмена
          </Button>
          <Button 
            onClick={() => {
              handleDeleteComment(deleteCommentDialog.commentId);
              setDeleteCommentDialog({ open: false, commentId: null, commentContent: '' });
            }} 
            color="error" 
            variant="contained"
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DefectDetail;