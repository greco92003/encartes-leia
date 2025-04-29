import { ProductForm } from "@/components/product-form";
import { Navigation } from "@/components/navigation";

export default function OfertasHortiFruti() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col items-center mb-4">
        <img src="/LOGO.png" alt="Logo Atacado Léia" className="h-24 mb-4" />
        <h1 className="text-3xl font-bold text-center">
          Ofertas do Horti-Fruti
        </h1>
      </div>
      <Navigation />
      <ProductForm
        formType="hortiFruti"
        storageKey="encarteFrutiData"
        initialProductCount={12}
      />
    </div>
  );
}
