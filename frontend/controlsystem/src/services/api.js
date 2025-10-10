import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const usersAPI = {
  login: (email, password) => 
    api.post('/login', { email, password }),

  register: (full_name, email, password) => 
    api.patch('/register', { full_name, email, password }),

  getUser: (userId) => 
    api.get(`/users/${userId}`),

  getAllUsers: () => 
    api.get('/users'),

  addUser: (email, role) => 
    api.post('/users/add', { email, role }),

  updateUser: (userId, data) => 
    api.patch(`/users/${userId}`, data),

  deleteUser: (userId) => 
    api.delete(`/users/${userId}`),

  getEngineers: () => 
    api.get('/engineers'),

  searchUsers: (params) =>
    api.get('/search', { params }),
};

export const objectsAPI = {
    getAllObjects: (params = {}) => 
        api.get('/objects/all', { params }),

    getObject: (objectId) => 
        api.get(`/objects/get/${objectId}`),

    addObject: (data) => 
        api.post('/objects/add', data),

    updateObject: (objectId, data) => 
        api.patch(`/objects/${objectId}`, data),

    deleteObject: (objectId) => 
        api.delete(`/objects/${objectId}`),

    searchObjects: (params) => 
        api.get('/objects/search', { params }),

    getObjectDefects: (objectId) =>
        api.get(`/objects/defects/${objectId}`),

    getObjectHistory: (objectId, page = 1, limit = 10) => 
        api.get(`/history/object/${objectId}?page=${page}&limit=${limit}`),
};

export const historyAPI = {
    getObjectHistory: (objectId, params = {}) => 
        api.get(`/history/object/${objectId}`, { params }),

    getDefectHistory: (defectId, params = {}) =>
        api.get(`/history/defect/${defectId}`, { params })
};

export const defectsAPI = {
    getAllDefects: (params = {}) => 
      api.get('/defects/all', { params }),
  
    getDefect: (defectId) => 
      api.get(`/defects/get/${defectId}`),
  
    addDefect: (data) => 
      api.post('/defects/add', data),
  
    updateDefect: (defectId, data) => 
      api.patch(`/defects/${defectId}`, data),
  
    deleteDefect: (defectId) => 
      api.delete(`/defects/${defectId}`),
  
    assignDefect: (defectId, assigneeId) => 
      api.patch(`/defects/assign/${defectId}`, { assignee_id: assigneeId }),
  
    updateDefectStatus: (defectId, statusId) => 
      api.patch(`/defects/update_status/${defectId}`, { status_id: statusId }),
  
    searchDefects: (params) => 
      api.get('/defects/search', { params }),
};

export default api;