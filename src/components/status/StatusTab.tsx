import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStatus } from '../../context/StatusContext';
import { Plus, CircleDot, Eye, Sparkles } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { CreateStatusModal } from './CreateStatusModal';
import { StatusView } from './StatusView';

export const StatusTab: React.FC = () => {
  const { currentUser } = useAuth();
  const { myStatuses, recentStatuses, viewedStatuses, openStoryViewer } = useStatus();
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-950 overflow-y-auto p-4 max-w-2xl mx-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            Status Updates
          </h2>
          <p className="text-xs text-slate-400">Disappears automatically after 24 hours</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-950/50 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Status</span>
        </button>
      </div>

      {/* My Status */}
      <div className="mb-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
        <div
          onClick={() => {
            if (myStatuses.length > 0 && currentUser) {
              openStoryViewer(currentUser, myStatuses);
            } else {
              setShowCreateModal(true);
            }
          }}
          className="flex items-center gap-3.5 cursor-pointer flex-1"
        >
          <div className="relative">
            <Avatar
              src={currentUser?.avatar_url}
              name={currentUser?.display_name}
              size="lg"
              hasStatusStory={myStatuses.length > 0}
              hasUnreadStory={false}
            />
            {myStatuses.length === 0 && (
              <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center text-xs font-bold shadow">
                +
              </span>
            )}
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">My Status</h4>
            <p className="text-xs text-slate-400">
              {myStatuses.length > 0
                ? `${myStatuses.length} active updates • Tap to view`
                : 'Tap to add status update'}
            </p>
          </div>
        </div>

        {myStatuses.length > 0 && (
          <span className="text-xs text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-full font-medium border border-teal-500/20">
            Active
          </span>
        )}
      </div>

      {/* Recent Updates */}
      <div className="space-y-4 mb-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Recent Updates ({recentStatuses.length})
        </h3>

        {recentStatuses.length > 0 ? (
          <div className="space-y-1.5">
            {recentStatuses.map(({ user, stories }) => (
              <div
                key={user.id}
                onClick={() => openStoryViewer(user, stories)}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-teal-500/40 transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={user.avatar_url}
                    name={user.display_name}
                    size="md"
                    hasStatusStory
                    hasUnreadStory
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white">{user.display_name}</h4>
                    <p className="text-[11px] text-teal-400">
                      {new Date(stories[0].created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500">Tap to watch</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 text-xs bg-slate-900/30 rounded-2xl border border-slate-900">
            No recent updates from contacts right now.
          </div>
        )}
      </div>

      {/* Viewed Updates */}
      {viewedStatuses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Viewed Updates ({viewedStatuses.length})
          </h3>
          <div className="space-y-1.5 opacity-70">
            {viewedStatuses.map(({ user, stories }) => (
              <div
                key={user.id}
                onClick={() => openStoryViewer(user, stories)}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/40 border border-slate-800 hover:opacity-100 transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={user.avatar_url}
                    name={user.display_name}
                    size="md"
                    hasStatusStory
                    hasUnreadStory={false}
                  />
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">{user.display_name}</h4>
                    <p className="text-[11px] text-slate-500">Viewed</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <CreateStatusModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
      <StatusView />
    </div>
  );
};
