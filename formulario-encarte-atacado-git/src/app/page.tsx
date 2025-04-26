import { ProductForm } from "@/components/product-form";

export default function Home() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col items-center mb-8">
        <img src="/LOGO.png" alt="Logo Atacado Léia" className="h-24 mb-4" />
        <h1 className="text-3xl font-bold text-center">
          Formulário de Encartes Atacado Léia
        </h1>
      </div>
      <ProductForm />
    </div>
  );
}
