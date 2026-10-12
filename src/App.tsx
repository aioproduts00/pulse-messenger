/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider, useChat } from './context/ChatContext';
import { StatusProvider } from './context/StatusContext';
import { CallProvider } from './context/CallContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { Sidebar } from './components/chat/Sidebar';
import { ChatArea } from './components/chat/ChatArea';
import { StatusTab } from './components/status/StatusTab';
import { CallsTab } from './components/calls/CallsTab';
import { ContactsTab } from './components/contacts/ContactsTab';
import { SettingsTab } from './components/settings/SettingsTab';
import { CallOverlay } from './components/calls/CallOverlay';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { MessageSquare, CircleDot, Phone, Users, Settings } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const { activeConversation, selectConversation, activeTab, setActiveTab } = useChat();

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 select-none">
        <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center mb-4 shadow-xl shadow-teal-950/60 animate-pulse">
          <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l5.12-1.34C8.54 21.49 10.22 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/>
          </svg>
        </div>
        <p className="text-xs font-semibold text-slate-400">Launching PulseFlow...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-950 text-slate-100 font-sans">
      <div className="flex-1 flex overflow-hidden relative">
        {/* DESKTOP VIEW & MOBILE ADAPTIVE VIEW */}
        {/* Sidebar: always rendered on desktop. On mobile, visible when no active chat is opened or when in chats tab */}
        <div
          className={`${
            activeConversation ? 'hidden md:flex' : 'flex'
          } h-full w-full md:w-auto shrink-0`}
        >
          <Sidebar />
        </div>

        {/* Content Area */}
        <main className="flex-1 h-full overflow-hidden flex flex-col">
          {activeTab === 'chats' && (
            <div className={`h-full w-full ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
              <ChatArea onBackToChats={() => selectConversation(null)} />
            </div>
          )}

          {activeTab === 'status' && <StatusTab />}
          {activeTab === 'calls' && <CallsTab />}
          {activeTab === 'contacts' && <ContactsTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR (Visible when in root screens without active conversation) */}
      {!activeConversation && (
        <nav className="sm:hidden h-14 bg-slate-950 border-t border-slate-900 flex items-center justify-around px-2 z-30 shrink-0 pb-safe">
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex flex-col items-center gap-0.5 p-1 transition ${
              activeTab === 'chats' ? 'text-teal-400' : 'text-slate-500'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] font-medium">Chats</span>
          </button>

          <button
            onClick={() => setActiveTab('status')}
            className={`flex flex-col items-center gap-0.5 p-1 transition ${
              activeTab === 'status' ? 'text-teal-400' : 'text-slate-500'
            }`}
          >
            <CircleDot className="w-5 h-5" />
            <span className="text-[10px] font-medium">Status</span>
          </button>

          <button
            onClick={() => setActiveTab('calls')}
            className={`flex flex-col items-center gap-0.5 p-1 transition ${
              activeTab === 'calls' ? 'text-teal-400' : 'text-slate-500'
            }`}
          >
            <Phone className="w-5 h-5" />
            <span className="text-[10px] font-medium">Calls</span>
          </button>

          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex flex-col items-center gap-0.5 p-1 transition ${
              activeTab === 'contacts' ? 'text-teal-400' : 'text-slate-500'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-medium">Contacts</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-0.5 p-1 transition ${
              activeTab === 'settings' ? 'text-teal-400' : 'text-slate-500'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </nav>
      )}

      {/* Global Overlays */}
      <CallOverlay />
      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <StatusProvider>
          <CallProvider>
            <MainLayout />
          </CallProvider>
        </StatusProvider>
      </ChatProvider>
    </AuthProvider>
  );
}
