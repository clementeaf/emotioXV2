import { NextResponse } from 'next/server';

// Endpoint especial que devuelve una investigación específica para desarrollo
// SOLO PARA DESARROLLO, NO USAR EN PRODUCCIÓN
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const url = new URL(request.url);
  const { id } = params;
  
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
  
  // Si el ID coincide con nuestro ID de prueba, devolver la investigación de prueba
  if (id === 'research-test-01') {
    // Crear investigación simulada
    const mockResearch = {
      success: true,
      data: {
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
      },
      message: "SIMULACIÓN: Datos de investigación específica para modo desarrollo"
    };
    
    console.log(`DEBUG: Devolviendo investigación simulada con ID ${id} para desarrollo`);
    
    // Devolver respuesta simulada
    return new NextResponse(JSON.stringify(mockResearch), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      }
    });
  } else {
    // Si el ID no coincide, devolver error 404
    console.log(`DEBUG: No se encontró investigación con ID ${id} en modo desarrollo`);
    
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: `No se encontró investigación con ID ${id}`,
      }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

// Para manejar requisitos de configuración de Next.js
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; 