const fetch = require('node-fetch');

async function requestOtp(email) {
  console.log(`Solicitando OTP para el usuario: ${email}`);
  
  try {
    const response = await fetch('https://ucut04rvah.execute-api.us-east-1.amazonaws.com/auth/request-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const statusCode = response.status;
    console.log(`Código de estado: ${statusCode}`);
    
    if (statusCode === 200) {
      console.log('OTP solicitado con éxito. Revise su correo electrónico para el código.');
      return true;
    } else {
      const data = await response.json().catch(() => ({}));
      console.error('Error al solicitar OTP:', data.message || 'Error desconocido');
      return false;
    }
  } catch (error) {
    console.error('Error en la solicitud:', error.message);
    return false;
  }
}

async function main() {
  const email = 'carriagadafalcone@gmail.com';
  await requestOtp(email);
}

main().catch(console.error); 