import { SignupForm } from "@/components/signup-form";
import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Cadastro | Gerador de Encartes",
  description: "Crie uma conta para acessar o Gerador de Encartes",
};

export default function Page() {
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center p-6 md:p-10">
      <div className="mb-8 flex flex-col items-center">
        <Image
          src="/LOGO.png"
          alt="Logo Atacado Léia"
          width={200}
          height={80}
          priority
          className="mb-4"
        />
      </div>
      <div className="w-full max-w-sm">
        <SignupForm />
      </div>
    </div>
  );
}
