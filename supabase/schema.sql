-- ====================================================================
-- PULSEFLOW MESSENGER - SUPABASE POSTGRESQL DATABASE SCHEMA & RLS
-- ====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Custom Types
DO $$ BEGIN
    CREATE TYPE conversation_type AS ENUM ('private', 'group');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE member_role AS ENUM ('admin', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE message_type AS ENUM ('text', 'image', 'video', 'audio', 'document', 'voice');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE delivery_status AS ENUM ('sent', 'delivered', 'read');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE call_type AS ENUM ('voice', 'video');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE call_status AS ENUM ('calling', 'ringing', 'connected', 'ended', 'declined');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number TEXT,
    username TEXT UNIQUE,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    about TEXT DEFAULT 'Hey there! I am using PulseFlow.',
    last_seen TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    is_online BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type conversation_type NOT NULL DEFAULT 'private',
    name TEXT,
    avatar_url TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. CONVERSATION MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.conversation_members (
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role member_role NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_read_message_id UUID,
    muted BOOLEAN DEFAULT false,
    archived BOOLEAN DEFAULT false,
    PRIMARY KEY (conversation_id, user_id)
);

-- 6. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message_type message_type NOT NULL DEFAULT 'text',
    text TEXT,
    media_url TEXT,
    thumbnail_url TEXT,
    reply_to_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

-- 7. MESSAGE REACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reaction TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (message_id, user_id, reaction)
);

-- 8. MESSAGE STATUS TABLE
CREATE TABLE IF NOT EXISTS public.message_status (
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status delivery_status NOT NULL DEFAULT 'sent',
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    PRIMARY KEY (message_id, user_id)
);

-- 9. CONTACTS TABLE
CREATE TABLE IF NOT EXISTS public.contacts (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    contact_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    nickname TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, contact_user_id)
);

-- 10. GROUPS METADATA TABLE
CREATE TABLE IF NOT EXISTS public.groups (
    conversation_id UUID PRIMARY KEY REFERENCES public.conversations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. CALLS TABLE
CREATE TABLE IF NOT EXISTS public.calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    caller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    call_type call_type NOT NULL DEFAULT 'voice',
    status call_status NOT NULL DEFAULT 'calling',
    started_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    ended_at TIMESTAMPTZ
);

-- 12. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. STATUSES (24-HOUR STORIES) TABLE
CREATE TABLE IF NOT EXISTS public.statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'text', -- 'text', 'image', 'video'
    content TEXT,
    media_url TEXT,
    caption TEXT,
    background_color TEXT DEFAULT '#0f766e',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMPTZ DEFAULT (timezone('utc'::text, now()) + interval '24 hours') NOT NULL
);

-- 14. STATUS VIEWS TABLE
CREATE TABLE IF NOT EXISTS public.status_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status_id UUID NOT NULL REFERENCES public.statuses(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (status_id, viewer_id)
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_views ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Public profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- CONVERSATION MEMBERS HELPER FUNCTION
CREATE OR REPLACE FUNCTION public.is_member_of(conv_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.conversation_members
        WHERE conversation_id = conv_id AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CONVERSATIONS POLICIES
CREATE POLICY "Users can view conversations they belong to"
    ON public.conversations FOR SELECT
    TO authenticated
    USING (public.is_member_of(id));

CREATE POLICY "Users can create conversations"
    ON public.conversations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins or members can update conversation details"
    ON public.conversations FOR UPDATE
    TO authenticated
    USING (public.is_member_of(id));

-- CONVERSATION MEMBERS POLICIES
CREATE POLICY "Users can view members of conversations they belong to"
    ON public.conversation_members FOR SELECT
    TO authenticated
    USING (public.is_member_of(conversation_id));

CREATE POLICY "Users can insert themselves or group admins can insert members"
    ON public.conversation_members FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update their own membership state or admins can update roles"
    ON public.conversation_members FOR UPDATE
    TO authenticated
    USING (public.is_member_of(conversation_id));

CREATE POLICY "Members can leave or admins can remove members"
    ON public.conversation_members FOR DELETE
    TO authenticated
    USING (user_id = auth.uid() OR public.is_member_of(conversation_id));

-- MESSAGES POLICIES
CREATE POLICY "Users can read messages in their conversations"
    ON public.messages FOR SELECT
    TO authenticated
    USING (public.is_member_of(conversation_id));

CREATE POLICY "Users can send messages to conversations they belong to"
    ON public.messages FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = sender_id AND
        public.is_member_of(conversation_id)
    );

CREATE POLICY "Users can update their own messages"
    ON public.messages FOR UPDATE
    TO authenticated
    USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages"
    ON public.messages FOR DELETE
    TO authenticated
    USING (auth.uid() = sender_id);

-- MESSAGE REACTIONS POLICIES
CREATE POLICY "Users can view reactions in their conversations"
    ON public.message_reactions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.messages m
            WHERE m.id = message_id AND public.is_member_of(m.conversation_id)
        )
    );

CREATE POLICY "Users can add reactions in their conversations"
    ON public.message_reactions FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.messages m
            WHERE m.id = message_id AND public.is_member_of(m.conversation_id)
        )
    );

CREATE POLICY "Users can remove their reactions"
    ON public.message_reactions FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- MESSAGE STATUS POLICIES
CREATE POLICY "Users can view delivery/read status"
    ON public.message_status FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.messages m
            WHERE m.id = message_id AND public.is_member_of(m.conversation_id)
        )
    );

CREATE POLICY "Users can update their own message status"
    ON public.message_status FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can modify their message status"
    ON public.message_status FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- CONTACTS POLICIES
CREATE POLICY "Users can manage their contacts"
    ON public.contacts FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- GROUPS POLICIES
CREATE POLICY "Users can view groups they belong to"
    ON public.groups FOR SELECT
    TO authenticated
    USING (public.is_member_of(conversation_id));

CREATE POLICY "Users can create groups"
    ON public.groups FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group admins can update group metadata"
    ON public.groups FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_members
            WHERE conversation_id = groups.conversation_id
            AND user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- CALLS POLICIES
CREATE POLICY "Users can view and participate in calls of their conversations"
    ON public.calls FOR ALL
    TO authenticated
    USING (public.is_member_of(conversation_id));

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can view their notifications"
    ON public.notifications FOR ALL
    TO authenticated
    USING (auth.uid() = user_id);

-- STATUSES POLICIES
CREATE POLICY "Users can view non-expired statuses"
    ON public.statuses FOR SELECT
    TO authenticated
    USING (expires_at > now());

CREATE POLICY "Users can create their own status"
    ON public.statuses FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own status"
    ON public.statuses FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- STATUS VIEWS POLICIES
CREATE POLICY "Users can view who viewed their own status"
    ON public.status_views FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.statuses s
            WHERE s.id = status_id AND (s.user_id = auth.uid() OR viewer_id = auth.uid())
        )
    );

CREATE POLICY "Users can record status view"
    ON public.status_views FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = viewer_id);

-- ====================================================================
-- REALTIME PUBLICATION SETUP
-- ====================================================================

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.statuses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ====================================================================
-- AUTOMATIC PROFILE TRIGGER ON SIGNUP
-- ====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, username, avatar_url, phone_number)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'User'),
        COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
        COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/bottts/svg?seed=' || new.id::text),
        new.phone
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ====================================================================
-- STORAGE BUCKETS SETUP
-- ====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('chat-attachments', 'chat-attachments', true),
    ('avatars', 'avatars', true),
    ('status-media', 'status-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public chat attachments access"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id IN ('chat-attachments', 'avatars', 'status-media'));

CREATE POLICY "Authenticated users can upload attachments"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id IN ('chat-attachments', 'avatars', 'status-media'));
