// Script completo para prueba automatizada de emotioXV2
// 1. Inicia sesión, 2. Obtiene el token, 3. Crea una nueva investigación, 4. Crea un welcomeScreen,
// 5. Crea un eyeTracking, 6. Crea un smartVOC, 7. Crea un thankYouScreen
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Función para crear un welcomeScreen para una investigación
async function createWelcomeScreen(token, researchId) {
  console.log('Creando welcomeScreen para la investigación:', researchId);
  
  // Datos para el welcomeScreen
  const welcomeScreenData = {
    title: "Bienvenido a la Investigación",
    message: "Gracias por participar en este estudio. Sus respuestas son muy importantes para nosotros.",
    startButtonText: "Comenzar Experimento",
    isEnabled: true,
    researchId: researchId
  };
  
  // URL del endpoint para crear welcomeScreen
  const welcomeScreenUrl = 'https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev/welcome-screens';
  
  console.log('Enviando solicitud de creación de welcomeScreen...');
  console.log('Datos:', JSON.stringify(welcomeScreenData, null, 2));
  
  try {
    // Realizar la solicitud para crear welcomeScreen
    const welcomeScreenResponse = await fetch(welcomeScreenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(welcomeScreenData)
    });
    
    const welcomeScreenResponseText = await welcomeScreenResponse.text();
    
    try {
      // Intentar parsear la respuesta como JSON
      const welcomeScreenResponseData = JSON.parse(welcomeScreenResponseText);
      console.log('Respuesta de creación de welcomeScreen:', welcomeScreenResponseData);
      
      if (welcomeScreenResponseData.data && welcomeScreenResponseData.data.id) {
        console.log('¡WelcomeScreen creado exitosamente!');
        console.log('ID del welcomeScreen:', welcomeScreenResponseData.data.id);
        return welcomeScreenResponseData.data.id;
      } else {
        console.log('Respuesta recibida pero sin ID identificable para el welcomeScreen:', welcomeScreenResponseData);
        return null;
      }
    } catch (e) {
      // Si no es JSON, mostrar el texto plano
      console.log('Respuesta del welcomeScreen (texto plano):', welcomeScreenResponseText);
      return null;
    }
  } catch (error) {
    console.error('Error al crear welcomeScreen:', error);
    return null;
  }
}

// Función para crear un EyeTracking para una investigación
async function createEyeTracking(token, researchId) {
  console.log('Creando EyeTracking para la investigación:', researchId);
  
  // Datos para el EyeTracking
  const eyeTrackingData = {
    researchId: researchId,
    enabled: true,
    trackingDevice: "webcam",
    calibration: true,
    validation: true,
    recording: {
      audio: true,
      video: true
    },
    visualization: {
      showGaze: true,
      showFixations: true,
      showSaccades: false,
      showHeatmap: true
    },
    parameters: {
      samplingRate: 60,
      fixationThreshold: 100,
      saccadeVelocityThreshold: 30
    }
  };
  
  // URL del endpoint para crear EyeTracking
  // Utilizamos la ruta correcta de la API
  const eyeTrackingUrl = 'https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev/eye-tracking';
  
  console.log('Enviando solicitud de creación de EyeTracking...');
  console.log('Datos:', JSON.stringify(eyeTrackingData, null, 2));
  
  try {
    // Realizar la solicitud para crear EyeTracking
    const eyeTrackingResponse = await fetch(eyeTrackingUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(eyeTrackingData)
    });
    
    const eyeTrackingResponseText = await eyeTrackingResponse.text();
    
    try {
      // Intentar parsear la respuesta como JSON
      const eyeTrackingResponseData = JSON.parse(eyeTrackingResponseText);
      console.log('Respuesta de creación de EyeTracking:', eyeTrackingResponseData);
      
      if (eyeTrackingResponseData.data && eyeTrackingResponseData.data.id) {
        console.log('¡EyeTracking creado exitosamente!');
        console.log('ID del EyeTracking:', eyeTrackingResponseData.data.id);
        return eyeTrackingResponseData.data.id;
      } else {
        console.log('Respuesta recibida pero sin ID identificable para el EyeTracking:', eyeTrackingResponseData);
        return null;
      }
    } catch (e) {
      // Si no es JSON, mostrar el texto plano
      console.log('Respuesta del EyeTracking (texto plano):', eyeTrackingResponseText);
      return null;
    }
  } catch (error) {
    console.error('Error al crear EyeTracking:', error);
    return null;
  }
}

// Función para crear un SmartVOC para una investigación
async function createSmartVOC(token, researchId) {
  console.log('Creando SmartVOC para la investigación:', researchId);
  
  // Datos para el SmartVOC según la estructura esperada por el backend
  const smartVOCData = {
    researchId: researchId,
    questions: [
      {
        id: "q1",
        type: "CSAT",
        title: "Satisfacción del cliente",
        description: "¿Cómo calificaría su experiencia general?",
        required: true,
        showConditionally: false,
        config: {
          type: "rating",
          minLabel: "Muy insatisfecho",
          maxLabel: "Muy satisfecho",
          minValue: 1,
          maxValue: 5
        }
      },
      {
        id: "q2",
        type: "VOC",
        title: "Aspectos positivos",
        description: "¿Qué aspectos le gustaron más?",
        required: false,
        showConditionally: false,
        config: {
          type: "text"
        }
      },
      {
        id: "q3",
        type: "VOC",
        title: "Aspectos negativos",
        description: "¿Qué aspectos le gustaron menos?",
        required: false,
        showConditionally: false,
        config: {
          type: "text"
        }
      }
    ],
    randomizeQuestions: false,
    smartVocRequired: true
  };
  
  // URL del endpoint para crear SmartVOC
  // Utilizamos la ruta correcta de la API
  const smartVOCUrl = 'https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev/smart-voc';
  
  console.log('Enviando solicitud de creación de SmartVOC...');
  console.log('Datos:', JSON.stringify(smartVOCData, null, 2));
  
  try {
    // Realizar la solicitud para crear SmartVOC
    const smartVOCResponse = await fetch(smartVOCUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(smartVOCData)
    });
    
    const smartVOCResponseText = await smartVOCResponse.text();
    
    try {
      // Intentar parsear la respuesta como JSON
      const smartVOCResponseData = JSON.parse(smartVOCResponseText);
      console.log('Respuesta de creación de SmartVOC:', smartVOCResponseData);
      
      if (smartVOCResponseData.data && smartVOCResponseData.data.id) {
        console.log('¡SmartVOC creado exitosamente!');
        console.log('ID del SmartVOC:', smartVOCResponseData.data.id);
        return smartVOCResponseData.data.id;
      } else if (smartVOCResponseData.id) {
        console.log('¡SmartVOC creado exitosamente!');
        console.log('ID del SmartVOC:', smartVOCResponseData.id);
        return smartVOCResponseData.id;
      } else {
        console.log('Respuesta recibida pero sin ID identificable para el SmartVOC:', smartVOCResponseData);
        return null;
      }
    } catch (e) {
      // Si no es JSON, mostrar el texto plano
      console.log('Respuesta del SmartVOC (texto plano):', smartVOCResponseText);
      return null;
    }
  } catch (error) {
    console.error('Error al crear SmartVOC:', error);
    return null;
  }
}

// Función para crear un ThankYouScreen para una investigación
async function createThankYouScreen(token, researchId) {
  console.log('Creando ThankYouScreen para la investigación:', researchId);
  
  // Datos para el ThankYouScreen
  const thankYouScreenData = {
    title: "¡Gracias por su participación!",
    message: "Su contribución es muy valiosa para nuestra investigación. Hemos registrado todas sus respuestas correctamente.",
    redirectUrl: "https://www.example.com",
    isEnabled: true,
    researchId: researchId
  };
  
  // URL del endpoint para crear ThankYouScreen
  const thankYouScreenUrl = 'https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev/thank-you-screen';
  
  console.log('Enviando solicitud de creación de ThankYouScreen...');
  console.log('Datos:', JSON.stringify(thankYouScreenData, null, 2));
  
  try {
    // Realizar la solicitud para crear ThankYouScreen
    const thankYouScreenResponse = await fetch(thankYouScreenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(thankYouScreenData)
    });
    
    const thankYouScreenResponseText = await thankYouScreenResponse.text();
    
    try {
      // Intentar parsear la respuesta como JSON
      const thankYouScreenResponseData = JSON.parse(thankYouScreenResponseText);
      console.log('Respuesta de creación de ThankYouScreen:', thankYouScreenResponseData);
      
      if (thankYouScreenResponseData.data && thankYouScreenResponseData.data.id) {
        console.log('¡ThankYouScreen creado exitosamente!');
        console.log('ID del ThankYouScreen:', thankYouScreenResponseData.data.id);
        return thankYouScreenResponseData.data.id;
      } else {
        console.log('Respuesta recibida pero sin ID identificable para el ThankYouScreen:', thankYouScreenResponseData);
        return null;
      }
    } catch (e) {
      // Si no es JSON, mostrar el texto plano
      console.log('Respuesta del ThankYouScreen (texto plano):', thankYouScreenResponseText);
      return null;
    }
  } catch (error) {
    console.error('Error al crear ThankYouScreen:', error);
    return null;
  }
}

async function main() {
  console.log('Iniciando prueba completa...');
  
  // Paso 1: Iniciar sesión con credenciales
  const email = 'clemente@gmail.com';
  const password = 'clemente';
  
  console.log(`Intentando iniciar sesión con: ${email}`);
  
  // URL del endpoint de login
  const loginUrl = 'https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev/auth/login';
  
  try {
    // Realizar la solicitud de login
    const loginResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const loginData = await loginResponse.json();
    
    // Mostrar la respuesta completa para análisis
    console.log('Respuesta completa del login:', JSON.stringify(loginData, null, 2));
    console.log('Status del login:', loginResponse.status);
    
    if (!loginResponse.ok) {
      throw new Error(`Error de login: ${loginData.error || loginResponse.statusText}`);
    }
    
    console.log('¡Login exitoso!');
    
    // Analizar la estructura para encontrar el token
    console.log('Propiedades de primer nivel en la respuesta:', Object.keys(loginData));
    
    let token = null;
    
    // Intentar varias ubicaciones comunes del token
    if (loginData.token) {
      token = loginData.token;
      console.log('Token encontrado en loginData.token');
    } else if (loginData.data && loginData.data.token) {
      token = loginData.data.token;
      console.log('Token encontrado en loginData.data.token');
    } else if (loginData.accessToken) {
      token = loginData.accessToken;
      console.log('Token encontrado en loginData.accessToken');
    } else if (loginData.data && loginData.data.accessToken) {
      token = loginData.data.accessToken;
      console.log('Token encontrado en loginData.data.accessToken');
    } else if (loginData.access_token) {
      token = loginData.access_token;
      console.log('Token encontrado en loginData.access_token');
    } else if (loginData.data && loginData.data.access_token) {
      token = loginData.data.access_token;
      console.log('Token encontrado en loginData.data.access_token');
    } else if (loginData.auth && loginData.auth.token) {
      token = loginData.auth.token;
      console.log('Token encontrado en loginData.auth.token');
    }
    
    // Si no se encuentra en las ubicaciones comunes, buscar en profundidad
    if (!token) {
      function findTokenInObject(obj, path = '') {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          if (typeof value === 'string' && (key.includes('token') || key.includes('Token'))) {
            console.log(`Posible token encontrado en: ${currentPath}`);
            return value;
          } else if (typeof value === 'object' && value !== null) {
            const result = findTokenInObject(value, currentPath);
            if (result) return result;
          }
        }
        return null;
      }
      
      token = findTokenInObject(loginData);
    }
    
    if (!token) {
      throw new Error('No se pudo extraer el token de la respuesta de login');
    }
    
    console.log('Token obtenido con éxito');
    
    // Paso 3: Crear una nueva investigación
    // Datos para la nueva investigación
    const researchData = {
      name: 'Test Investigation ' + new Date().toISOString(),
      enterprise: 'Test Enterprise',
      type: 'behavioural',
      technique: 'aim-framework',
      description: 'This is a test investigation created via API',
      targetParticipants: 100,
      objectives: ['Test objective'],
      tags: ['test', 'api']
    };
    
    // URL del endpoint para crear investigación
    const researchUrl = 'https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev/research';
    
    console.log('Enviando solicitud de creación de investigación...');
    console.log('Datos:', JSON.stringify(researchData, null, 2));
    
    // Realizar la solicitud para crear investigación
    const researchResponse = await fetch(researchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(researchData)
    });
    
    const researchResponseText = await researchResponse.text();
    
    try {
      // Intentar parsear la respuesta como JSON
      const researchResponseData = JSON.parse(researchResponseText);
      console.log('Respuesta de creación de investigación:', researchResponseData);
      
      let researchId = null;
      
      if (researchResponseData.data && researchResponseData.data.id) {
        console.log('¡Investigación creada exitosamente!');
        console.log('ID de la investigación:', researchResponseData.data.id);
        researchId = researchResponseData.data.id;
      } else if (researchResponseData.id) {
        console.log('¡Investigación creada exitosamente!');
        console.log('ID de la investigación:', researchResponseData.id);
        researchId = researchResponseData.id;
      } else {
        console.log('Respuesta recibida pero sin ID identificable:', researchResponseData);
      }
      
      // Paso 4-7: Crear componentes adicionales si se obtuvo un ID de investigación
      if (researchId) {
        // Paso 4: Crear welcomeScreen
        const welcomeScreenId = await createWelcomeScreen(token, researchId);
        
        // Paso 5: Crear EyeTracking
        const eyeTrackingId = await createEyeTracking(token, researchId);
        
        // Paso 6: Crear SmartVOC
        const smartVOCId = await createSmartVOC(token, researchId);
        
        // Paso 7: Crear ThankYouScreen
        const thankYouScreenId = await createThankYouScreen(token, researchId);
        
        // Mostrar resumen de recursos creados
        console.log('\nResumen de recursos creados:');
        console.log(`Investigación: ${researchId}`);
        console.log(`Welcome Screen: ${welcomeScreenId || 'No creado'}`);
        console.log(`Eye Tracking: ${eyeTrackingId || 'No creado'}`);
        console.log(`Smart VOC: ${smartVOCId || 'No creado'}`);
        console.log(`Thank You Screen: ${thankYouScreenId || 'No creado'}`);
        
        console.log('\nPara acceder a la investigación, visite:');
        console.log(`http://localhost:4700/dashboard?research=${researchId}`);
      }
      
    } catch (e) {
      // Si no es JSON, mostrar el texto plano
      console.log('Respuesta (texto plano):', researchResponseText);
    }
    
  } catch (error) {
    console.error('Error en el proceso:', error);
  }
}

// Ejecutar la prueba
main(); 