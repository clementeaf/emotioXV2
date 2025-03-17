import { NextResponse } from 'next/server';

/**
 * GET - Obtener la configuración del welcome screen
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Obtener el ID de la investigación
    const { id } = params;
    
    // Obtener el token de autorización
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const apiEndpoint = `https://fww0ghfvga.execute-api.us-east-1.amazonaws.com/research/${id}/welcome-screen`;
    
    // Hacer la solicitud al backend de AWS
    const response = await fetch(apiEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    });
    
    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error al obtener welcome screen:', error);
    return NextResponse.json(
      { message: 'Error al obtener la configuración del welcome screen' },
      { status: 500 }
    );
  }
}

/**
 * POST - Guardar la configuración del welcome screen
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Obtener el ID de la investigación
    const { id } = params;
    
    // Obtener el token de autorización
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Obtener el cuerpo de la solicitud
    const body = await request.json();
    
    const apiEndpoint = `https://fww0ghfvga.execute-api.us-east-1.amazonaws.com/research/${id}/welcome-screen`;
    
    // Hacer la solicitud al backend de AWS
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error al guardar welcome screen:', error);
    return NextResponse.json(
      { message: 'Error al guardar la configuración del welcome screen' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS - Manejar solicitudes preflight CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Configuración de Next.js
export const dynamic = 'force-dynamic';
export const runtime = 'edge'; 