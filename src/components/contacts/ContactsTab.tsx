import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { Users, UserPlus, MessageSquare, Phone, Video, Search } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { Profile } from '../../types';

export const ContactsTab: React.FC = () => {
  const { availableDemoUsers, currentUser } = useAuth();
  const { startPrivateChat, setActiveTab } = useChat();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNickname, setNewNickname] = useState('');

  const contacts = availableDemoUsers.filter((u) => u.id !== currentUser?.id);
  const filtered = contacts.filter(
    (c) =>
      c.display_name.toLowerCase().includes(search.toLowerCase()) ||
      c.username.toLowerCase().includes(search.toLowerCase()) ||
      c.phone_number?.includes(search)
  );

  const handleStartChat = async (target: Profile) => {
    await startPrivateChat(target);
    setActiveTab('chats');
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-950 overflow-y-auto p-4 max-w-2xl mx-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Contacts</h2>
          <p className="text-xs text-slate-400">Manage address book and connect</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-950/50 transition cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Contact</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
        <input
          type="text"
          placeholder="Filter contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
        />
      </div>

      {/* Contact cards */}
      <div className="space-y-2">
        {filtered.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-teal-500/30 transition group"
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
                <h4 className="text-xs font-bold text-white group-hover:text-teal-300 transition">
                  {user.display_name}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {user.phone_number || `@${user.username}`}
                </p>
                <p className="text-[10px] text-slate-500 truncate max-w-xs mt-0.5">
                  {user.about}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStartChat(user)}
                className="p-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                title="Message"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Message</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5 text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Add New Contact</h3>
            <p className="text-xs text-slate-400 mb-4">Enter a username or phone number</p>

            <input
              type="text"
              placeholder="Display Name or @username"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 mb-4"
              autoFocus
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={!newNickname.trim()}
                onClick={() => {
                  const newContact: Profile = {
                    id: `user-${Date.now()}`,
                    username: newNickname.toLowerCase().replace(/\s+/g, '_'),
                    display_name: newNickname,
                    avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${newNickname}`,
                    about: 'Recently added contact',
                    last_seen: new Date().toISOString(),
                    is_online: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  };
                  handleStartChat(newContact);
                  setShowAddModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition disabled:opacity-50"
              >
                Add & Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
