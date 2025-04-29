// Declarações de tipos para o arquivo route.ts

// Declaração para next/server
declare module 'next/server' {
  export class NextResponse {
    static json(body: any, init?: ResponseInit): NextResponse;
  }
}

// Declaração para googleapis
declare module 'googleapis' {
  export const google: {
    auth: {
      JWT: any;
    };
    sheets: (options: { version: string; auth: any }) => {
      spreadsheets: {
        values: {
          update: (params: any) => Promise<{
            data: {
              updatedCells: number;
            }
          }>;
        }
      }
    }
  };
}

// Declaração para process.env
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GOOGLE_PRIVATE_KEY?: string;
    }
  }
  
  var process: {
    env: NodeJS.ProcessEnv;
  };
}
