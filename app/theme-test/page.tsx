"use client";

import { ThemeToggle } from "@/components/theme-toggle";

export default function ThemeTestPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col items-center mb-4">
        <h1 className="text-3xl font-bold text-center mb-4">
          Teste de Tema
        </h1>
        <div className="mb-4">
          <ThemeToggle />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
          <div className="p-6 bg-card text-card-foreground rounded-lg border border-border">
            <h2 className="text-xl font-semibold mb-2">Card</h2>
            <p>Este é um exemplo de card com as cores do tema.</p>
          </div>
          <div className="p-6 bg-primary text-primary-foreground rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Primary</h2>
            <p>Este é um exemplo com a cor primária do tema.</p>
          </div>
          <div className="p-6 bg-secondary text-secondary-foreground rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Secondary</h2>
            <p>Este é um exemplo com a cor secundária do tema.</p>
          </div>
          <div className="p-6 bg-accent text-accent-foreground rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Accent</h2>
            <p>Este é um exemplo com a cor de destaque do tema.</p>
          </div>
          <div className="p-6 bg-muted text-muted-foreground rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Muted</h2>
            <p>Este é um exemplo com a cor suave do tema.</p>
          </div>
          <div className="p-6 bg-destructive text-destructive-foreground rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Destructive</h2>
            <p>Este é um exemplo com a cor de alerta do tema.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
