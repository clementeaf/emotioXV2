// Script para debuggear el estado de autenticación
console.log('=== DEBUG AUTH ===');

// Verificar localStorage
const localToken = localStorage.getItem('token');
const localUser = localStorage.getItem('user');
const localAuthType = localStorage.getItem('auth_type');

// Verificar sessionStorage
const sessionToken = sessionStorage.getItem('token');
const sessionUser = sessionStorage.getItem('user');
const sessionAuthType = sessionStorage.getItem('auth_type');

console.log('localStorage:', {
  hasToken: !!localToken,
  hasUser: !!localUser,
  authType: localAuthType,
  tokenLength: localToken?.length
});

console.log('sessionStorage:', {
  hasToken: !!sessionToken,
  hasUser: !!sessionUser,
  authType: sessionAuthType,
  tokenLength: sessionToken?.length
});

// Verificar si hay un token válido
const token = localToken || sessionToken;
if (token) {
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      console.log('Token válido:', {
        exp: payload.exp,
        iat: payload.iat,
        sub: payload.sub,
        email: payload.email,
        isExpired: payload.exp ? Date.now() / 1000 > payload.exp : false
      });
    } else {
      console.log('Token inválido: no tiene 3 partes');
    }
  } catch (error) {
    console.log('Error decodificando token:', error);
  }
} else {
  console.log('No hay token disponible');
}

console.log('=== FIN DEBUG AUTH ===');
