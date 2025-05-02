-- Schema for Supabase database
-- This script sets up the necessary tables and RLS policies for the application

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user',
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles table
CREATE POLICY "Users can read their own profile" 
  ON profiles FOR SELECT 
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (id = auth.uid());

-- Create admin user profile
INSERT INTO profiles (id, email, name, role, is_approved)
VALUES ('cddb4012-bed2-4462-9048-9115bdd76f94', 'greco92003@gmail.com', 'Greco Marques', 'admin', TRUE)
ON CONFLICT (id) DO UPDATE
SET role = 'admin', is_approved = TRUE;

-- Create RLS policies for storage.objects table
CREATE POLICY "Allow authenticated users to upload files" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'imagens' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read files" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'imagens');

CREATE POLICY "Allow authenticated users to update their own files" 
  ON storage.objects FOR UPDATE 
  USING (bucket_id = 'imagens' AND owner = auth.uid());

CREATE POLICY "Allow authenticated users to delete their own files" 
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'imagens' AND owner = auth.uid());
