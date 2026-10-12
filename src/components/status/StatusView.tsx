import React, { useState, useEffect } from 'react';
import { useStatus } from '../../context/StatusContext';
import { X, ChevronLeft, ChevronRight, Eye, Send } from 'lucide-react';
import { Avatar } from '../common/Avatar';

export const StatusView: React.FC = () => {
  const { activeStoryGroup, closeStoryViewer, markStatusAsViewed } = useStatus();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (activeStoryGroup) {
      setCurrentIndex(activeStoryGroup.initialIndex || 0);
      setProgress(0);
    }
  }, [activeStoryGroup]);

  // Mark viewed on load
  useEffect(() => {
    if (activeStoryGroup && activeStoryGroup.stories[currentIndex]) {
      markStatusAsViewed(activeStoryGroup.stories[currentIndex].id);
    }
  }, [activeStoryGroup, currentIndex, markStatusAsViewed]);

  // Auto-progress timer
  useEffect(() => {
    if (!activeStoryGroup) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Advance to next story
          if (currentIndex < activeStoryGroup.stories.length - 1) {
            setCurrentIndex((c) => c + 1);
            return 0;
          } else {
            closeStoryViewer();
            return 100;
          }
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [activeStoryGroup, currentIndex, closeStoryViewer]);

  if (!activeStoryGroup) return null;

  const currentStory = activeStoryGroup.stories[currentIndex];
  if (!currentStory) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex((c) => c - 1);
      setProgress(0);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < activeStoryGroup.stories.length - 1) {
      setCurrentIndex((c) => c + 1);
      setProgress(0);
    } else {
      closeStoryViewer();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-md h-full sm:h-[90vh] sm:rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 flex flex-col justify-between shadow-2xl">
        {/* Progress bars */}
        <div className="absolute top-3 inset-x-3 z-30 flex gap-1.5">
          {activeStoryGroup.stories.map((s, idx) => (
            <div
              key={s.id}
              className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                style={{
                  width:
                    idx < currentIndex
                      ? '100%'
                      : idx === currentIndex
                      ? `${progress}%`
                      : '0%',
                }}
                className="h-full bg-white transition-all duration-75"
              />
            </div>
          ))}
        </div>

        {/* Story Header */}
        <div className="absolute top-6 inset-x-3 z-30 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <Avatar
              src={activeStoryGroup.user.avatar_url}
              name={activeStoryGroup.user.display_name}
              size="sm"
            />
            <div>
              <h4 className="text-xs font-bold leading-tight">
                {activeStoryGroup.user.display_name}
              </h4>
              <span className="text-[10px] text-white/70">
                {new Date(currentStory.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
          <button
            onClick={closeStoryViewer}
            className="p-1 rounded-full bg-black/40 hover:bg-black/70 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tap area left & right */}
        <div className="absolute inset-0 z-10 flex">
          <div onClick={handlePrev} className="w-1/3 h-full cursor-pointer" />
          <div onClick={handleNext} className="w-2/3 h-full cursor-pointer" />
        </div>

        {/* Content Display */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          {currentStory.type === 'text' ? (
            <div
              style={{ backgroundColor: currentStory.background_color || '#0d9488' }}
              className="w-full h-full flex items-center justify-center p-8 text-center"
            >
              <p className="text-xl sm:text-2xl font-extrabold text-white leading-relaxed drop-shadow-md">
                {currentStory.content}
              </p>
            </div>
          ) : (
            <div className="w-full h-full bg-black flex flex-col justify-center items-center relative">
              <img
                src={currentStory.media_url || ''}
                alt="Story content"
                className="w-full h-full object-contain"
              />
              {currentStory.caption && (
                <div className="absolute bottom-16 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 text-center z-20">
                  <p className="text-sm font-semibold text-white drop-shadow">
                    {currentStory.caption}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="p-3 bg-gradient-to-t from-black/90 to-transparent z-30 flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-1.5 text-white/70">
            <Eye className="w-4 h-4" />
            <span>{currentStory.views_count || 1} views</span>
          </div>
          <button
            onClick={closeStoryViewer}
            className="px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-semibold hover:bg-white/30"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
