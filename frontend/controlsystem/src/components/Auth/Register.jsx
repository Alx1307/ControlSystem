import React, { useState } from 'react';
import {
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { validateRegisterForm } from '../../utils/validation';
import AuthForm from './AuthForm';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateRegisterForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    setServerError('');

    try {
      const response = await authAPI.register(
        formData.full_name,
        formData.email,
        formData.password
      );

      if (response.data.success) {
        navigate('/login', { 
          state: { message: 'Регистрация успешна! Теперь вы можете войти в систему.' }
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setServerError(
        error.response?.data?.message || 
        'Произошла ошибка при регистрации. Попробуйте еще раз.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthForm title="Регистрация">
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverError}
          </Alert>
        )}

        <TextField
          margin="normal"
          required
          fullWidth
          id="full_name"
          label="ФИО"
          name="full_name"
          autoComplete="name"
          autoFocus
          value={formData.full_name}
          onChange={handleChange}
          error={!!errors.full_name}
          helperText={errors.full_name}
          disabled={loading}
        />

        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email"
          name="email"
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          error={!!errors.email}
          helperText={errors.email}
          disabled={loading}
        />

        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Пароль"
          type="password"
          id="password"
          autoComplete="new-password"
          value={formData.password}
          onChange={handleChange}
          error={!!errors.password}
          helperText={errors.password}
          disabled={loading}
        />

        <TextField
          margin="normal"
          required
          fullWidth
          name="confirmPassword"
          label="Подтвердите пароль"
          type="password"
          id="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword}
          disabled={loading}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Зарегистрироваться'}
        </Button>

        <Box textAlign="center">
          <Link to="/login" style={{ textDecoration: 'none' }}>
            Уже есть аккаунт? Войдите
          </Link>
        </Box>
      </Box>
    </AuthForm>
  );
};

export default Register;