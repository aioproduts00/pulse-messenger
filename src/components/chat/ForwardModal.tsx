import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { Forward, X, Send } from 'lucide-react';
import { Avatar } from '../common/Avatar';

export const ForwardModal: React.FC = () => {
  const { forwardingMessage, setForwardingMessage, conversations, forwardMessage } = useChat();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  if (!forwardingMessage) return null;

  const handleForward = async () => {
    if (!selectedConvId) return;
    setSending(true);
    await forwardMessage(forwardingMessage, selectedConvId);
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Forward className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Forward Message</h2>
              <p className="text-xs text-slate-400">Choose destination conversation</p>
            </div>
          </div>
          <button
            onClick={() => setForwardingMessage(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message preview preview */}
        <div className="p-3 bg-slate-950/70 border-b border-slate-800 text-xs text-slate-300">
          <span className="text-[10px] text-teal-400 font-semibold block uppercase">Forwarding:</span>
          <p className="truncate italic mt-0.5 text-slate-200">
            {forwardingMessage.text || `[${forwardingMessage.message_type}]`}
          </p>
        </div>

        {/* Conversation list */}
        <div className="p-2 overflow-y-auto space-y-1 flex-1">
          {conversations.map((conv) => {
            const isSelected = selectedConvId === conv.id;
            return (
              <button
                key={conv.id}
                onClick={() => setSelectedConvId(conv.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl transition cursor-pointer text-left ${
                  isSelected
                    ? 'bg-teal-500/20 border border-teal-500/30'
                    : 'hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar src={conv.avatar_url} name={conv.name || 'Chat'} size="md" />
                  <div>
                    <h4 className="text-xs font-bold text-white">{conv.name}</h4>
                    <p className="text-[11px] text-slate-400">{conv.type === 'group' ? 'Group' : 'Direct Message'}</p>
                  </div>
                </div>
                {isSelected && (
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-sm shadow-teal-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="p-3 border-t border-slate-800 flex items-center justify-end gap-2 bg-slate-950/40">
          <button
            onClick={() => setForwardingMessage(null)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            disabled={!selectedConvId || sending}
            onClick={handleForward}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-950/50 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{sending ? 'Forwarding...' : 'Forward'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
