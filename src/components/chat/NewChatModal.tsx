import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { Search, UserPlus, X, Check } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { Profile } from '../../types';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose }) => {
  const { availableDemoUsers, currentUser } = useAuth();
  const { startPrivateChat } = useChat();
  const [search, setSearch] = useState('');
  const [customUsername, setCustomUsername] = useState('');

  if (!isOpen) return null;

  const contacts = availableDemoUsers.filter((u) => u.id !== currentUser?.id);
  const filtered = contacts.filter(
    (u) =>
      u.display_name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.phone_number?.includes(search)
  );

  const handleSelectUser = async (targetUser: Profile) => {
    await startPrivateChat(targetUser);
    onClose();
  };

  const handleStartCustomUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUsername.trim()) return;

    const newTarget: Profile = {
      id: `user-${Date.now()}`,
      username: customUsername.toLowerCase().replace(/[^a-z0-9_]/g, ''),
      display_name: customUsername,
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${customUsername}`,
      about: 'Available on PulseFlow',
      last_seen: new Date().toISOString(),
      is_online: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await startPrivateChat(newTarget);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">New Private Chat</h2>
              <p className="text-xs text-slate-400">Select or find a contact</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, @username, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
              autoFocus
            />
          </div>
        </div>

        {/* Contact list */}
        <div className="overflow-y-auto p-2 divide-y divide-slate-800/50 flex-1">
          <div className="text-[11px] font-semibold text-slate-400 px-3 py-2 uppercase tracking-wider">
            Available Users
          </div>

          {filtered.length > 0 ? (
            filtered.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/70 transition cursor-pointer group text-left"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={user.avatar_url}
                    name={user.display_name}
                    size="md"
                    isOnline={user.is_online}
                    showOnlineStatus
                  />
                  <div>
                    <h4 className="text-sm font-semibold text-white group-hover:text-teal-400 transition">
                      {user.display_name}
                    </h4>
                    <p className="text-xs text-slate-400 truncate max-w-[200px]">
                      {user.about || `@${user.username}`}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-teal-400 opacity-0 group-hover:opacity-100 transition font-medium">
                  Chat &rarr;
                </span>
              </button>
            ))
          ) : (
            <div className="text-center py-6 text-xs text-slate-500">
              No contacts matching &ldquo;{search}&rdquo;
            </div>
          )}

          {/* Start chat with arbitrary user */}
          <form onSubmit={handleStartCustomUser} className="p-3 mt-2 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Start chat with new username
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Satoshi"
                value={customUsername}
                onChange={(e) => setCustomUsername(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
              />
              <button
                type="submit"
                disabled={!customUsername.trim()}
                className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold disabled:opacity-50 transition cursor-pointer"
              >
                Start
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
