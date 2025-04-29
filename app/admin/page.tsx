import { UserTable } from "@/components/user-table";
import { Navigation } from "@/components/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Painel Admin | Gerador de Encartes",
  description: "Painel administrativo do Gerador de Encartes",
};

export default function Page() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col items-center mb-4">
        <img src="/LOGO.png" alt="Logo Atacado Léia" className="h-24 mb-4" />
        <h1 className="text-3xl font-bold text-center">
          Painel Administrativo
        </h1>
      </div>
      <Navigation />
      <div className="mt-8">
        <UserTable />
      </div>
    </div>
  );
}
