const WebSocket = require('ws');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM0Y2U2MjFjLTU1NjYtNDk3ZS04MjU1LTU4ZDYzZGNkYzVjYyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsIm5hbWUiOiJVcGRhdGVkIFRlc3QgVXNlciIsImlhdCI6MTc0MTcwMDY0NywiZXhwIjoxNzQxNzg3MDQ3fQ.zcuyDenUlplrYkj3j-vj-i3U2PL08Mg9kpwz_SJiIEU';
const wsUrl = `wss://99ci9zzrei.execute-api.us-east-1.amazonaws.com/dev?token=${token}`;

const ws = new WebSocket(wsUrl);

// Contador para llevar el registro de las pruebas completadas
let testsCompleted = 0;
const totalTests = 2;

const closeAfterTests = () => {
  testsCompleted++;
  if (testsCompleted === totalTests) {
    console.log('Todas las pruebas completadas');
    ws.close();
  }
};

ws.on('open', () => {
  console.log('Conectado al WebSocket');
  
  // Test 1: Enviar mensaje PING
  const pingMessage = {
    event: 'PING',
    data: {}
  };
  
  ws.send(JSON.stringify(pingMessage));
  console.log('Mensaje PING enviado');

  // Test 2: Solicitar renovación de token
  const refreshMessage = {
    event: 'TOKEN_REFRESH',
    data: { token }
  };

  setTimeout(() => {
    ws.send(JSON.stringify(refreshMessage));
    console.log('Solicitud de renovación de token enviada');
  }, 1000);
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  console.log('Mensaje recibido:', message);

  switch (message.event) {
    case 'PONG':
      console.log('Test PING-PONG completado');
      closeAfterTests();
      break;
    case 'TOKEN_REFRESHED':
      console.log('Test de renovación de token completado');
      console.log('Nuevo token:', message.data.token);
      closeAfterTests();
      break;
    case 'ERROR':
      console.error('Error recibido:', message.data.message);
      closeAfterTests();
      break;
  }
});

ws.on('close', () => {
  console.log('Conexión cerrada');
  process.exit(0);
});

ws.on('error', (error) => {
  console.error('Error en el WebSocket:', error);
  process.exit(1);
}); 