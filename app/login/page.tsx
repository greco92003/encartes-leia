import { LoginFormCombined } from "@/components/login-form-combined";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Gerador de Encartes",
  description: "Faça login para acessar o Gerador de Encartes",
};

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
        <LoginFormCombined />
      </div>
    </div>
  );
}
