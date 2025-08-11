"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description?: string;
  data: any[];
  isSubmitting: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  data,
  isSubmitting,
}: ConfirmationDialogProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      toast.success("Dados enviados com sucesso para a planilha!");
    } catch (error: any) {
      console.error("Erro ao confirmar envio:", error);
      toast.error(
        `Erro ao enviar dados: ${error.message || "Erro desconhecido"}`
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="py-4">
          <h3 className="text-lg font-semibold mb-2">
            Confirme os dados antes de enviar:
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800">
                  <th className="border border-slate-300 dark:border-slate-600 p-2 text-left">
                    Nome
                  </th>
                  <th className="border border-slate-300 dark:border-slate-600 p-2 text-left">
                    Imagem
                  </th>
                  <th className="border border-slate-300 dark:border-slate-600 p-2 text-left">
                    Unidade
                  </th>
                  <th className="border border-slate-300 dark:border-slate-600 p-2 text-left">
                    Preço
                  </th>
                  <th className="border border-slate-300 dark:border-slate-600 p-2 text-left">
                    Centavos
                  </th>
                  <th className="border border-slate-300 dark:border-slate-600 p-2 text-left">
                    Promoção
                  </th>
                  <th className="border border-slate-300 dark:border-slate-600 p-2 text-left">
                    Rodapé
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr
                    key={index}
                    className={
                      index % 2 === 0
                        ? "bg-white dark:bg-slate-900"
                        : "bg-slate-50 dark:bg-slate-800"
                    }
                  >
                    <td className="border border-slate-300 dark:border-slate-600 p-2">
                      {item.nome}
                    </td>
                    <td className="border border-slate-300 dark:border-slate-600 p-2">
                      {item.imagem ? (
                        <div className="flex items-center">
                          <div className="w-10 h-10 mr-2 relative">
                            <img
                              src={item.imagem}
                              alt={item.nome}
                              className="object-contain w-full h-full"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="border border-slate-300 dark:border-slate-600 p-2 font-bold">
                      {item.unidade || "un"}
                    </td>
                    <td className="border border-slate-300 dark:border-slate-600 p-2">
                      {item.preco}
                    </td>
                    <td className="border border-slate-300 dark:border-slate-600 p-2">
                      {item.centavos}
                    </td>
                    <td className="border border-slate-300 dark:border-slate-600 p-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          item.promo === "show"
                            ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                            : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                        }`}
                      >
                        {item.promo}
                      </span>
                    </td>
                    <td className="border border-slate-300 dark:border-slate-600 p-2">
                      {item.rodape || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Voltar e Editar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            {isSubmitting ? "Enviando..." : "Confirmar e Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
