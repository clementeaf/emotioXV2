import Image from 'next/image';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">EmotioX - Versión de prueba</h1>
      <p className="text-xl mb-4">
        Esta es una versión simplificada para probar el despliegue en Amplify
      </p>
      <div className="flex flex-col gap-4 mt-8">
        <a href="/login" className="text-blue-500 hover:underline">
          Iniciar sesión
        </a>
        <a href="/register" className="text-blue-500 hover:underline">
          Registrarse
        </a>
      </div>
    </main>
  );
}
