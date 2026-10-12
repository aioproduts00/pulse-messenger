import React from 'react';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isOnline?: boolean;
  showOnlineStatus?: boolean;
  hasStatusStory?: boolean;
  hasUnreadStory?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = 'User',
  size = 'md',
  isOnline = false,
  showOnlineStatus = false,
  hasStatusStory = false,
  hasUnreadStory = false,
  className = '',
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-24 h-24 text-3xl',
  };

  const statusDotSizes = {
    xs: 'w-1.5 h-1.5 bottom-0 right-0',
    sm: 'w-2 h-2 bottom-0 right-0',
    md: 'w-2.5 h-2.5 bottom-0.5 right-0.5',
    lg: 'w-3 h-3 bottom-0.5 right-0.5',
    xl: 'w-3.5 h-3.5 bottom-1 right-1',
    '2xl': 'w-5 h-5 bottom-1.5 right-1.5',
  };

  const initials = (name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

  // Hash name to generate consistent avatar background
  const colors = [
    'from-teal-600 to-emerald-700',
    'from-cyan-600 to-blue-700',
    'from-indigo-600 to-violet-700',
    'from-fuchsia-600 to-rose-700',
    'from-amber-600 to-orange-700',
    'from-emerald-600 to-teal-800',
  ];
  const charCodeSum = (name || 'A').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const colorClass = colors[charCodeSum % colors.length];

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      {/* Story Ring if active */}
      <div
        className={`rounded-full p-0.5 transition-all ${
          hasStatusStory
            ? hasUnreadStory
              ? 'bg-gradient-to-tr from-teal-400 via-emerald-400 to-cyan-400 animate-pulse'
              : 'border-2 border-slate-600'
            : ''
        }`}
      >
        <div
          className={`${sizeClasses[size]} rounded-full overflow-hidden flex items-center justify-center font-bold text-white bg-slate-800 shadow-inner select-none relative`}
        >
          {src ? (
            <img
              src={src}
              alt={name || 'Avatar'}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // fallback to initials on error
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : null}
          <div
            className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${colorClass} ${
              src ? '-z-10 absolute inset-0' : ''
            }`}
          >
            <span>{initials || 'U'}</span>
          </div>
        </div>
      </div>

      {/* Online indicator */}
      {showOnlineStatus && (
        <span
          className={`absolute ${statusDotSizes[size]} rounded-full border-2 border-slate-950 ring-1 ring-slate-900 ${
            isOnline ? 'bg-emerald-400' : 'bg-slate-500'
          }`}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};
