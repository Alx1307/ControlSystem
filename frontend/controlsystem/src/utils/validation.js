export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  export const validatePassword = (password) => {
    return password.length >= 6;
  };
  
  export const validateFullName = (fullName) => {
    return fullName.trim().length >= 2;
  };
  
  export const validateRegisterForm = (formData) => {
    const errors = {};
  
    if (!validateFullName(formData.full_name)) {
      errors.full_name = 'ФИО должно содержать минимум 2 символа';
    }
  
    if (!validateEmail(formData.email)) {
      errors.email = 'Введите корректный email';
    }
  
    if (!validatePassword(formData.password)) {
      errors.password = 'Пароль должен содержать минимум 6 символов';
    }
  
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Пароли не совпадают';
    }
  
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
  
  export const validateLoginForm = (formData) => {
    const errors = {};
  
    if (!formData.email) {
      errors.email = 'Email обязателен';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Введите корректный email';
    }
  
    if (!formData.password) {
      errors.password = 'Пароль обязателен';
    }
  
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };