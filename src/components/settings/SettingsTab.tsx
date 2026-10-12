import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Database,
  Lock,
  Bell,
  Palette,
  HardDrive,
  LogOut,
  Sparkles,
  Camera,
  Check,
  RefreshCw,
  Download,
} from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { SupabaseConfigModal } from '../common/SupabaseConfigModal';
import { PWAInstallButton } from '../common/PWAInstallButton';

export const SettingsTab: React.FC = () => {
  const { currentUser, updateProfile, logout, isConfigured, availableDemoUsers, switchDemoUser } = useAuth();
  const [displayName, setDisplayName] = useState(currentUser?.display_name || '');
  const [about, setAbout] = useState(currentUser?.about || '');
  const [phone, setPhone] = useState(currentUser?.phone_number || '');
  const [isSaved, setIsSaved] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      display_name: displayName,
      about,
      phone_number: phone,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleRandomizeAvatar = () => {
    const seed = Math.random().toString(36).substring(2, 8);
    const newAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
    updateProfile({ avatar_url: newAvatar });
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-950 overflow-y-auto p-4 max-w-2xl mx-auto select-none space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white">Settings</h2>
        <p className="text-xs text-slate-400">Account, privacy, and system configuration</p>
      </div>

      {/* Profile Card / Editor */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4"
      >
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer" onClick={handleRandomizeAvatar}>
            <Avatar
              src={currentUser?.avatar_url}
              name={currentUser?.display_name}
              size="xl"
            />
            <div
              className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              title="Change Avatar"
            >
              <Camera className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-base font-bold text-white">{currentUser?.display_name}</h3>
            <p className="text-xs text-teal-400 font-mono">@{currentUser?.username}</p>
            <button
              type="button"
              onClick={handleRandomizeAvatar}
              className="text-[11px] text-slate-400 hover:text-white mt-1 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Randomize Avatar</span>
            </button>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">About Status</label>
            <input
              type="text"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          {isSaved && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <Check className="w-4 h-4" />
              Profile updated!
            </span>
          )}
          <button
            type="submit"
            className="ml-auto px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </form>

      {/* Backend & Supabase Configuration */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Supabase PostgreSQL Backend</h4>
              <p className="text-xs text-slate-400">
                {isConfigured
                  ? 'Connected to live Supabase Auth, DB & Realtime'
                  : 'Interactive Sandbox Storage & Synced Broadcast'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowConfigModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold transition cursor-pointer"
          >
            Configure
          </button>
        </div>
      </div>

      {/* PWA Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Progressive Web App (PWA)</h4>
            <p className="text-xs text-slate-400">Install PulseFlow for offline access & push</p>
          </div>
        </div>
        <PWAInstallButton />
      </div>

      {/* Quick Demo Personas Switcher */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-teal-400" />
          Quick Switch Persona (Multi-User Test)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {availableDemoUsers.map((user) => (
            <button
              key={user.id}
              onClick={() => switchDemoUser(user.id)}
              className={`p-2.5 rounded-2xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
                currentUser?.id === user.id
                  ? 'bg-teal-500/20 border-teal-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <Avatar src={user.avatar_url} name={user.display_name} size="sm" />
              <div className="truncate">
                <div className="text-xs font-bold truncate">{user.display_name}</div>
                <div className="text-[10px] text-slate-400 truncate">@{user.username}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="pt-2">
        <button
          onClick={logout}
          className="w-full py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out of PulseFlow</span>
        </button>
      </div>

      <SupabaseConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
      />
    </div>
  );
};
