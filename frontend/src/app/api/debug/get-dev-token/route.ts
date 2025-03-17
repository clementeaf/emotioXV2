import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// IMPORTANTE: Este endpoint es SOLO para desarrollo
// Genera un token JWT temporal para pruebas

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
  
  try {
    // Crear un token JWT con datos del usuario de prueba
    const testUser = {
      id: 'testuser',
      sub: 'testuser',
      name: 'Usuario Prueba',
      email: 'test@example.com',
      role: 'user'
    };
    
    // La clave secreta debería ser una variable de entorno en producción
    // Pero para desarrollo local, podemos usar una clave fija
    const secret = 'DEV_JWT_SECRET_KEY_DO_NOT_USE_IN_PRODUCTION';
    
    // Generar el token con una expiración de 1 día
    const token = jwt.sign(testUser, secret, { expiresIn: '1d' });
    
    // Información de depuración
    console.log('Token de desarrollo generado para el usuario de prueba');
    
    // Devolver el token como JSON
    return new NextResponse(
      JSON.stringify({
        success: true,
        token,
        user: testUser,
        message: 'Este token es SOLO para desarrollo local. No usar en producción.'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error al generar token de desarrollo:', error);
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: 'Error al generar token de desarrollo',
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

// Configuración de Next.js
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; 