"use client";

import { LoginFormCombined } from "@/components/login-form-combined";
import { Suspense } from "react";

// Metadata precisa ser definida em um arquivo separado ou em um layout.tsx
// quando usamos "use client" diretamente na página

// Componente de fallback para o Suspense
function LoginFormFallback() {
  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center justify-center p-6">
        <p>Carregando formulário de login...</p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center p-6 md:p-10">
      <div className="mb-8 flex flex-col items-center">
        <img
          src="/logo-leia.png"
          alt="Logo Atacado Léia"
          className="h-24 mb-4"
        />
      </div>
      <div className="w-full max-w-sm">
        <Suspense fallback={<LoginFormFallback />}>
          <LoginFormCombined />
        </Suspense>
      </div>
    </div>
  );
}
