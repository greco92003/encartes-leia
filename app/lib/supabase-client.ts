/**
 * Centralized Supabase client configuration
 * This file provides a consistent way to initialize the Supabase client
 * with fallback values to prevent build errors.
 */

import { createClient } from "@supabase/supabase-js";

// Configuração do Supabase
// Usando variáveis de ambiente para evitar vazamento de credenciais
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zqeypptzvwelnlkqbcco.supabase.co";

// Definindo uma chave padrão para o build, mas em produção deve ser substituída por variável de ambiente
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxZXlwcHR6dndlbG5sa3FiY2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MzA5MzYsImV4cCI6MjA2MTIwNjkzNn0.cv7qesO485uyZ_t2r4ms7AjdXNJjUum4NuJKRjctVME";

// Criar cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);

// Exportar as configurações para uso em outros lugares
export const supabaseConfig = {
  url: supabaseUrl,
  key: supabaseKey,
  bucketName: "imagens-leia",
};
