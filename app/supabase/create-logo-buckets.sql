-- Script para criar buckets de logos e suas políticas RLS
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Criar bucket para logos do atacado
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos-atacado',
  'logos-atacado', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Criar bucket para logos das ofertas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos-ofertas',
  'logos-ofertas',
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Criar políticas RLS para bucket logos-atacado

-- Política para permitir leitura pública
CREATE POLICY "Allow public read for logos-atacado" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'logos-atacado');

-- Política para permitir upload por usuários autenticados
CREATE POLICY "Allow authenticated upload for logos-atacado" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'logos-atacado' AND auth.role() = 'authenticated');

-- Política para permitir atualização pelos próprios usuários
CREATE POLICY "Allow owner update for logos-atacado" 
  ON storage.objects FOR UPDATE 
  USING (bucket_id = 'logos-atacado' AND owner = auth.uid());

-- Política para permitir exclusão pelos próprios usuários
CREATE POLICY "Allow owner delete for logos-atacado" 
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'logos-atacado' AND owner = auth.uid());

-- 4. Criar políticas RLS para bucket logos-ofertas

-- Política para permitir leitura pública
CREATE POLICY "Allow public read for logos-ofertas" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'logos-ofertas');

-- Política para permitir upload por usuários autenticados
CREATE POLICY "Allow authenticated upload for logos-ofertas" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'logos-ofertas' AND auth.role() = 'authenticated');

-- Política para permitir atualização pelos próprios usuários
CREATE POLICY "Allow owner update for logos-ofertas" 
  ON storage.objects FOR UPDATE 
  USING (bucket_id = 'logos-ofertas' AND owner = auth.uid());

-- Política para permitir exclusão pelos próprios usuários
CREATE POLICY "Allow owner delete for logos-ofertas" 
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'logos-ofertas' AND owner = auth.uid());

-- 5. Verificar se os buckets foram criados corretamente
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE name IN ('logos-atacado', 'logos-ofertas')
ORDER BY name;

-- 6. Verificar se as políticas foram criadas corretamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%logo%'
ORDER BY policyname;
