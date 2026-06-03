-- 1. Create tables

-- Create community_documents table
CREATE TABLE IF NOT EXISTS public.community_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NULL,
    file_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    category TEXT NULL,
    subcategory TEXT NULL,
    summary TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    role TEXT NOT NULL, -- 'user', 'model'
    content TEXT NOT NULL,
    subcategory_scope TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Configure Row Level Security (RLS) and access policies

-- Enable RLS
ALTER TABLE public.community_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow public read access to approved documents
CREATE POLICY "Allow public read of approved documents" ON public.community_documents
    FOR SELECT TO public USING (status = 'approved');

-- Allow public insert of pending documents (crowd-sourced contributions)
CREATE POLICY "Allow public insert of contributions" ON public.community_documents
    FOR INSERT TO public WITH CHECK (status = 'pending');

-- Allow service-role/admin full control for API updates
CREATE POLICY "Allow service-role write control" ON public.community_documents
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow session-based read/write access to chat messages
-- For simplicity, since anyone can query/create their own chat sessions:
CREATE POLICY "Allow public insert chat messages" ON public.chat_messages
    FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow public select chat messages" ON public.chat_messages
    FOR SELECT TO public USING (true);

-- 3. Storage Bucket Setup (execute this or run via Supabase Storage UI)
-- To create a storage bucket named 'legal-documents' with public access:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('legal-documents', 'legal-documents', true) ON CONFLICT (id) DO NOTHING;
