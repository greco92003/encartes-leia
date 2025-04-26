// Este arquivo serve como página inicial para o Vercel
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para a página inicial real no diretório app
    window.location.href = "/app";
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        flexDirection: "column",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Carregando Gerador de Encartes...</h1>
      <p>Você será redirecionado em instantes.</p>
    </div>
  );
}
