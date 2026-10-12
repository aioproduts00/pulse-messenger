import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  Conversation,
  Message,
  MessageReaction,
  MessageType,
  DeliveryStatus,
  TypingIndicator,
  Profile,
} from '../types';
import { useAuth, SEED_PROFILES } from './AuthContext';
import { getSupabaseClient } from '../lib/supabase';

interface SendMessageOptions {
  text?: string;
  message_type?: MessageType;
  media_url?: string;
  thumbnail_url?: string;
  reply_to_message_id?: string;
  file_name?: string;
  file_size?: number;
  duration?: number;
}

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  messagesLoading: boolean;
  typingUsers: TypingIndicator[];
  activeTab: 'chats' | 'status' | 'calls' | 'contacts' | 'settings';
  setActiveTab: (tab: 'chats' | 'status' | 'calls' | 'contacts' | 'settings') => void;
  selectConversation: (id: string | null) => void;
  sendMessage: (options: SendMessageOptions) => Promise<Message | null>;
  editMessage: (messageId: string, newText: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  reactToMessage: (messageId: string, emoji: string) => Promise<boolean>;
  markConversationAsRead: (convId: string) => Promise<void>;
  sendTypingSignal: (isTyping: boolean) => void;
  startPrivateChat: (targetUser: Profile) => Promise<Conversation>;
  createGroup: (name: string, description: string, memberIds: string[], avatarUrl?: string) => Promise<Conversation>;
  forwardMessage: (message: Message, targetConvId: string) => Promise<boolean>;
  replyingTo: Message | null;
  setReplyingTo: (msg: Message | null) => void;
  editingMessage: Message | null;
  setEditingMessage: (msg: Message | null) => void;
  forwardingMessage: Message | null;
  setForwardingMessage: (msg: Message | null) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  loadMoreMessages: () => void;
  hasMoreMessages: boolean;
  refreshConversations: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const LOCAL_CONVERSATIONS_KEY = 'pulseflow_conversations_v2';
const LOCAL_MESSAGES_KEY = 'pulseflow_messages_v2';

// Seed conversations for instant test experience
function getInitialSeedConversations(currentUser: Profile): { convs: Conversation[]; msgs: Message[] } {
  const c1Id = 'conv-elena-alex';
  const c2Id = 'conv-pulse-eng-group';
  const c3Id = 'conv-marcus-alex';

  const convs: Conversation[] = [
    {
      id: c1Id,
      type: 'private',
      name: 'Elena Rostova',
      avatar_url: SEED_PROFILES[1].avatar_url,
      created_by: SEED_PROFILES[1].id,
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      updated_at: new Date(Date.now() - 60000 * 12).toISOString(),
      other_member: SEED_PROFILES[1],
      unread_count: 1,
      members: [
        {
          conversation_id: c1Id,
          user_id: currentUser.id,
          role: 'member',
          joined_at: new Date().toISOString(),
          muted: false,
          archived: false,
        },
        {
          conversation_id: c1Id,
          user_id: SEED_PROFILES[1].id,
          role: 'member',
          joined_at: new Date().toISOString(),
          muted: false,
          archived: false,
          profile: SEED_PROFILES[1],
        },
      ],
    },
    {
      id: c2Id,
      type: 'group',
      name: 'PulseFlow Core Team ⚡',
      avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      created_by: currentUser.id,
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
      updated_at: new Date(Date.now() - 60000 * 2).toISOString(),
      unread_count: 0,
      members: [
        {
          conversation_id: c2Id,
          user_id: currentUser.id,
          role: 'admin',
          joined_at: new Date().toISOString(),
          muted: false,
          archived: false,
          profile: currentUser,
        },
        {
          conversation_id: c2Id,
          user_id: SEED_PROFILES[1].id,
          role: 'member',
          joined_at: new Date().toISOString(),
          muted: false,
          archived: false,
          profile: SEED_PROFILES[1],
        },
        {
          conversation_id: c2Id,
          user_id: SEED_PROFILES[2].id,
          role: 'member',
          joined_at: new Date().toISOString(),
          muted: false,
          archived: false,
          profile: SEED_PROFILES[2],
        },
      ],
    },
    {
      id: c3Id,
      type: 'private',
      name: 'Marcus Vance',
      avatar_url: SEED_PROFILES[2].avatar_url,
      created_by: SEED_PROFILES[2].id,
      created_at: new Date(Date.now() - 3600000 * 10).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      other_member: SEED_PROFILES[2],
      unread_count: 0,
      members: [
        {
          conversation_id: c3Id,
          user_id: currentUser.id,
          role: 'member',
          joined_at: new Date().toISOString(),
          muted: false,
          archived: false,
        },
        {
          conversation_id: c3Id,
          user_id: SEED_PROFILES[2].id,
          role: 'member',
          joined_at: new Date().toISOString(),
          muted: false,
          archived: false,
          profile: SEED_PROFILES[2],
        },
      ],
    },
  ];

  const msgs: Message[] = [
    {
      id: 'msg-seed-1',
      conversation_id: c1Id,
      sender_id: SEED_PROFILES[1].id,
      message_type: 'text',
      text: 'Hey! The new WebRTC signaling architecture and audio player are ready for review.',
      created_at: new Date(Date.now() - 60000 * 35).toISOString(),
      status: 'read',
      sender: SEED_PROFILES[1],
      reactions: [{ id: 'r1', message_id: 'msg-seed-1', user_id: currentUser.id, reaction: '🔥', created_at: new Date().toISOString() }],
    },
    {
      id: 'msg-seed-2',
      conversation_id: c1Id,
      sender_id: currentUser.id,
      message_type: 'text',
      text: 'Awesome work! Testing audio clips and status stories right now.',
      created_at: new Date(Date.now() - 60000 * 20).toISOString(),
      status: 'read',
      sender: currentUser,
    },
    {
      id: 'msg-seed-3',
      conversation_id: c1Id,
      sender_id: SEED_PROFILES[1].id,
      message_type: 'text',
      text: 'Check out this design snapshot of the responsive dark theme:',
      media_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
      created_at: new Date(Date.now() - 60000 * 12).toISOString(),
      status: 'delivered',
      sender: SEED_PROFILES[1],
    },
    {
      id: 'msg-seed-4',
      conversation_id: c2Id,
      sender_id: SEED_PROFILES[2].id,
      message_type: 'text',
      text: 'Welcome to the PulseFlow Core Engineering channel! All Postgres migrations and RLS policies are validated.',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      status: 'read',
      sender: SEED_PROFILES[2],
    },
    {
      id: 'msg-seed-5',
      conversation_id: c2Id,
      sender_id: currentUser.id,
      message_type: 'text',
      text: 'Realtime presence, typing indicators, and emoji reactions verified across tabs.',
      created_at: new Date(Date.now() - 60000 * 2).toISOString(),
      status: 'read',
      sender: currentUser,
    },
    {
      id: 'msg-seed-6',
      conversation_id: c3Id,
      sender_id: SEED_PROFILES[2].id,
      message_type: 'text',
      text: 'Hey! Ready for a quick test call whenever you are.',
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      status: 'read',
      sender: SEED_PROFILES[2],
    },
  ];

  return { convs, msgs };
}

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'status' | 'calls' | 'contacts' | 'settings'>('chats');
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasMoreMessages] = useState(false);

  const broadcastRef = useRef<BroadcastChannel | null>(null);

  // Load from local storage or initialize seeds
  const loadLocalData = useCallback(() => {
    if (!currentUser) return { convs: [], msgs: [] };

    try {
      const storedConvs = localStorage.getItem(LOCAL_CONVERSATIONS_KEY);
      const storedMsgs = localStorage.getItem(LOCAL_MESSAGES_KEY);

      if (storedConvs && storedMsgs) {
        return {
          convs: JSON.parse(storedConvs) as Conversation[],
          msgs: JSON.parse(storedMsgs) as Message[],
        };
      }
    } catch {
      // ignore
    }

    const initial = getInitialSeedConversations(currentUser);
    localStorage.setItem(LOCAL_CONVERSATIONS_KEY, JSON.stringify(initial.convs));
    localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(initial.msgs));
    return initial;
  }, [currentUser]);

  // Setup multi-tab BroadcastChannel
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const bc = new BroadcastChannel('pulseflow_realtime');
      broadcastRef.current = bc;

      bc.onmessage = (event) => {
        const data = event.data;
        if (!data || !data.type) return;

        if (data.type === 'NEW_MESSAGE') {
          const msg = data.payload as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === msg.conversation_id) {
                return {
                  ...c,
                  last_message: msg,
                  updated_at: msg.created_at,
                  unread_count: (c.unread_count || 0) + (msg.sender_id !== currentUser?.id ? 1 : 0),
                };
              }
              return c;
            })
          );
        } else if (data.type === 'UPDATE_MESSAGE') {
          const msg = data.payload as Message;
          setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, ...msg } : m)));
        } else if (data.type === 'DELETE_MESSAGE') {
          const { messageId } = data.payload;
          setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, deleted_at: new Date().toISOString(), text: 'This message was deleted' } : m))
          );
        } else if (data.type === 'REACTION') {
          const { messageId, reaction } = data.payload;
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== messageId) return m;
              const existing = m.reactions || [];
              const filtered = existing.filter((r) => !(r.user_id === reaction.user_id && r.reaction === reaction.reaction));
              return { ...m, reactions: [...filtered, reaction] };
            })
          );
        } else if (data.type === 'TYPING') {
          const indicator = data.payload as TypingIndicator;
          if (indicator.user_id !== currentUser?.id) {
            setTypingUsers((prev) => {
              const cleaned = prev.filter((t) => t.user_id !== indicator.user_id);
              return [...cleaned, indicator];
            });
            setTimeout(() => {
              setTypingUsers((prev) => prev.filter((t) => t.user_id !== indicator.user_id));
            }, 3000);
          }
        }
      };

      return () => {
        bc.close();
      };
    } catch {
      // BroadcastChannel unsupported
    }
  }, [currentUser]);

  // Fetch or sync conversations
  const refreshConversations = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: convMembers, error: memErr } = await supabase
          .from('conversation_members')
          .select('conversation_id, role, muted, archived, conversations(*)')
          .eq('user_id', currentUser.id);

        if (!memErr && convMembers && convMembers.length > 0) {
          const fetchedConvs: Conversation[] = [];
          for (const item of convMembers) {
            const rawConv = item.conversations as unknown as Conversation;
            if (!rawConv) continue;

            // Fetch last message
            const { data: lastMsgs } = await supabase
              .from('messages')
              .select('*')
              .eq('conversation_id', rawConv.id)
              .order('created_at', { ascending: false })
              .limit(1);

            // Fetch other member for private chat
            let otherMember: Profile | undefined;
            if (rawConv.type === 'private') {
              const { data: otherMemData } = await supabase
                .from('conversation_members')
                .select('user_id, profiles(*)')
                .eq('conversation_id', rawConv.id)
                .neq('user_id', currentUser.id)
                .limit(1);

              if (otherMemData && otherMemData[0]?.profiles) {
                otherMember = otherMemData[0].profiles as unknown as Profile;
              }
            }

            fetchedConvs.push({
              ...rawConv,
              name: rawConv.type === 'private' ? otherMember?.display_name || rawConv.name : rawConv.name,
              avatar_url: rawConv.type === 'private' ? otherMember?.avatar_url || rawConv.avatar_url : rawConv.avatar_url,
              other_member: otherMember,
              last_message: lastMsgs?.[0] as Message | undefined,
            });
          }

          fetchedConvs.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
          setConversations(fetchedConvs);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Supabase conversations query error:', err);
      }
    }

    // Fallback: local store
    const { convs } = loadLocalData();
    // compute last_messages
    const { msgs } = loadLocalData();
    const enriched = convs.map((c) => {
      const convMsgs = msgs.filter((m) => m.conversation_id === c.id);
      const last = convMsgs[convMsgs.length - 1];
      return {
        ...c,
        last_message: last || c.last_message,
      };
    });
    enriched.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    setConversations(enriched);
    setLoading(false);
  }, [currentUser, loadLocalData]);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  // Load messages when activeConversation changes
  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }

    setMessagesLoading(true);
    const supabase = getSupabaseClient();

    if (supabase) {
      supabase
        .from('messages')
        .select('*, sender:profiles(*), reactions:message_reactions(*)')
        .eq('conversation_id', activeConversation.id)
        .order('created_at', { ascending: true })
        .then(({ data, error }) => {
          if (!error && data) {
            setMessages(data as Message[]);
          }
          setMessagesLoading(false);
        });
      return;
    }

    // Local messages
    const { msgs } = loadLocalData();
    const filtered = msgs.filter((m) => m.conversation_id === activeConversation.id);
    setMessages(filtered);
    setMessagesLoading(false);
  }, [activeConversation, loadLocalData]);

  // Mark conversation as read
  const markConversationAsRead = useCallback(async (convId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unread_count: 0 } : c))
    );

    const supabase = getSupabaseClient();
    if (supabase && currentUser) {
      try {
        await supabase
          .from('conversation_members')
          .update({ last_read_message_id: messages[messages.length - 1]?.id || null })
          .match({ conversation_id: convId, user_id: currentUser.id });
      } catch (err) {
        console.warn('Error updating read status:', err);
      }
    }
  }, [currentUser, messages]);

  const selectConversation = (id: string | null) => {
    if (!id) {
      setActiveConversation(null);
      return;
    }
    const found = conversations.find((c) => c.id === id);
    if (found) {
      setActiveConversation(found);
      markConversationAsRead(id);
    }
  };

  const sendMessage = async (options: SendMessageOptions): Promise<Message | null> => {
    if (!currentUser || !activeConversation) return null;

    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      conversation_id: activeConversation.id,
      sender_id: currentUser.id,
      message_type: options.message_type || 'text',
      text: options.text || null,
      media_url: options.media_url || null,
      thumbnail_url: options.thumbnail_url || null,
      reply_to_message_id: options.reply_to_message_id || replyingTo?.id || null,
      reply_message: replyingTo || null,
      file_name: options.file_name || null,
      file_size: options.file_size || null,
      duration: options.duration || null,
      created_at: new Date().toISOString(),
      sender: currentUser,
      reactions: [],
      status: 'delivered',
    };

    setReplyingTo(null);

    // Optimistically update local message state
    setMessages((prev) => [...prev, newMessage]);

    // Update conversation timestamp & last_message
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? { ...c, last_message: newMessage, updated_at: newMessage.created_at }
          : c
      )
    );

    // Save to local storage
    try {
      const stored = localStorage.getItem(LOCAL_MESSAGES_KEY);
      const allMsgs: Message[] = stored ? JSON.parse(stored) : [];
      localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify([...allMsgs, newMessage]));
    } catch {
      // ignore
    }

    // Broadcast to other tabs
    broadcastRef.current?.postMessage({
      type: 'NEW_MESSAGE',
      payload: newMessage,
    });

    // Supabase insert if connected
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('messages')
          .insert({
            id: newMessage.id,
            conversation_id: newMessage.conversation_id,
            sender_id: newMessage.sender_id,
            message_type: newMessage.message_type,
            text: newMessage.text,
            media_url: newMessage.media_url,
            thumbnail_url: newMessage.thumbnail_url,
            reply_to_message_id: newMessage.reply_to_message_id,
            created_at: newMessage.created_at,
          })
          .select()
          .single();

        if (!error && data) {
          await supabase
            .from('conversations')
            .update({ updated_at: newMessage.created_at })
            .eq('id', activeConversation.id);
        }
      } catch (err) {
        console.warn('Supabase message insert error:', err);
      }
    }

    return newMessage;
  };

  const editMessage = async (messageId: string, newText: string): Promise<boolean> => {
    const editedAt = new Date().toISOString();
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, text: newText, edited_at: editedAt } : m))
    );

    setEditingMessage(null);

    // Update local storage
    try {
      const stored = localStorage.getItem(LOCAL_MESSAGES_KEY);
      if (stored) {
        const all: Message[] = JSON.parse(stored);
        localStorage.setItem(
          LOCAL_MESSAGES_KEY,
          JSON.stringify(all.map((m) => (m.id === messageId ? { ...m, text: newText, edited_at: editedAt } : m)))
        );
      }
    } catch {
      // ignore
    }

    broadcastRef.current?.postMessage({
      type: 'UPDATE_MESSAGE',
      payload: { id: messageId, text: newText, edited_at: editedAt },
    });

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('messages').update({ text: newText, edited_at: editedAt }).eq('id', messageId);
    }
    return true;
  };

  const deleteMessage = async (messageId: string): Promise<boolean> => {
    const deletedAt = new Date().toISOString();
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, deleted_at: deletedAt, text: 'This message was deleted' }
          : m
      )
    );

    try {
      const stored = localStorage.getItem(LOCAL_MESSAGES_KEY);
      if (stored) {
        const all: Message[] = JSON.parse(stored);
        localStorage.setItem(
          LOCAL_MESSAGES_KEY,
          JSON.stringify(
            all.map((m) =>
              m.id === messageId ? { ...m, deleted_at: deletedAt, text: 'This message was deleted' } : m
            )
          )
        );
      }
    } catch {
      // ignore
    }

    broadcastRef.current?.postMessage({
      type: 'DELETE_MESSAGE',
      payload: { messageId },
    });

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('messages').update({ deleted_at: deletedAt }).eq('id', messageId);
    }
    return true;
  };

  const reactToMessage = async (messageId: string, emoji: string): Promise<boolean> => {
    if (!currentUser) return false;

    const reaction: MessageReaction = {
      id: `react-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      message_id: messageId,
      user_id: currentUser.id,
      reaction: emoji,
      created_at: new Date().toISOString(),
      user: currentUser,
    };

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const existing = m.reactions || [];
        // Toggle if user already reacted with this emoji
        const exists = existing.some((r) => r.user_id === currentUser.id && r.reaction === emoji);
        const filtered = exists
          ? existing.filter((r) => !(r.user_id === currentUser.id && r.reaction === emoji))
          : [...existing.filter((r) => r.user_id !== currentUser.id), reaction];
        return { ...m, reactions: filtered };
      })
    );

    broadcastRef.current?.postMessage({
      type: 'REACTION',
      payload: { messageId, reaction },
    });

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('message_reactions').upsert({
        message_id: messageId,
        user_id: currentUser.id,
        reaction: emoji,
      });
    }

    return true;
  };

  const sendTypingSignal = (isTyping: boolean) => {
    if (!currentUser || !activeConversation) return;

    if (isTyping) {
      broadcastRef.current?.postMessage({
        type: 'TYPING',
        payload: {
          conversation_id: activeConversation.id,
          user_id: currentUser.id,
          display_name: currentUser.display_name,
          timestamp: Date.now(),
        },
      });
    }
  };

  const startPrivateChat = async (targetUser: Profile): Promise<Conversation> => {
    if (!currentUser) throw new Error('Not logged in');

    // Check if conversation already exists
    const existing = conversations.find(
      (c) =>
        c.type === 'private' &&
        c.members?.some((m) => m.user_id === targetUser.id)
    );

    if (existing) {
      setActiveConversation(existing);
      return existing;
    }

    const newId = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newConv: Conversation = {
      id: newId,
      type: 'private',
      name: targetUser.display_name,
      avatar_url: targetUser.avatar_url,
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      other_member: targetUser,
      unread_count: 0,
      members: [
        {
          conversation_id: newId,
          user_id: currentUser.id,
          role: 'member',
          joined_at: new Date().toISOString(),
          muted: false,
          archived: false,
          profile: currentUser,
        },
        {
          conversation_id: newId,
          user_id: targetUser.id,
          role: 'member',
          joined_at: new Date().toISOString(),
          muted: false,
          archived: false,
          profile: targetUser,
        },
      ],
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveConversation(newConv);

    try {
      const stored = localStorage.getItem(LOCAL_CONVERSATIONS_KEY);
      const all: Conversation[] = stored ? JSON.parse(stored) : [];
      localStorage.setItem(LOCAL_CONVERSATIONS_KEY, JSON.stringify([newConv, ...all]));
    } catch {
      // ignore
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('conversations').insert({
          id: newId,
          type: 'private',
          created_by: currentUser.id,
        });
        await supabase.from('conversation_members').insert([
          { conversation_id: newId, user_id: currentUser.id, role: 'member' },
          { conversation_id: newId, user_id: targetUser.id, role: 'member' },
        ]);
      } catch (err) {
        console.warn('Supabase new conversation error:', err);
      }
    }

    return newConv;
  };

  const createGroup = async (
    name: string,
    description: string,
    memberIds: string[],
    avatarUrl?: string
  ): Promise<Conversation> => {
    if (!currentUser) throw new Error('Not logged in');

    const newId = `group-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const allMembers = Array.from(new Set([currentUser.id, ...memberIds]));

    const newConv: Conversation = {
      id: newId,
      type: 'group',
      name,
      avatar_url: avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${name}`,
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      unread_count: 0,
      members: allMembers.map((id) => ({
        conversation_id: newId,
        user_id: id,
        role: id === currentUser.id ? 'admin' : 'member',
        joined_at: new Date().toISOString(),
        muted: false,
        archived: false,
      })),
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveConversation(newConv);

    try {
      const stored = localStorage.getItem(LOCAL_CONVERSATIONS_KEY);
      const all: Conversation[] = stored ? JSON.parse(stored) : [];
      localStorage.setItem(LOCAL_CONVERSATIONS_KEY, JSON.stringify([newConv, ...all]));
    } catch {
      // ignore
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('conversations').insert({
          id: newId,
          type: 'group',
          name,
          avatar_url: newConv.avatar_url,
          created_by: currentUser.id,
        });
        await supabase.from('groups').insert({
          conversation_id: newId,
          name,
          description,
          avatar_url: newConv.avatar_url,
          created_by: currentUser.id,
        });
        await supabase.from('conversation_members').insert(
          allMembers.map((id) => ({
            conversation_id: newId,
            user_id: id,
            role: id === currentUser.id ? 'admin' : 'member',
          }))
        );
      } catch (err) {
        console.warn('Supabase group create error:', err);
      }
    }

    return newConv;
  };

  const forwardMessage = async (message: Message, targetConvId: string): Promise<boolean> => {
    const target = conversations.find((c) => c.id === targetConvId);
    if (!target || !currentUser) return false;

    const forwardedMsg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      conversation_id: targetConvId,
      sender_id: currentUser.id,
      message_type: message.message_type,
      text: message.text,
      media_url: message.media_url,
      thumbnail_url: message.thumbnail_url,
      file_name: message.file_name,
      file_size: message.file_size,
      duration: message.duration,
      created_at: new Date().toISOString(),
      sender: currentUser,
      status: 'delivered',
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === targetConvId
          ? { ...c, last_message: forwardedMsg, updated_at: forwardedMsg.created_at }
          : c
      )
    );

    if (activeConversation?.id === targetConvId) {
      setMessages((prev) => [...prev, forwardedMsg]);
    }

    try {
      const stored = localStorage.getItem(LOCAL_MESSAGES_KEY);
      const all: Message[] = stored ? JSON.parse(stored) : [];
      localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify([...all, forwardedMsg]));
    } catch {
      // ignore
    }

    setForwardingMessage(null);
    return true;
  };

  const loadMoreMessages = () => {
    // pagination stub
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        loading,
        messagesLoading,
        typingUsers,
        activeTab,
        setActiveTab,
        selectConversation,
        sendMessage,
        editMessage,
        deleteMessage,
        reactToMessage,
        markConversationAsRead,
        sendTypingSignal,
        startPrivateChat,
        createGroup,
        forwardMessage,
        replyingTo,
        setReplyingTo,
        editingMessage,
        setEditingMessage,
        forwardingMessage,
        setForwardingMessage,
        searchTerm,
        setSearchTerm,
        loadMoreMessages,
        hasMoreMessages,
        refreshConversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
