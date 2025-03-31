import { AppProps } from 'next/app';
import '../styles/globals.css'; // Asegúrate de que esta ruta sea correcta

function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default App; 