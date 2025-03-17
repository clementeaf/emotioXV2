import { NextResponse } from 'next/server';

// Definir localmente los valores por defecto para evitar problemas de importación
const DEFAULT_WELCOME_SCREEN_CONFIG = {
  isEnabled: true,
  title: '',
  message: '',
  startButtonText: 'Start Research',
  metadata: {
    version: '1.0.0'
  }
};

/**
 * Endpoint para simular operaciones con el Welcome Screen en modo desarrollo
 * SOLO PARA DESARROLLO, NO USAR EN PRODUCCIÓN
 */

/**
 * GET - Obtener la configuración del welcome screen
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const url = new URL(request.url);
  
  // Verificación de seguridad - solo permitir en localhost
  if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
    return NextResponse.json(
      { error: 'Este endpoint solo está disponible en entorno de desarrollo local' },
      { status: 403 }
    );
  }
  
  const { id } = params;
  
  console.log(`DEBUG: Obteniendo configuración del welcome screen para la investigación ${id}`);
  
  // Simular respuesta de la API con configuración predeterminada
  return NextResponse.json({
    success: true,
    data: {
      id: `welcome-screen-${id}`,
      researchId: id,
      ...DEFAULT_WELCOME_SCREEN_CONFIG,
      title: 'Welcome to our Research',
      message: 'Thank you for participating in our study. This research will help us understand how users interact with our interface.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }, { status: 200 });
}

/**
 * POST - Guardar la configuración del welcome screen
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const url = new URL(request.url);
  
  // Verificación de seguridad - solo permitir en localhost
  if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
    return NextResponse.json(
      { error: 'Este endpoint solo está disponible en entorno de desarrollo local' },
      { status: 403 }
    );
  }
  
  const { id } = params;
  
  try {
    // Obtener el cuerpo de la solicitud
    const body = await request.json();
    
    console.log(`DEBUG: Guardando configuración del welcome screen para la investigación ${id}:`, body);
    
    // Simular respuesta exitosa
    return NextResponse.json({
      success: true,
      data: {
        id: `welcome-screen-${id}`,
        researchId: id,
        ...DEFAULT_WELCOME_SCREEN_CONFIG,
        ...body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      message: 'Welcome screen saved successfully (SIMULATION)'
    }, { status: 200 });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { success: false, message: 'Error processing request' },
      { status: 500 }
    );
  }
}

// Para manejar requisitos de configuración de Next.js
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; 