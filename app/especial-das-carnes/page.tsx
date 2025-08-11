"use client";

import { ProductForm } from "@/components/product-form";
import { Navigation } from "@/components/navigation";

export default function EspecialCarnes() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col items-center mb-4">
        <img
          src="/logo-leia.png"
          alt="Logo Atacado Léia"
          className="h-24 mb-4"
        />
        <h1 className="text-3xl font-bold text-center">Especial das Carnes</h1>
      </div>
      <Navigation />
      <ProductForm
        formType="meat"
        storageKey="encarteCarnesData"
        initialProductCount={12}
      />
    </div>
  );
}
