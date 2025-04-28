"use client";

import { useEffect, useState } from "react";
import { ProductForm } from "@/components/product-form";
import { Navigation } from "@/components/navigation";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  // Verificar se o usuário está autenticado ao carregar a página
  useEffect(() => {
    // Verificar se o usuário está autenticado via localStorage ou cookie
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

    if (isLoggedIn) {
      console.log("Usuário autenticado via localStorage");

      // Definir cookie isLoggedIn para o middleware (caso não exista)
      document.cookie = "isLoggedIn=true; path=/";

      setIsLoading(false);
    } else {
      console.log("Usuário não autenticado, redirecionando para login");
      window.location.href = "/login";
    }
  }, []);

  // Mostrar um indicador de carregamento enquanto verifica a autenticação
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col items-center mb-4">
        <img
          src="/logo-leia.png"
          alt="Logo Atacado Léia"
          className="h-24 mb-4"
        />
        <h1 className="text-3xl font-bold text-center">
          Ofertas Final de Semana
        </h1>
      </div>
      <Navigation />
      <ProductForm
        formType="regular"
        storageKey="encarteFormData"
        initialProductCount={60}
      />
    </div>
  );
}
