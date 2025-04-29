import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Gerador de Encartes",
  description: "Faça login para acessar o Gerador de Encartes",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
