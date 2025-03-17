import { NextResponse } from 'next/server';

// Endpoint especial que devuelve la investigación de prueba para desarrollo
// SOLO PARA DESARROLLO, NO USAR EN PRODUCCIÓN
export async function GET(request: Request) {
  const url = new URL(request.url);
  
  // Verificación de seguridad - solo permitir en localhost
  if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
    return new NextResponse(
      JSON.stringify({
        error: 'Este endpoint solo está disponible en entorno de desarrollo local'
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
  
  // Crear lista de investigaciones simulada con la investigación de prueba
  const mockResearch = {
    success: true,
    data: [
      {
        id: 'research-test-01',
        name: 'Investigación de prueba',
        status: 'draft',
        createdAt: '2025-03-16T23:00:00.000Z',
        updatedAt: '2025-03-16T23:00:00.000Z',
        progress: 0,
        type: 'eye-tracking',
        technique: 'aim-framework',
        userId: 'testuser',
        currentStage: 'build',
        stageProgress: 0,
        basic: {
          name: 'Investigación de prueba',
          enterprise: 'enterprise1',
          type: 'eye-tracking',
          technique: 'aim-framework'
        }
      }
    ],
    message: "SIMULACIÓN: Datos de investigación para modo desarrollo"
  };
  
  console.log('DEBUG: Devolviendo lista de investigaciones simulada para desarrollo');
  
  // Devolver respuesta simulada
  return new NextResponse(JSON.stringify(mockResearch), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    }
  });
}

// Para manejar requisitos de configuración de Next.js
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; 