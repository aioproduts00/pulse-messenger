import React, { useState } from 'react';
import { Conversation, Profile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { X, Phone, Video, Bell, Image, FileText, UserPlus, Shield, Trash2, ArrowLeft } from 'lucide-react';
import { Avatar } from '../common/Avatar';

interface ConversationDetailsProps {
  conversation: Conversation;
  onClose: () => void;
}

export const ConversationDetails: React.FC<ConversationDetailsProps> = ({ conversation, onClose }) => {
  const { currentUser } = useAuth();
  const { startCall } = useCall();
  const [activeTab, setActiveTab] = useState<'info' | 'media'>('info');

  const isGroup = conversation.type === 'group';
  const otherUser = conversation.other_member;

  return (
    <div className="w-80 lg:w-96 h-full bg-slate-950 border-l border-slate-800/80 flex flex-col shrink-0 text-slate-100 z-30 select-none animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
        <h3 className="text-sm font-bold text-white">
          {isGroup ? 'Group Overview' : 'Contact Details'}
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Profile Card */}
        <div className="flex flex-col items-center text-center">
          <Avatar
            src={conversation.avatar_url}
            name={conversation.name || 'Chat'}
            size="2xl"
            isOnline={otherUser?.is_online}
            showOnlineStatus={!isGroup}
          />
          <h2 className="text-lg font-bold text-white mt-3">{conversation.name}</h2>
          <p className="text-xs text-slate-400">
            {isGroup ? `${conversation.members?.length || 3} members` : otherUser?.phone_number || `@${otherUser?.username}`}
          </p>

          {/* Quick Call Actions */}
          {!isGroup && otherUser && (
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => startCall(otherUser, conversation.id, 'voice')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold transition cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>Audio Call</span>
              </button>
              <button
                onClick={() => startCall(otherUser, conversation.id, 'video')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition cursor-pointer"
              >
                <Video className="w-4 h-4" />
                <span>Video Call</span>
              </button>
            </div>
          )}
        </div>

        {/* About / Description */}
        <div className="p-3 bg-slate-900/70 border border-slate-800/80 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
            {isGroup ? 'Group Description' : 'About'}
          </span>
          <p className="text-xs text-slate-200 leading-relaxed">
            {isGroup
              ? 'PulseFlow engineering synchronization and real-time product testing.'
              : otherUser?.about || 'Available on PulseFlow'}
          </p>
        </div>

        {/* Group Members List */}
        {isGroup && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Participants ({conversation.members?.length || 3})
              </span>
            </div>

            <div className="space-y-1.5">
              {conversation.members?.map((mem) => {
                const isMe = mem.user_id === currentUser?.id;
                return (
                  <div
                    key={mem.user_id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/50"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar src={mem.profile?.avatar_url} name={mem.profile?.display_name} size="sm" />
                      <div>
                        <div className="text-xs font-semibold text-white">
                          {mem.profile?.display_name || 'Member'} {isMe && '(You)'}
                        </div>
                        <div className="text-[10px] text-slate-400">@{mem.profile?.username || 'user'}</div>
                      </div>
                    </div>
                    {mem.role === 'admin' && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Admin
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Media & Docs Tab / Preview */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Shared Media & Links
          </span>
          <div className="grid grid-cols-3 gap-2">
            <div className="aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&auto=format&fit=crop&q=80"
                alt="Shared"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
              <img
                src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&auto=format&fit=crop&q=80"
                alt="Shared"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-500 p-2 text-center text-[10px]">
              <FileText className="w-5 h-5 mb-1 text-teal-400" />
              <span>Specs.pdf</span>
            </div>
          </div>
        </div>

        {/* Privacy & Settings */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <button className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs text-slate-300 hover:bg-slate-900 transition cursor-pointer">
            <span className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-400" />
              Mute Notifications
            </span>
            <input type="checkbox" className="rounded accent-teal-500 cursor-pointer" />
          </button>
        </div>
      </div>
    </div>
  );
};
