import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { Users, X, Check, Camera } from 'lucide-react';
import { Avatar } from '../common/Avatar';

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewGroupModal: React.FC<NewGroupModalProps> = ({ isOpen, onClose }) => {
  const { availableDemoUsers, currentUser } = useAuth();
  const { createGroup } = useChat();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [avatarSeed, setAvatarSeed] = useState('group');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const contacts = availableDemoUsers.filter((u) => u.id !== currentUser?.id);

  const toggleSelect = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${avatarSeed || name}`;
      await createGroup(name, description, selectedIds, avatarUrl);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Create Group Chat</h2>
              <p className="text-xs text-slate-400">Collaborate with multiple members</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="p-4 space-y-4 overflow-y-auto">
          {/* Group Icon & Name */}
          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer" onClick={() => setAvatarSeed(String(Date.now()))}>
              <Avatar
                src={`https://api.dicebear.com/7.x/identicon/svg?seed=${avatarSeed || name || 'group'}`}
                name={name || 'Group'}
                size="lg"
              />
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <input
                type="text"
                required
                placeholder="Group Subject / Name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 font-semibold"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Description (optional)
            </label>
            <textarea
              placeholder="What is this group about?"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 resize-none"
            />
          </div>

          {/* Members checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Select Members ({selectedIds.length})
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-800 rounded-xl p-2 bg-slate-950/60">
              {contacts.map((user) => {
                const isSelected = selectedIds.includes(user.id);
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleSelect(user.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg transition cursor-pointer text-left ${
                      isSelected ? 'bg-teal-500/20 border border-teal-500/30' : 'hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar src={user.avatar_url} name={user.display_name} size="sm" />
                      <div>
                        <div className="text-xs font-semibold text-white">{user.display_name}</div>
                        <div className="text-[10px] text-slate-400">@{user.username}</div>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition border ${
                        isSelected
                          ? 'bg-teal-500 border-teal-400 text-slate-950'
                          : 'border-slate-700 bg-slate-900'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-950/50 transition cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Creating Group...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
