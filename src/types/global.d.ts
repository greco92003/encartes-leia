// Declarações de tipos simplificadas para os módulos que estamos usando

// Declaração para next/server
declare module "next/server" {
  export class NextResponse {
    static json(body: any, init?: ResponseInit): NextResponse;
  }
}

// Declaração para googleapis
declare module "googleapis" {
  export const google: any;
}

// Declaração para @supabase/supabase-js
declare module "@supabase/supabase-js" {
  export function createClient(supabaseUrl: string, supabaseKey: string): any;
}
