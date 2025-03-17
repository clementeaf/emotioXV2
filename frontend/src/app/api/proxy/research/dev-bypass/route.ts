import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Endpoint especial que simula crear una investigación para desarrollo
// SOLO PARA DESARROLLO, NO USAR EN PRODUCCIÓN
export async function POST(request: Request) {
  console.log('DEV-BYPASS: Simulando creación de investigación (modo desarrollo)');
  
  try {
    // Obtener datos de la petición
    const requestData = await request.json();
    console.log('DEV-BYPASS: Datos recibidos:', requestData);
    
    // Generar un ID único para la investigación simulada
    const mockId = `dev-${uuidv4()}`;
    
    // Crear respuesta simulada
    const mockResponse = {
      success: true,
      data: {
        id: mockId,
        name: requestData.name || 'Investigación simulada',
        enterprise: requestData.enterprise || 'Empresa de prueba',
        type: requestData.type || 'eye-tracking',
        technique: requestData.technique || 'aim-framework',
        status: 'draft',
        createdAt: new Date().toISOString(),
        message: "SIMULACIÓN: Esta investigación fue creada en modo bypass para desarrollo"
      }
    };
    
    console.log('DEV-BYPASS: Respuesta simulada generada:', mockResponse);
    
    // Devolver respuesta simulada
    return new NextResponse(JSON.stringify(mockResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
    
  } catch (error) {
    console.error('DEV-BYPASS: Error al procesar simulación:', error);
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: 'Error al procesar la simulación',
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Para manejar requisitos de configuración de Next.js
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; 