"use client";

import { useEffect, useState } from "react";
import { AnimatedGroup } from "@/components/motion-primitives/animated-group";
import { OfferItem } from "@/api/offers/route";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";

export default function EncarteVirtual() {
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [visibleOffers, setVisibleOffers] = useState<OfferItem[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [validityDates, setValidityDates] = useState<{
    from?: string;
    to?: string;
  }>({});

  const ITEMS_PER_PAGE = 4;
  const ROTATION_INTERVAL = 10000; // 10 segundos

  // Efeito para buscar as ofertas da API
  useEffect(() => {
    async function fetchOffers() {
      try {
        setLoading(true);
        const response = await fetch("/api/offers");

        if (!response.ok) {
          throw new Error(`Erro ao buscar ofertas: ${response.status}`);
        }

        const data = await response.json();
        console.log("Dados recebidos da API:", data);

        if (data.success) {
          console.log(`Ofertas recebidas: ${data.offers.length}`);
          setOffers(data.offers);

          // Verificar se há uma mensagem na resposta
          if (data.message) {
            setMessage(data.message);
          }

          // Extrair datas de validade das ofertas
          if (data.offers && data.offers.length > 0) {
            // Encontrar a data mais antiga e mais recente
            let earliestDate: Date | null = null;
            let latestDate: Date | null = null;

            data.offers.forEach((offer: OfferItem) => {
              try {
                if (offer.de && offer.de.trim() !== "") {
                  // Verificar formato da data (YYYY-MM-DD ou DD/MM/YYYY)
                  let fromDate: Date;

                  if (offer.de.includes("-")) {
                    fromDate = new Date(offer.de);
                  } else if (offer.de.includes("/")) {
                    const [day, month, year] = offer.de.split("/").map(Number);
                    fromDate = new Date(year, month - 1, day); // Mês em JS é 0-indexed
                  } else {
                    console.log(
                      `Formato de data inválido para início: ${offer.de}`
                    );
                    return; // Pular esta oferta
                  }

                  // Verificar se a data é válida
                  if (!isNaN(fromDate.getTime())) {
                    if (!earliestDate || fromDate < earliestDate) {
                      earliestDate = fromDate;
                    }
                  }
                }

                if (offer.ate && offer.ate.trim() !== "") {
                  // Verificar formato da data (YYYY-MM-DD ou DD/MM/YYYY)
                  let toDate: Date;

                  if (offer.ate.includes("-")) {
                    toDate = new Date(offer.ate);
                  } else if (offer.ate.includes("/")) {
                    const [day, month, year] = offer.ate.split("/").map(Number);
                    toDate = new Date(year, month - 1, day); // Mês em JS é 0-indexed
                  } else {
                    console.log(
                      `Formato de data inválido para fim: ${offer.ate}`
                    );
                    return; // Pular esta oferta
                  }

                  // Verificar se a data é válida
                  if (!isNaN(toDate.getTime())) {
                    if (!latestDate || toDate > latestDate) {
                      latestDate = toDate;
                    }
                  }
                }
              } catch (err) {
                console.error(
                  `Erro ao processar datas para oferta ${offer.nome}:`,
                  err
                );
                // Continuar com a próxima oferta
              }
            });

            // Formatar as datas para exibição
            const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });

            setValidityDates({
              from: earliestDate
                ? dateFormatter.format(earliestDate)
                : undefined,
              to: latestDate ? dateFormatter.format(latestDate) : undefined,
            });
          }
        } else {
          throw new Error(
            data.message || "Erro desconhecido ao buscar ofertas"
          );
        }
      } catch (err) {
        console.error("Erro ao buscar ofertas:", err);

        // Mensagem de erro mais detalhada
        let errorMessage = "Erro desconhecido";

        if (err instanceof Error) {
          errorMessage = `${err.name}: ${err.message}`;
          console.error("Stack trace:", err.stack);
        } else if (err && typeof err === "object") {
          errorMessage = JSON.stringify(err);
        } else if (err !== null && err !== undefined) {
          errorMessage = String(err);
        }

        setError(errorMessage);

        // Definir ofertas como array vazio para evitar problemas
        setOffers([]);
      } finally {
        setLoading(false);
      }
    }

    fetchOffers();
  }, []);

  // Efeito para atualizar os produtos visíveis quando as ofertas mudarem
  useEffect(() => {
    if (offers.length > 0) {
      updateVisibleOffers(0);
    }
  }, [offers]);

  // Efeito para rotacionar os produtos a cada intervalo de tempo
  useEffect(() => {
    if (offers.length <= ITEMS_PER_PAGE) {
      // Se tiver menos produtos que o número por página, mostra todos
      setVisibleOffers(offers);
      return;
    }

    const intervalId = setInterval(() => {
      setCurrentPage((prevPage) => {
        const nextPage =
          (prevPage + 1) % Math.ceil(offers.length / ITEMS_PER_PAGE);
        updateVisibleOffers(nextPage);
        return nextPage;
      });
    }, ROTATION_INTERVAL);

    return () => clearInterval(intervalId);
  }, [offers]);

  // Função para atualizar os produtos visíveis com base na página atual
  const updateVisibleOffers = (page: number) => {
    const startIndex = page * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, offers.length);
    setVisibleOffers(offers.slice(startIndex, endIndex));
  };

  // Formatar preço com centavos
  const formatPrice = (preco: number, centavos: number, unidade: string) => {
    // Garantir que preco e centavos sejam números válidos
    const precoNum = isNaN(preco) ? 0 : preco;
    const centavosNum = isNaN(centavos)
      ? 0
      : Math.min(99, Math.max(0, centavos));

    const precoFormatado = precoNum.toString();
    const centavosFormatados =
      centavosNum < 10 ? `0${centavosNum}` : centavosNum.toString();

    return (
      <div className="flex items-center justify-center">
        <div className="flex items-baseline">
          <span className="text-lg sm:text-xl font-bold mr-1 text-red-700">
            R$
          </span>
          <span className="text-5xl sm:text-7xl font-bold text-red-700">
            {precoFormatado}
          </span>
          <div className="flex items-baseline ml-1">
            <span className="text-2xl sm:text-3xl font-bold text-red-700">
              ,{centavosFormatados}
            </span>
            <span className="text-lg sm:text-xl font-medium ml-1 text-red-700">
              {unidade}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-4 px-2 sm:px-4">
      <div className="flex flex-col items-center mb-2">
        <img
          src="/logo-leia.png"
          alt="Logo Atacado Léia"
          className="h-24 mb-2"
        />
      </div>

      <div className="mt-8">
        {/* Título das ofertas */}
        <Card className="bg-red-600 mb-4 border-0 shadow-lg">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-center text-white text-xl sm:text-2xl font-bold">
              OFERTAS IMPERDÍVEIS
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Exibir datas de validade se disponíveis */}
        {(validityDates.from || validityDates.to) && (
          <div className="mb-4 text-center">
            <p className="text-base sm:text-lg font-semibold text-red-600">
              Ofertas válidas de {validityDates.from || "?"} até{" "}
              {validityDates.to || "?"}
            </p>
          </div>
        )}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-lg">Carregando ofertas...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col justify-center items-center h-64 p-4">
            <p className="text-xl text-red-600 font-bold mb-2">
              Erro ao carregar ofertas
            </p>
            <p className="text-sm text-red-600 text-center max-w-md">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        ) : offers.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 p-4">
            <p className="text-2xl text-red-600 font-bold mb-2">
              {message || "SEM PRODUTOS PARA EXIBIR"}
            </p>
            <p className="text-sm text-gray-600 text-center max-w-md">
              No momento não há ofertas disponíveis. Por favor, volte mais
              tarde.
            </p>
          </div>
        ) : (
          <div>
            <AnimatedGroup
              key={currentPage} // Adiciona uma key para forçar a recriação do componente quando a página muda
              className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-4"
              preset="scale"
            >
              {visibleOffers.map((offer, index) => (
                <Card
                  key={index}
                  className="overflow-hidden shadow-xl transform transition-all duration-300 hover:scale-105 border-red-600 border-2 p-0 py-0 max-w-md mx-auto w-full"
                >
                  {/* Cabeçalho com nome do produto */}
                  <CardHeader className="bg-red-600 p-3 py-3 m-0 gap-0">
                    <CardTitle className="text-center text-white truncate py-1 text-base sm:text-lg">
                      {offer.nome}
                    </CardTitle>
                  </CardHeader>

                  {/* Imagem do produto */}
                  <CardContent className="p-4 pb-0 pt-3 flex justify-center items-center h-48 sm:h-40 bg-white px-2 mb-0">
                    {offer.imagem ? (
                      <img
                        src={offer.imagem}
                        alt={offer.nome}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          // Fallback para quando a imagem não carrega
                          e.currentTarget.style.display = "none";
                          // Mostrar mensagem de erro
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            const errorDiv = document.createElement("div");
                            errorDiv.className =
                              "w-full h-full flex items-center justify-center bg-gray-100";
                            errorDiv.innerHTML =
                              '<span class="text-gray-400">Imagem indisponível</span>';
                            parent.appendChild(errorDiv);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <span className="text-gray-400">Sem imagem</span>
                      </div>
                    )}
                  </CardContent>

                  {/* Preço do produto - sem espaço entre a imagem e o preço */}
                  <CardContent className="bg-white -mt-4 pb-3 flex justify-center px-2">
                    <div className="inline-flex items-center scale-120 transform">
                      {formatPrice(offer.preco, offer.centavos, offer.unidade)}
                    </div>
                  </CardContent>

                  {/* Informação de promoção */}
                  {offer.promo && offer.promo !== "hide" && (
                    <CardContent className="bg-yellow-400 py-1 text-center font-bold px-2 -mt-2 mb-0 pb-0 text-sm sm:text-base">
                      {offer.promo === "show" ? "OFERTA ESPECIAL" : offer.promo}
                    </CardContent>
                  )}

                  {/* Rodapé com informações adicionais */}
                  {offer.rodape && (
                    <CardFooter className="bg-white py-0 justify-center px-2 -mt-3 pt-0 pb-1">
                      <p className="text-sm sm:text-base font-medium text-center mb-1">
                        {offer.rodape}
                      </p>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </AnimatedGroup>

            {/* Indicadores de página */}
            {offers.length > ITEMS_PER_PAGE && (
              <div className="flex justify-center mt-4 space-x-2">
                {Array.from({
                  length: Math.ceil(offers.length / ITEMS_PER_PAGE),
                }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                      i === currentPage ? "bg-red-600" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rodapé */}
      <footer className="mt-8 py-4 border-t border-gray-200">
        <div className="flex flex-col items-center">
          <p className="text-sm text-gray-600 mb-2">
            Preços válidos enquanto durarem os estoques. Imagens meramente
            ilustrativas.
          </p>
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} Atacado Léia - Todos os direitos
            reservados
          </p>
        </div>
      </footer>
    </div>
  );
}
