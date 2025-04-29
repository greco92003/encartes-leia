import { Navigation } from "@/components/navigation";
import { StandaloneProductForm } from "@/components/standalone-product-form";

export default function AdicionarProdutos() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col items-center mb-4">
        <img src="/LOGO.png" alt="Logo Atacado Léia" className="h-24 mb-4" />
        <h1 className="text-3xl font-bold text-center">
          Adicionar Produtos à Listagem
        </h1>
      </div>
      <Navigation />
      <div className="mt-8">
        <StandaloneProductForm />
      </div>
    </div>
  );
}
