// Este arquivo serve apenas como redirecionamento para o diretório app/src/app
// O Vercel usará o script vercel-build definido no package.json

// Importar a página inicial do diretório app/src/app
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirecionar para a página inicial real
    router.replace('/');
  }, [router]);
  
  return (
    <div>
      <h1>Redirecionando...</h1>
    </div>
  );
}
