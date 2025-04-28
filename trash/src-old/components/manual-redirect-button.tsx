"use client";

import { useState } from "react";

export function ManualRedirectButton() {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleRedirect = () => {
    setIsRedirecting(true);

    // Armazenar informação de login no localStorage
    localStorage.setItem("isLoggedIn", "true");

    // Definir cookie isLoggedIn para o middleware
    document.cookie = "isLoggedIn=true; path=/";

    // Redirecionar manualmente
    window.location.href = "/";
  };

  return (
    <div className="mt-4 p-4 bg-yellow-100 rounded-md text-center">
      <p className="mb-2">
        Se o redirecionamento automático não funcionar, clique no botão abaixo:
      </p>
      <button
        onClick={handleRedirect}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        disabled={isRedirecting}
      >
        {isRedirecting ? "Redirecionando..." : "Ir para a página inicial"}
      </button>
    </div>
  );
}
