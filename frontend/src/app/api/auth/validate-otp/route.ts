import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Obtener el cuerpo de la solicitud
    const body = await request.json();
    console.log('Validación de OTP recibida para:', body.email, 'Código:', body.code);

    // Reenviar la solicitud al backend de AWS
    const response = await fetch('https://9ezijj6mtg.execute-api.us-east-1.amazonaws.com/auth/validate-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Obtener la respuesta como texto para depuración
    const responseText = await response.text();
    console.log('Respuesta del backend (status):', response.status);
    console.log('Respuesta del backend (texto):', responseText);

    // Si la respuesta no es OK, devolver un error
    if (!response.ok) {
      let errorMessage = 'Error al validar el código OTP';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Si no se puede parsear como JSON, usar el texto como mensaje de error
        errorMessage = responseText || errorMessage;
      }

      return NextResponse.json(
        { message: errorMessage },
        { status: response.status }
      );
    }

    // Si la respuesta es OK pero está vacía, devolver un error
    if (!responseText) {
      return NextResponse.json(
        { message: 'No se recibió respuesta del servidor' },
        { status: 500 }
      );
    }

    // Intentar parsear la respuesta como JSON
    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data, { status: 200 });
    } catch (e) {
      // Si no se puede parsear como JSON, devolver un error
      return NextResponse.json(
        { message: 'Error al procesar la respuesta del servidor' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error en la API route de validate-otp:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Configurar CORS para esta ruta
export const config = {
  api: {
    bodyParser: true,
  },
}; 