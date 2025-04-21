/**
 * Script para depurar problemas de autenticación en EmotioXV2
 * Este script debe ser ejecutado desde la consola del navegador
 */

(function debugAuth() {
  console.log('%c=== DIAGNÓSTICO DE AUTENTICACIÓN EMOTIOX ===', 'background: #000; color: #fff; padding: 5px; font-weight: bold;');

  // Verificar token en localStorage
  const localToken = localStorage.getItem('token');
  console.log('%cToken en localStorage:', 'font-weight: bold; color: #0066ff;', localToken ? `${localToken.substring(0, 15)}... (${localToken.length} caracteres)` : 'NO EXISTE');

  // Verificar token en sessionStorage
  const sessionToken = sessionStorage.getItem('token');
  console.log('%cToken en sessionStorage:', 'font-weight: bold; color: #0066ff;', sessionToken ? `${sessionToken.substring(0, 15)}... (${sessionToken.length} caracteres)` : 'NO EXISTE');

  // Verificar otros elementos de autenticación
  console.log('%cUsuario en localStorage:', 'font-weight: bold; color: #009933;', localStorage.getItem('user') || 'NO EXISTE');
  console.log('%cTipo de almacenamiento:', 'font-weight: bold; color: #009933;', localStorage.getItem('auth_type') || 'NO CONFIGURADO');

  // Verificar tiempo de expiración
  let tokenExpirado = false;
  let tiempoRestante = 'Desconocido';

  if (localToken || sessionToken) {
    const token = localToken || sessionToken;
    try {
      // Decodificar token (simple, sin verificación)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const payload = JSON.parse(jsonPayload);
      console.log('%cPayload del token:', 'font-weight: bold; color: #ff6600;', payload);

      // Verificar expiración
      if (payload.exp) {
        const expDate = new Date(payload.exp * 1000);
        const now = new Date();
        tokenExpirado = now > expDate;
        
        if (tokenExpirado) {
          tiempoRestante = `Expirado hace ${Math.round((now - expDate) / 1000 / 60)} minutos`;
        } else {
          tiempoRestante = `Expira en ${Math.round((expDate - now) / 1000 / 60)} minutos`;
        }

        console.log('%cExpiración del token:', 'font-weight: bold; color: #cc3300;', 
            `${expDate.toLocaleString()} (${tiempoRestante})`);
      } else {
        console.log('%cExpiración del token:', 'font-weight: bold; color: #cc3300;', 'No se encontró información de expiración');
      }
    } catch (error) {
      console.error('Error decodificando el token:', error);
    }
  } else {
    console.log('%cNo se puede verificar expiración:', 'font-weight: bold; color: #cc3300;', 'No hay token disponible');
  }

  // Estado final
  if (!localToken && !sessionToken) {
    console.log('%c✖ NO AUTENTICADO: No se encontró ningún token', 'background: #ffcccc; color: #990000; padding: 3px;');
    console.log('Solución recomendada: Vuelva a iniciar sesión');
  } else if (tokenExpirado) {
    console.log('%c✖ TOKEN EXPIRADO: Debe volver a iniciar sesión', 'background: #ffcccc; color: #990000; padding: 3px;');
    console.log('Solución recomendada: Cerrar sesión y volver a iniciar sesión');
  } else if (localToken || sessionToken) {
    console.log('%c✓ AUTENTICADO: Token válido encontrado', 'background: #ccffcc; color: #006600; padding: 3px;');
    console.log('Si aún tiene problemas, pruebe forzar una recarga: Ctrl+F5 o borrar caché');
  }

  console.log('%c=== FIN DEL DIAGNÓSTICO ===', 'background: #000; color: #fff; padding: 5px; font-weight: bold;');
  
  return {
    limpiarTokens: function() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('auth_type');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('auth_type');
      console.log('%cTokens limpiados. Por favor recargue la página.', 'background: #ff9900; color: #000; padding: 3px;');
    },
    irALogin: function() {
      window.location.href = '/login';
    }
  };
})(); 