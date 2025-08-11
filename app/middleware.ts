// Middleware para verificar autenticação
export function middleware(request: Request) {
  // Rotas públicas que não precisam de autenticação
  const publicRoutes = [
    "/login",
    "/signup",
    "/auth/signin",
    "/update-password",
    "/encarte-virtual",
  ];

  const url = new URL(request.url);
  const isPublicRoute = publicRoutes.some((route) =>
    url.pathname.startsWith(route)
  );

  // Rotas de API que não precisam de autenticação
  const publicApiRoutes = ["/api/auth"];
  const isPublicApiRoute = publicApiRoutes.some((route) =>
    url.pathname.startsWith(route)
  );

  // Verificar se o usuário está autenticado via cookies
  const cookieHeader = request.headers.get("cookie") || "";
  const isLoggedIn = cookieHeader.includes("isLoggedIn=true");

  // Se for uma rota pública ou de API pública, permitir acesso
  if (isPublicRoute || isPublicApiRoute) {
    return;
  }

  // Se não estiver autenticado e não for uma rota pública, redirecionar para login
  if (!isLoggedIn) {
    return Response.redirect(new URL("/login", request.url));
  }

  // Se estiver autenticado, permitir acesso
  return;
}

// Configurar o middleware para ser executado em todas as rotas exceto assets estáticos
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.png (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.png|public/).*)",
  ],
};
