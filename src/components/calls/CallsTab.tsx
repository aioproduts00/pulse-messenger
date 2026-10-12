import React from 'react';
import { useCall } from '../../context/CallContext';
import { useAuth } from '../../context/AuthContext';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';
import { Avatar } from '../common/Avatar';

export const CallsTab: React.FC = () => {
  const { callHistory, startCall } = useCall();
  const { availableDemoUsers, currentUser } = useAuth();

  const contacts = availableDemoUsers.filter((u) => u.id !== currentUser?.id);

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-950 overflow-y-auto p-4 max-w-2xl mx-auto select-none">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-white">Call Log</h2>
        <p className="text-xs text-slate-400">P2P Encrypted Audio & Video calls</p>
      </div>

      {/* Start new call contacts shelf */}
      <div className="mb-6">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
          Quick Call
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="p-3 bg-slate-900/70 border border-slate-800 rounded-2xl flex flex-col items-center text-center"
            >
              <Avatar src={contact.avatar_url} name={contact.display_name} size="md" isOnline={contact.is_online} showOnlineStatus />
              <h4 className="text-xs font-bold text-white mt-2 truncate w-full">
                {contact.display_name}
              </h4>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => startCall(contact, 'conv-quick', 'voice')}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-400 transition cursor-pointer"
                  title="Voice Call"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  onClick={() => startCall(contact, 'conv-quick', 'video')}
                  className="p-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white transition cursor-pointer"
                  title="Video Call"
                >
                  <Video className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent call log */}
      <div className="space-y-4">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
          Recent Calls
        </span>

        {callHistory.length > 0 ? (
          <div className="divide-y divide-slate-800/60 bg-slate-900/50 rounded-2xl border border-slate-800/80 overflow-hidden">
            {callHistory.map((call) => {
              const person = call.receiver || call.caller;
              return (
                <div
                  key={call.id}
                  className="flex items-center justify-between p-3.5 hover:bg-slate-800/40 transition"
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={person?.avatar_url} name={person?.display_name} size="md" />
                    <div>
                      <h4 className="text-xs font-bold text-white">{person?.display_name || 'Contact'}</h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        {call.status === 'declined' ? (
                          <PhoneMissed className="w-3.5 h-3.5 text-rose-400" />
                        ) : call.is_outgoing ? (
                          <PhoneOutgoing className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <PhoneIncoming className="w-3.5 h-3.5 text-teal-400" />
                        )}
                        <span>
                          {new Date(call.started_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          •{' '}
                          {new Date(call.started_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {person && (
                      <button
                        onClick={() => startCall(person, call.conversation_id, call.call_type)}
                        className="p-2 rounded-xl hover:bg-slate-800 text-teal-400 transition cursor-pointer"
                      >
                        {call.call_type === 'video' ? (
                          <Video className="w-4 h-4" />
                        ) : (
                          <Phone className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 text-xs text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-900">
            No previous calls recorded.
          </div>
        )}
      </div>
    </div>
  );
};
