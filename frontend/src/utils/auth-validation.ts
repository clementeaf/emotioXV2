export const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    return { isValid: false, message: 'El correo electrónico es obligatorio' };
  }
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Ingresa un correo electrónico válido' };
  }
  return { isValid: true, message: null };
};

export const validatePassword = (password: string) => {
  if (!password) {
    return { isValid: false, message: 'La contraseña es obligatoria' };
  }
  if (password.length < 6) {
    return { isValid: false, message: 'La contraseña debe tener al menos 6 caracteres' };
  }
  return { isValid: true, message: null };
};

export const validateName = (name: string) => {
  if (!name.trim()) {
    return { isValid: false, message: 'El nombre es obligatorio' };
  }
  return { isValid: true, message: null };
};

export const validateConfirmPassword = (password: string, confirmPassword: string) => {
  if (!confirmPassword) {
    return { isValid: false, message: 'Confirma tu contraseña' };
  }
  if (password !== confirmPassword) {
    return { isValid: false, message: 'Las contraseñas no coinciden' };
  }
  return { isValid: true, message: null };
};
