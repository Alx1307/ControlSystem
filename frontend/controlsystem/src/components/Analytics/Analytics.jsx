import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Build as DefectsIcon,
  Business as ObjectsIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { analyticsAPI } from '../../services/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const Analytics = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState(null);
  const [defectsReport, setDefectsReport] = useState([]);
  const [objectsReport, setObjectsReport] = useState([]);
  const [performanceReport, setPerformanceReport] = useState([]);
  
  const [reportFilters, setReportFilters] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date(),
    objectId: '',
    statusId: '',
    priorityId: '',
    assigneeId: ''
  });

  const statusColors = {
    1: '#8884d8',
    2: '#82ca9d',
    3: '#ffc658',
    4: '#ff8042',
    5: '#ff4d4f'
  };

  const priorityColors = {
    1: '#52c41a',
    2: '#faad14',
    3: '#f5222d'
  };

  const statusNames = {
    1: 'Новый',
    2: 'В работе',
    3: 'На проверке',
    4: 'Закрыт',
    5: 'Отменен'
  };

  const priorityNames = {
    1: 'Низкий',
    2: 'Средний',
    3: 'Высокий'
  };

  useEffect(() => {
    loadGeneralStats();
  }, []);

  const loadGeneralStats = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await analyticsAPI.getGeneralStats();
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      setError(error.response?.data?.message || 'Ошибка при загрузке статистики');
    } finally {
      setLoading(false);
    }
  };

  const loadDefectsReport = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: reportFilters.startDate.toISOString().split('T')[0],
        endDate: reportFilters.endDate.toISOString().split('T')[0],
        objectId: reportFilters.objectId || undefined,
        statusId: reportFilters.statusId || undefined,
        priorityId: reportFilters.priorityId || undefined,
        assigneeId: reportFilters.assigneeId || undefined
      };

      const response = await analyticsAPI.getDefectsReport(params);
      if (response.data.success) {
        setDefectsReport(response.data.defects);
      }
    } catch (error) {
      console.error('Error loading defects report:', error);
      setError(error.response?.data?.message || 'Ошибка при загрузке отчета по дефектам');
    } finally {
      setLoading(false);
    }
  };

  const loadObjectsReport = async () => {
    setLoading(true);
    try {
      const response = await analyticsAPI.getObjectsReport();
      if (response.data.success) {
        setObjectsReport(response.data.objects);
      }
    } catch (error) {
      console.error('Error loading objects report:', error);
      setError(error.response?.data?.message || 'Ошибка при загрузке отчета по объектам');
    } finally {
      setLoading(false);
    }
  };

  const loadPerformanceReport = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: reportFilters.startDate.toISOString().split('T')[0],
        endDate: reportFilters.endDate.toISOString().split('T')[0]
      };

      const response = await analyticsAPI.getPerformanceReport(params);
      if (response.data.success) {
        setPerformanceReport(response.data.performance);
      }
    } catch (error) {
      console.error('Error loading performance report:', error);
      setError(error.response?.data?.message || 'Ошибка при загрузке отчета по производительности');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    switch (newValue) {
      case 1:
        loadDefectsReport();
        break;
      case 2:
        loadObjectsReport();
        break;
      case 3:
        loadPerformanceReport();
        break;
      default:
        break;
    }
  };

  const handleFilterChange = (field, value) => {
    setReportFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleExport = async (reportType, format) => {
    try {
      let url, filename;
      const baseParams = {
        startDate: reportFilters.startDate.toISOString().split('T')[0],
        endDate: reportFilters.endDate.toISOString().split('T')[0],
        objectId: reportFilters.objectId || undefined,
        statusId: reportFilters.statusId || undefined,
        priorityId: reportFilters.priorityId || undefined,
        assigneeId: reportFilters.assigneeId || undefined,
        format
      };
  
      const params = new URLSearchParams();
      Object.keys(baseParams).forEach(key => {
        if (baseParams[key]) {
          params.append(key, baseParams[key]);
        }
      });
  
      switch (reportType) {
        case 'defects':
          url = `/analytics/reports/defects?${params}`;
          filename = `defects_report.${format}`;
          break;
        case 'objects':
          url = `/analytics/reports/objects?${params}`;
          filename = `objects_report.${format}`;
          break;
        case 'performance':
          url = `/analytics/reports/performance?${params}`;
          filename = `performance_report.${format}`;
          break;
        default:
          return;
      }
  
      await analyticsAPI.downloadReport(url, filename);
      setSuccess('Отчет успешно скачан');
    } catch (error) {
      console.error('Error exporting report:', error);
      setError('Ошибка при скачивании отчета');
    }
  };

  const handleRefreshReports = () => {
    switch (activeTab) {
      case 1:
        loadDefectsReport();
        break;
      case 2:
        loadObjectsReport();
        break;
      case 3:
        loadPerformanceReport();
        break;
      default:
        loadGeneralStats();
    }
  };

  const formatStatusData = (statusStats) => {
    if (!statusStats) return [];
    return statusStats.map(stat => ({
      name: statusNames[stat.status_id] || `Статус ${stat.status_id}`,
      value: parseInt(stat.count),
      color: statusColors[stat.status_id] || '#8884d8'
    }));
  };

  const formatPriorityData = (priorityStats) => {
    if (!priorityStats) return [];
    return priorityStats.map(stat => ({
      name: priorityNames[stat.priority_id] || `Приоритет ${stat.priority_id}`,
      value: parseInt(stat.count),
      color: priorityColors[stat.priority_id] || '#8884d8'
    }));
  };

  const formatMonthlyData = (monthlyStats) => {
    if (!monthlyStats) return [];
    return monthlyStats.map(stat => ({
      name: new Date(stat.month).toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' }),
      Дефекты: parseInt(stat.count)
    }));
  };

  if (loading && !stats && activeTab === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Аналитика и отчеты
      </Typography>

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

      {activeTab !== 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Дата с
              </Typography>
              <DatePicker
                selected={reportFilters.startDate}
                onChange={(date) => handleFilterChange('startDate', date)}
                selectsStart
                startDate={reportFilters.startDate}
                endDate={reportFilters.endDate}
                dateFormat="dd.MM.yyyy"
                customInput={<TextField size="small" />}
              />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Дата по
              </Typography>
              <DatePicker
                selected={reportFilters.endDate}
                onChange={(date) => handleFilterChange('endDate', date)}
                selectsEnd
                startDate={reportFilters.startDate}
                endDate={reportFilters.endDate}
                minDate={reportFilters.startDate}
                dateFormat="dd.MM.yyyy"
                customInput={<TextField size="small" />}
              />
            </Box>
            <Button
              startIcon={<RefreshIcon />}
              onClick={handleRefreshReports}
              variant="outlined"
              sx={{ alignSelf: 'flex-end' }}
            >
              Обновить отчет
            </Button>
          </Box>

          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Общая статистика" />
            <Tab label="Отчет по дефектам" />
            <Tab label="Отчет по объектам" />
            <Tab label="Производительность" />
          </Tabs>
        </Paper>
      )}

      {activeTab === 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">
              Общая статистика системы
            </Typography>
            <Button
              startIcon={<RefreshIcon />}
              onClick={loadGeneralStats}
              variant="outlined"
            >
              Обновить статистику
            </Button>
          </Box>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Общая статистика" />
            <Tab label="Отчет по дефектам" />
            <Tab label="Отчет по объектам" />
            <Tab label="Производительность" />
          </Tabs>
        </Paper>
      )}

      {activeTab === 0 && stats && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <DefectsIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6"> Дефекты</Typography>
                </Box>
                <Typography variant="h4" color="primary">
                  {stats.totalDefects}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  За все время
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ObjectsIcon color="secondary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Объекты</Typography>
                </Box>
                <Typography variant="h4" color="secondary">
                  {stats.totalObjects}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Всего в системе
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PeopleIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6">Сотрудники</Typography>
                </Box>
                <Typography variant="h4" color="success.main">
                  {stats.totalUsers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Зарегистрировано
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TrendingUpIcon color="info" sx={{ mr: 1 }} />
                  <Typography variant="h6">Активные дефекты</Typography>
                </Box>
                <Typography variant="h4" color="info.main">
                  {stats.activeDefects || stats.statusStats?.find(s => s.status_id === 2)?.count || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Сейчас в работе
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Распределение по статусам
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={formatStatusData(stats.statusStats)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {formatStatusData(stats.statusStats).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Распределение по приоритетам
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={formatPriorityData(stats.priorityStats)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {formatPriorityData(stats.priorityStats).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Динамика дефектов по месяцам
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={formatMonthlyData(stats.monthlyStats)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Дефекты" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {stats.completionStats && stats.completionStats.length > 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Среднее время выполнения дефектов
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {stats.completionStats[0]?.avg_completion_days 
                    ? `Закрытые дефекты выполняются в среднем за ${parseFloat(stats.completionStats[0].avg_completion_days).toFixed(1)} дней`
                    : 'Недостаточно данных для расчета'
                  }
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {activeTab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Отчет по дефектам ({defectsReport.length} записей)
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                startIcon={<DownloadIcon />}
                onClick={() => handleExport('defects', 'excel')}
                variant="outlined"
                size="small"
              >
                Excel
              </Button>
              <Button
                startIcon={<DownloadIcon />}
                onClick={() => handleExport('defects', 'csv')}
                variant="outlined"
                size="small"
              >
                CSV
              </Button>
            </Box>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Название</TableCell>
                  <TableCell>Объект</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell>Приоритет</TableCell>
                  <TableCell>Исполнитель</TableCell>
                  <TableCell>Срок</TableCell>
                  <TableCell>Дата создания</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {defectsReport.map((defect) => (
                  <TableRow key={defect.id}>
                    <TableCell>{defect.id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {defect.title}
                      </Typography>
                    </TableCell>
                    <TableCell>{defect.object?.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={statusNames[defect.status_id]}
                        size="small"
                        color={
                          defect.status_id === 4 ? 'success' :
                          defect.status_id === 5 ? 'error' :
                          defect.status_id === 3 ? 'warning' : 'primary'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={priorityNames[defect.priority_id]}
                        size="small"
                        color={
                          defect.priority_id === 3 ? 'error' :
                          defect.priority_id === 2 ? 'warning' : 'success'
                        }
                      />
                    </TableCell>
                    <TableCell>{defect.assignee?.full_name || 'Не назначен'}</TableCell>
                    <TableCell>
                      {defect.due_date ? new Date(defect.due_date).toLocaleDateString('ru-RU') : 'Не указан'}
                    </TableCell>
                    <TableCell>
                      {defect.created_at ? new Date(defect.created_at).toLocaleDateString('ru-RU') : 'Не указана'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Отчет по объектам ({objectsReport.length} объектов)
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                startIcon={<DownloadIcon />}
                onClick={() => handleExport('objects', 'excel')}
                variant="outlined"
                size="small"
              >
                Excel
              </Button>
              <Button
                startIcon={<DownloadIcon />}
                onClick={() => handleExport('objects', 'csv')}
                variant="outlined"
                size="small"
              >
                CSV
              </Button>
            </Box>
          </Box>

          <Grid container spacing={3}>
            {objectsReport.map((object) => (
              <Grid item xs={12} md={6} key={object.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {object.name}
                    </Typography>
                    <Typography color="text.secondary" gutterBottom>
                      {object.address}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Всего дефектов
                          </Typography>
                          <Typography variant="h6">
                            {object.stats.totalDefects}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Открытые
                          </Typography>
                          <Typography variant="h6" color="warning.main">
                            {object.stats.openDefects}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Закрытые
                          </Typography>
                          <Typography variant="h6" color="success.main">
                            {object.stats.closedDefects}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Завершение
                          </Typography>
                          <Typography variant="h6" color="info.main">
                            {object.stats.completionRate}%
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {activeTab === 3 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Производительность сотрудников
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                startIcon={<DownloadIcon />}
                onClick={() => handleExport('performance', 'excel')}
                variant="outlined"
                size="small"
              >
                Excel
              </Button>
              <Button
                startIcon={<DownloadIcon />}
                onClick={() => handleExport('performance', 'csv')}
                variant="outlined"
                size="small"
              >
                CSV
              </Button>
            </Box>
          </Box>

          <Grid container spacing={3}>
            {performanceReport.map((item, index) => (
              <Grid item xs={12} md={6} lg={4} key={item.user.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {item.user.full_name}
                    </Typography>
                    <Typography color="text.secondary" gutterBottom>
                      {item.user.email}
                    </Typography>
                    
                    <Box sx={{ mt: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Всего задач
                          </Typography>
                          <Typography variant="h6">
                            {item.performance.totalDefects}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Завершено
                          </Typography>
                          <Typography variant="h6" color="success.main">
                            {item.performance.completedDefects}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Эффективность
                          </Typography>
                          <Typography variant="h6" color="info.main">
                            {item.performance.completionRate}%
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Время (дни)
                          </Typography>
                          <Typography variant="h6">
                            {item.performance.avgCompletionTime || 'Н/Д'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Прогресс</Typography>
                        <Typography variant="body2">{item.performance.completionRate}%</Typography>
                      </Box>
                      <Box
                        sx={{
                          width: '100%',
                          height: 8,
                          backgroundColor: 'grey.200',
                          borderRadius: 4,
                          overflow: 'hidden'
                        }}
                      >
                        <Box
                          sx={{
                            width: `${item.performance.completionRate}%`,
                            height: '100%',
                            backgroundColor: 'primary.main',
                            transition: 'width 0.3s'
                          }}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default Analytics;