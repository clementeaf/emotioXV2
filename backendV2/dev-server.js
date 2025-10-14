/**
 * Servidor de Desarrollo para EmotioXV2 Backend
 * Alternativa a serverless-offline para Node.js 24+
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Importar controladores
const { 
  startEyeTracking, 
  stopEyeTracking, 
  generateSaliencyMap, 
  getActiveSessionsStats 
} = require('./dist/index.js');

const { 
  getOgamaStatus, 
  getSupportedDevices, 
  performOgamaAnalysis, 
  generateSaliencyMap: ogamaGenerateSaliencyMap, 
  performMultiDeviceAnalysis 
} = require('./dist/index.js');

// Funciones mock para desarrollo
const mockStartEyeTracking = async (req) => {
  const sessionId = `demo-session-${Date.now()}`;
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify({
      success: true,
      message: 'Sesión de eye tracking iniciada',
      data: {
        sessionId,
        participantId: req.body?.participantId || 'demo-participant',
        status: 'tracking',
        platform: req.body?.config?.platform || 'web'
      }
    })
  };
};

const mockStopEyeTracking = async (req) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify({
      success: true,
      message: 'Sesión de eye tracking detenida',
      data: {
        sessionId: req.body?.sessionId || 'demo-session',
        status: 'stopped',
        analysisGenerated: true
      }
    })
  };
};

const mockGenerateSaliencyMap = async (req) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify({
      success: true,
      message: 'Mapa de saliencia generado',
      data: {
        imageUrl: `https://demo.example.com/saliency-map-${Date.now()}.png`,
        algorithm: req.body?.algorithm || 'itti-koch',
        intensity: Math.random() * 0.5 + 0.3
      }
    })
  };
};

const mockGetActiveSessionsStats = async (req) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify({
      success: true,
      message: 'Estadísticas de sesiones activas',
      data: {
        activeSessions: 0,
        totalSessions: 0,
        averageSessionDuration: 0,
        platform: 'web'
      }
    })
  };
};

const mockGazeData = async (req) => {
  const gazePoints = req.body?.gazePoints || [req.body?.gazePoint].filter(Boolean);
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify({
      success: true,
      message: `Datos de mirada recibidos (${gazePoints.length} puntos)`,
      data: {
        sessionId: req.body?.sessionId || 'demo-session',
        gazePoints: gazePoints,
        pointCount: gazePoints.length,
        timestamp: new Date().toISOString()
      }
    })
  };
};

// Funciones mock para Ogama
const mockOgamaStatus = async (req) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify({
      success: true,
      message: 'Ogama service is operational',
      data: {
        status: 'online',
        version: '5.0.0',
        supportedDevices: ['TheEyeTribe', 'Tobii', 'SMI', 'Eyedid SDK (via data import)', 'Custom']
      }
    })
  };
};

const mockOgamaDevices = async (req) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify({
      success: true,
      message: 'Supported eye tracking devices by Ogama',
      data: ['TheEyeTribe', 'Tobii', 'SMI', 'Eyedid SDK (via data import)', 'Custom']
    })
  };
};

const mockOgamaAnalysis = async (req) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify({
      success: true,
      message: 'Análisis avanzado de eye tracking generado exitosamente con Ogama',
      data: {
        analysisId: `analysis-${Date.now()}`,
        sessionId: req.body?.sessionId || 'demo-session',
        participantId: req.body?.participantId || 'demo-participant',
        startTime: new Date(Date.now() - 60000).toISOString(),
        endTime: new Date().toISOString(),
        metrics: {
          fixationCount: Math.floor(Math.random() * 100) + 20,
          averageFixationDuration: Math.floor(Math.random() * 300) + 200,
          saccadeCount: Math.floor(Math.random() * 200) + 30,
          averageSaccadeLength: Math.floor(Math.random() * 50) + 20,
          totalGazeDuration: Math.floor(Math.random() * 30000) + 10000,
          pupilDilationAverage: {
            left: Math.random() * 2 + 2,
            right: Math.random() * 2 + 2
          },
          blinkRate: Math.random() * 20 + 10,
          engagementScore: Math.random() * 40 + 60
        },
        aoiAnalysis: [],
        saliencyMaps: [],
        qualityMetrics: {
          dataLossRate: Math.random() * 0.1,
          averageAccuracy: Math.random() * 0.1 + 0.9,
          trackingStability: Math.random() * 0.2 + 0.7,
          calibrationQuality: Math.random() * 0.2 + 0.7
        },
        recommendations: ['Optimizar diseño UI/UX', 'Mejorar contraste visual'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    })
  };
};

const mockOgamaSaliency = async (req) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify({
      success: true,
      message: 'Mapa de saliency generado exitosamente con Ogama',
      data: {
        imageUrl: `https://demo.example.com/saliency-map-${Date.now()}.png`,
        algorithm: req.body?.algorithm || 'itti-koch',
        intensityMap: Array.from({ length: 10 }, () => 
          Array.from({ length: 10 }, () => Math.random())
        )
      }
    })
  };
};

const mockOgamaMultiDevice = async (req) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    },
    body: JSON.stringify({
      success: true,
      message: 'Análisis multi-dispositivo realizado exitosamente con Ogama',
      data: {
        sessionIds: req.body?.sessionIds || ['demo-session-1', 'demo-session-2'],
        comparisonType: req.body?.comparisonType || 'group',
        results: {
          'demo-session-1': {
            participantId: 'demo-participant-1',
            deviceType: 'web',
            metrics: {
              fixationCount: Math.floor(Math.random() * 50) + 20,
              averageFixationDuration: Math.floor(Math.random() * 300) + 200,
              gazeRatio: Math.random() * 0.5 + 0.3
            }
          },
          'demo-session-2': {
            participantId: 'demo-participant-2',
            deviceType: 'mobile',
            metrics: {
              fixationCount: Math.floor(Math.random() * 50) + 20,
              averageFixationDuration: Math.floor(Math.random() * 300) + 200,
              gazeRatio: Math.random() * 0.5 + 0.3
            }
          }
        }
      }
    })
  };
};

// Rutas de Eye Tracking
app.post('/dev/eye-tracking/start', async (req, res) => {
  try {
    console.log('[Dev Server] POST /dev/eye-tracking/start');
    const result = await mockStartEyeTracking(req);
    const data = JSON.parse(result.body);
    res.json(data);
  } catch (error) {
    console.error('[Dev Server] Error en /dev/eye-tracking/start:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
});

app.post('/dev/eye-tracking/stop', async (req, res) => {
  try {
    console.log('[Dev Server] POST /dev/eye-tracking/stop');
    const result = await mockStopEyeTracking(req);
    const data = JSON.parse(result.body);
    res.json(data);
  } catch (error) {
    console.error('[Dev Server] Error en /dev/eye-tracking/stop:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
});

app.post('/dev/eye-tracking/saliency', async (req, res) => {
  try {
    console.log('[Dev Server] POST /dev/eye-tracking/saliency');
    const result = await mockGenerateSaliencyMap(req);
    const data = JSON.parse(result.body);
    res.json(data);
  } catch (error) {
    console.error('[Dev Server] Error en /dev/eye-tracking/saliency:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
});

app.get('/dev/eye-tracking/stats', async (req, res) => {
  try {
    console.log('[Dev Server] GET /dev/eye-tracking/stats');
    const result = await mockGetActiveSessionsStats(req);
    const data = JSON.parse(result.body);
    res.json(data);
  } catch (error) {
    console.error('[Dev Server] Error en /dev/eye-tracking/stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
});

app.post('/dev/eye-tracking/gaze-data', async (req, res) => {
  try {
    console.log('[Dev Server] POST /dev/eye-tracking/gaze-data');
    const result = await mockGazeData(req);
    const data = JSON.parse(result.body);
    res.json(data);
  } catch (error) {
    console.error('[Dev Server] Error en /dev/eye-tracking/gaze-data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
});

// Rutas de Ogama
app.get('/dev/ogama/status', async (req, res) => {
  try {
    console.log('[Dev Server] GET /dev/ogama/status');
    const result = await mockOgamaStatus(req);
    const data = JSON.parse(result.body);
    res.json(data);
  } catch (error) {
    console.error('[Dev Server] Error en /dev/ogama/status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
});

app.get('/dev/ogama/devices', async (req, res) => {
  try {
    console.log('[Dev Server] GET /dev/ogama/devices');
    const result = await mockOgamaDevices(req);
    const data = JSON.parse(result.body);
    res.json(data);
  } catch (error) {
    console.error('[Dev Server] Error en /dev/ogama/devices:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
});

app.post('/dev/ogama/analyze', async (req, res) => {
  try {
    console.log('[Dev Server] POST /dev/ogama/analyze');
    const result = await mockOgamaAnalysis(req);
    const data = JSON.parse(result.body);
    res.json(data);
  } catch (error) {
    console.error('[Dev Server] Error en /dev/ogama/analyze:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
});

app.post('/dev/ogama/saliency', async (req, res) => {
  try {
    console.log('[Dev Server] POST /dev/ogama/saliency');
    const result = await mockOgamaSaliency(req);
    const data = JSON.parse(result.body);
    res.json(data);
  } catch (error) {
    console.error('[Dev Server] Error en /dev/ogama/saliency:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
});

app.post('/dev/ogama/multi-device', async (req, res) => {
  try {
    console.log('[Dev Server] POST /dev/ogama/multi-device');
    const result = await mockOgamaMultiDevice(req);
    const data = JSON.parse(result.body);
    res.json(data);
  } catch (error) {
    console.error('[Dev Server] Error en /dev/ogama/multi-device:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor', 
      error: error.message 
    });
  }
});

// Ruta de salud
app.get('/dev/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'EmotioXV2 Backend funcionando', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Ruta raíz
app.get('/dev', (req, res) => {
  res.json({ 
    success: true, 
    message: 'EmotioXV2 Backend API', 
    endpoints: [
      'POST /dev/eye-tracking/start',
      'POST /dev/eye-tracking/stop',
      'POST /dev/eye-tracking/saliency',
      'GET /dev/eye-tracking/stats',
      'GET /dev/ogama/status',
      'GET /dev/ogama/devices',
      'POST /dev/ogama/analyze',
      'POST /dev/ogama/saliency',
      'POST /dev/ogama/multi-device',
      'GET /dev/health'
    ]
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('[Dev Server] Error no manejado:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Error interno del servidor', 
    error: err.message 
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('🚀 EmotioXV2 Backend Dev Server iniciado');
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}/dev`);
  console.log('📋 Endpoints disponibles:');
  console.log('   POST /dev/eye-tracking/start');
  console.log('   POST /dev/eye-tracking/stop');
  console.log('   POST /dev/eye-tracking/saliency');
  console.log('   POST /dev/eye-tracking/gaze-data');
  console.log('   GET /dev/eye-tracking/stats');
  console.log('   GET /dev/ogama/status');
  console.log('   GET /dev/ogama/devices');
  console.log('   POST /dev/ogama/analyze');
  console.log('   POST /dev/ogama/saliency');
  console.log('   POST /dev/ogama/multi-device');
  console.log('   GET /dev/health');
  console.log('✅ Servidor listo para recibir peticiones');
});

module.exports = app;
