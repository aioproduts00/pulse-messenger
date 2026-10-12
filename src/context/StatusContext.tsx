import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StatusStory, StatusView, Profile } from '../types';
import { useAuth, SEED_PROFILES } from './AuthContext';
import { getSupabaseClient } from '../lib/supabase';

interface StatusContextType {
  myStatuses: StatusStory[];
  recentStatuses: { user: Profile; stories: StatusStory[] }[];
  viewedStatuses: { user: Profile; stories: StatusStory[] }[];
  activeStoryGroup: { user: Profile; stories: StatusStory[]; initialIndex: number } | null;
  openStoryViewer: (user: Profile, stories: StatusStory[], index?: number) => void;
  closeStoryViewer: () => void;
  createStatus: (options: {
    type: 'text' | 'image' | 'video';
    content?: string;
    media_url?: string;
    caption?: string;
    background_color?: string;
  }) => Promise<StatusStory>;
  markStatusAsViewed: (statusId: string) => Promise<void>;
  getStatusViews: (statusId: string) => Promise<StatusView[]>;
}

const StatusContext = createContext<StatusContextType | undefined>(undefined);

const LOCAL_STATUSES_KEY = 'pulseflow_statuses_v2';
const LOCAL_VIEWS_KEY = 'pulseflow_status_views_v2';

export const StatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [allStatuses, setAllStatuses] = useState<StatusStory[]>([]);
  const [views, setViews] = useState<StatusView[]>([]);
  const [activeStoryGroup, setActiveStoryGroup] = useState<{
    user: Profile;
    stories: StatusStory[];
    initialIndex: number;
  } | null>(null);

  // Initialize seed statuses
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STATUSES_KEY);
      const storedViews = localStorage.getItem(LOCAL_VIEWS_KEY);

      if (stored) {
        setAllStatuses(JSON.parse(stored));
      } else {
        const seedStories: StatusStory[] = [
          {
            id: 'status-elena-1',
            user_id: SEED_PROFILES[1].id,
            type: 'image',
            media_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
            caption: 'Morning views from Tokyo 🌸 Running latency benchmarks today.',
            created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
            expires_at: new Date(Date.now() + 3600000 * 20).toISOString(),
            user: SEED_PROFILES[1],
            views_count: 5,
          },
          {
            id: 'status-marcus-1',
            user_id: SEED_PROFILES[2].id,
            type: 'text',
            content: 'WebRTC P2P direct socket channels working with 18ms ping! 🚀',
            background_color: '#0f766e',
            created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
            expires_at: new Date(Date.now() + 3600000 * 16).toISOString(),
            user: SEED_PROFILES[2],
            views_count: 8,
          },
        ];
        setAllStatuses(seedStories);
        localStorage.setItem(LOCAL_STATUSES_KEY, JSON.stringify(seedStories));
      }

      if (storedViews) {
        setViews(JSON.parse(storedViews));
      }
    } catch {
      // ignore
    }
  }, []);

  // Filter non-expired statuses
  const validStatuses = allStatuses.filter(
    (s) => new Date(s.expires_at).getTime() > Date.now()
  );

  const myStatuses = currentUser
    ? validStatuses.filter((s) => s.user_id === currentUser.id)
    : [];

  const otherStatuses = currentUser
    ? validStatuses.filter((s) => s.user_id !== currentUser.id)
    : validStatuses;

  // Group by user
  const userMap = new Map<string, { user: Profile; stories: StatusStory[] }>();
  otherStatuses.forEach((st) => {
    const user = st.user || SEED_PROFILES.find((p) => p.id === st.user_id);
    if (!user) return;
    if (!userMap.has(user.id)) {
      userMap.set(user.id, { user, stories: [] });
    }
    userMap.get(user.id)!.stories.push(st);
  });

  const recentStatuses: { user: Profile; stories: StatusStory[] }[] = [];
  const viewedStatuses: { user: Profile; stories: StatusStory[] }[] = [];

  userMap.forEach((entry) => {
    const hasUnviewed = entry.stories.some((s) => !views.some((v) => v.status_id === s.id && v.viewer_id === currentUser?.id));
    if (hasUnviewed) {
      recentStatuses.push(entry);
    } else {
      viewedStatuses.push(entry);
    }
  });

  const openStoryViewer = (user: Profile, stories: StatusStory[], index = 0) => {
    setActiveStoryGroup({ user, stories, initialIndex: index });
  };

  const closeStoryViewer = () => {
    setActiveStoryGroup(null);
  };

  const createStatus = async (options: {
    type: 'text' | 'image' | 'video';
    content?: string;
    media_url?: string;
    caption?: string;
    background_color?: string;
  }): Promise<StatusStory> => {
    if (!currentUser) throw new Error('Not authenticated');

    const newStory: StatusStory = {
      id: `status-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: currentUser.id,
      type: options.type,
      content: options.content || null,
      media_url: options.media_url || null,
      caption: options.caption || null,
      background_color: options.background_color || '#0d9488',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      user: currentUser,
      views_count: 0,
    };

    setAllStatuses((prev) => {
      const updated = [newStory, ...prev];
      try {
        localStorage.setItem(LOCAL_STATUSES_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('statuses').insert({
          id: newStory.id,
          user_id: newStory.user_id,
          type: newStory.type,
          content: newStory.content,
          media_url: newStory.media_url,
          caption: newStory.caption,
          background_color: newStory.background_color,
          created_at: newStory.created_at,
          expires_at: newStory.expires_at,
        });
      } catch (err) {
        console.warn('Failed to insert status to Supabase:', err);
      }
    }

    return newStory;
  };

  const markStatusAsViewed = useCallback(async (statusId: string) => {
    if (!currentUser) return;
    if (views.some((v) => v.status_id === statusId && v.viewer_id === currentUser.id)) return;

    const newView: StatusView = {
      id: `view-${Date.now()}`,
      status_id: statusId,
      viewer_id: currentUser.id,
      viewed_at: new Date().toISOString(),
      viewer: currentUser,
    };

    setViews((prev) => {
      const updated = [...prev, newView];
      try {
        localStorage.setItem(LOCAL_VIEWS_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('status_views').upsert({
          status_id: statusId,
          viewer_id: currentUser.id,
        });
      } catch {
        // ignore
      }
    }
  }, [currentUser, views]);

  const getStatusViews = async (statusId: string): Promise<StatusView[]> => {
    return views.filter((v) => v.status_id === statusId);
  };

  return (
    <StatusContext.Provider
      value={{
        myStatuses,
        recentStatuses,
        viewedStatuses,
        activeStoryGroup,
        openStoryViewer,
        closeStoryViewer,
        createStatus,
        markStatusAsViewed,
        getStatusViews,
      }}
    >
      {children}
    </StatusContext.Provider>
  );
};

export function useStatus() {
  const context = useContext(StatusContext);
  if (!context) {
    throw new Error('useStatus must be used within a StatusProvider');
  }
  return context;
}
