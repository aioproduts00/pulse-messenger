import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import {
  MessageSquare,
  CircleDot,
  Phone,
  Users,
  Settings,
  Plus,
  Search,
  CheckCheck,
  Check,
  Database,
  UserPlus,
  UsersRound,
} from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { NewChatModal } from './NewChatModal';
import { NewGroupModal } from './NewGroupModal';
import { SupabaseConfigModal } from '../common/SupabaseConfigModal';

export const Sidebar: React.FC = () => {
  const { currentUser, isConfigured } = useAuth();
  const {
    conversations,
    activeConversation,
    selectConversation,
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
  } = useChat();

  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    if (!searchTerm.trim()) return true;
    const nameMatch = c.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const lastMsgMatch = c.last_message?.text?.toLowerCase().includes(searchTerm.toLowerCase());
    return nameMatch || lastMsgMatch;
  });

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const isThisWeek = now.getTime() - date.getTime() < 86400000 * 7;
    if (isThisWeek) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="h-full flex flex-row bg-slate-950 border-r border-slate-800/80 shrink-0 w-full md:w-96 lg:w-[410px] select-none">
      {/* Mini Icon Rail on Desktop */}
      <div className="hidden sm:flex flex-col items-center justify-between py-4 px-2 w-16 bg-slate-950 border-r border-slate-900 shrink-0">
        <div className="flex flex-col items-center gap-5">
          {/* Logo */}
          <div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-slate-950 shadow-lg shadow-teal-950/50 cursor-pointer"
            title="PulseFlow Messenger"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l5.12-1.34C8.54 21.49 10.22 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/>
            </svg>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-2 mt-2">
            <button
              onClick={() => setActiveTab('chats')}
              className={`p-2.5 rounded-xl transition cursor-pointer relative ${
                activeTab === 'chats'
                  ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
              title="Chats"
            >
              <MessageSquare className="w-5 h-5" />
              {conversations.some((c) => (c.unread_count || 0) > 0) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-400" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('status')}
              className={`p-2.5 rounded-xl transition cursor-pointer ${
                activeTab === 'status'
                  ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
              title="Status Updates"
            >
              <CircleDot className="w-5 h-5" />
            </button>

            <button
              onClick={() => setActiveTab('calls')}
              className={`p-2.5 rounded-xl transition cursor-pointer ${
                activeTab === 'calls'
                  ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
              title="Calls"
            >
              <Phone className="w-5 h-5" />
            </button>

            <button
              onClick={() => setActiveTab('contacts')}
              className={`p-2.5 rounded-xl transition cursor-pointer ${
                activeTab === 'contacts'
                  ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
              title="Contacts"
            >
              <Users className="w-5 h-5" />
            </button>
          </nav>
        </div>

        <div className="flex flex-col items-center gap-3">
          {/* Supabase status indicator */}
          <button
            onClick={() => setShowConfig(true)}
            className={`p-2 rounded-xl transition cursor-pointer ${
              isConfigured
                ? 'text-emerald-400 hover:bg-emerald-950/40'
                : 'text-slate-500 hover:text-teal-400 hover:bg-slate-900'
            }`}
            title={isConfigured ? 'Supabase Connected' : 'Supabase Config & Schema'}
          >
            <Database className="w-5 h-5" />
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`p-2.5 rounded-xl transition cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* User profile avatar in rail */}
          <button
            onClick={() => setActiveTab('settings')}
            className="cursor-pointer transition hover:scale-105"
            title={currentUser?.display_name}
          >
            <Avatar
              src={currentUser?.avatar_url}
              name={currentUser?.display_name}
              size="sm"
              isOnline={currentUser?.is_online}
              showOnlineStatus
            />
          </button>
        </div>
      </div>

      {/* Main Sidebar Panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
        {/* Header */}
        <div className="p-3.5 pb-2 border-b border-slate-800/80 bg-slate-950">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white">
                PulseFlow
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                PRO
              </span>
            </div>

            <div className="flex items-center gap-1.5 relative">
              <PWAInstallButton compact />

              {/* Plus Menu Toggle */}
              <button
                onClick={() => setShowPlusMenu(!showPlusMenu)}
                className="w-8 h-8 rounded-xl bg-teal-600 hover:bg-teal-500 text-white flex items-center justify-center transition shadow-md shadow-teal-950/40 cursor-pointer"
                title="New Chat or Group"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>

              {/* Plus Dropdown */}
              {showPlusMenu && (
                <div
                  className="absolute right-0 top-10 w-44 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-1.5 z-40 text-xs text-slate-200 animate-in fade-in duration-150"
                  onClick={() => setShowPlusMenu(false)}
                >
                  <button
                    onClick={() => setShowNewChat(true)}
                    className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-slate-800 transition cursor-pointer text-left"
                  >
                    <UserPlus className="w-4 h-4 text-teal-400" />
                    <span>New Direct Chat</span>
                  </button>
                  <button
                    onClick={() => setShowNewGroup(true)}
                    className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-slate-800 transition cursor-pointer text-left"
                  >
                    <UsersRound className="w-4 h-4 text-cyan-400" />
                    <span>New Group Chat</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search or start new chat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800/90 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-900/60 p-1.5 space-y-0.5">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const isActive = activeConversation?.id === conv.id;
              const hasUnread = (conv.unread_count || 0) > 0;
              const isSentByMe = conv.last_message?.sender_id === currentUser?.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={`flex items-center gap-3 p-2.5 rounded-2xl transition cursor-pointer relative group ${
                    isActive
                      ? 'bg-slate-800/90 shadow-md'
                      : 'hover:bg-slate-900/80'
                  }`}
                >
                  <Avatar
                    src={conv.avatar_url}
                    name={conv.name || 'Conversation'}
                    size="md"
                    isOnline={conv.type === 'private' ? conv.other_member?.is_online : false}
                    showOnlineStatus={conv.type === 'private'}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3
                        className={`text-xs font-bold truncate ${
                          hasUnread ? 'text-white' : 'text-slate-200'
                        }`}
                      >
                        {conv.name}
                      </h3>
                      <span
                        className={`text-[10px] shrink-0 font-medium ${
                          hasUnread ? 'text-teal-400 font-semibold' : 'text-slate-500'
                        }`}
                      >
                        {formatTimestamp(conv.last_message?.created_at || conv.updated_at)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 min-w-0">
                        {isSentByMe && (
                          <span className="shrink-0 inline-flex">
                            {conv.last_message?.status === 'read' ? (
                              <CheckCheck className="w-3.5 h-3.5 text-teal-400" />
                            ) : conv.last_message?.status === 'delivered' ? (
                              <CheckCheck className="w-3.5 h-3.5 text-slate-500" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-slate-500" />
                            )}
                          </span>
                        )}
                        <span className="truncate">
                          {conv.last_message?.text ||
                            (conv.last_message?.message_type ? `[${conv.last_message.message_type}]` : 'Tap to start chatting')}
                        </span>
                      </p>

                      {hasUnread && (
                        <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-teal-500 text-slate-950 min-w-4 text-center">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 px-4 text-slate-500 text-xs">
              <p>No conversations found.</p>
              <button
                onClick={() => setShowNewChat(true)}
                className="mt-3 text-xs text-teal-400 hover:underline font-semibold"
              >
                + Start a new conversation
              </button>
            </div>
          )}
        </div>
      </div>

      <NewChatModal isOpen={showNewChat} onClose={() => setShowNewChat(false)} />
      <NewGroupModal isOpen={showNewGroup} onClose={() => setShowNewGroup(false)} />
      <SupabaseConfigModal isOpen={showConfig} onClose={() => setShowConfig(false)} />
    </div>
  );
};
