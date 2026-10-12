export type ConversationType = 'private' | 'group';
export type MemberRole = 'admin' | 'member';
export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'voice';
export type DeliveryStatus = 'sent' | 'delivered' | 'read';
export type CallType = 'voice' | 'video';
export type CallStatus = 'calling' | 'ringing' | 'connected' | 'ended' | 'declined';

export interface Profile {
  id: string;
  phone_number?: string | null;
  username: string;
  display_name: string;
  avatar_url?: string | null;
  about?: string | null;
  last_seen: string;
  is_online: boolean;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string | null;
  avatar_url?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Computed / joined fields
  members?: ConversationMember[];
  last_message?: Message;
  unread_count?: number;
  other_member?: Profile; // For private chats
}

export interface ConversationMember {
  conversation_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  last_read_message_id?: string | null;
  muted: boolean;
  archived: boolean;
  profile?: Profile;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
  created_at: string;
  user?: Profile;
}

export interface MessageStatus {
  message_id: string;
  user_id: string;
  status: DeliveryStatus;
  delivered_at?: string | null;
  read_at?: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_type: MessageType;
  text?: string | null;
  media_url?: string | null;
  thumbnail_url?: string | null;
  reply_to_message_id?: string | null;
  reply_message?: Message | null;
  file_name?: string | null;
  file_size?: number | null;
  duration?: number | null; // for audio/voice
  created_at: string;
  edited_at?: string | null;
  deleted_at?: string | null;
  sender?: Profile;
  reactions?: MessageReaction[];
  status?: DeliveryStatus;
}

export interface Contact {
  user_id: string;
  contact_user_id: string;
  nickname?: string | null;
  created_at: string;
  contact_profile?: Profile;
}

export interface GroupMeta {
  conversation_id: string;
  name: string;
  description?: string | null;
  avatar_url?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface Call {
  id: string;
  conversation_id: string;
  caller_id: string;
  call_type: CallType;
  status: CallStatus;
  started_at: string;
  ended_at?: string | null;
  caller?: Profile;
  receiver?: Profile;
  is_outgoing?: boolean;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface StatusStory {
  id: string;
  user_id: string;
  type: 'text' | 'image' | 'video';
  content?: string | null;
  media_url?: string | null;
  caption?: string | null;
  background_color?: string;
  created_at: string;
  expires_at: string;
  user?: Profile;
  views_count?: number;
  has_viewed?: boolean;
}

export interface StatusView {
  id: string;
  status_id: string;
  viewer_id: string;
  viewed_at: string;
  viewer?: Profile;
}

export interface TypingIndicator {
  conversation_id: string;
  user_id: string;
  display_name: string;
  timestamp: number;
}

export interface CallSignalPayload {
  type: 'offer' | 'answer' | 'candidate' | 'end' | 'ringing';
  call_id: string;
  caller_id: string;
  target_user_id: string;
  call_type: CallType;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}
