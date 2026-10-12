import React, { useState } from 'react';
import { Search, Smile, Heart, ThumbsUp, Sparkles, Coffee } from 'lucide-react';

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose?: () => void;
}

const EMOJI_CATEGORIES = [
  {
    id: 'popular',
    name: 'Popular',
    icon: Sparkles,
    emojis: ['👍', '❤️', '😂', '🔥', '🎉', '😍', '👏', '🙏', '✨', '🚀', '💯', '😊', '🙌', '👀', '💡', '🤔', '😎', '👌'],
  },
  {
    id: 'smileys',
    name: 'Smileys',
    icon: Smile,
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥹', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😋', '😜', '🤪', '🤫', '🫢', '🤭', '🥱', '😴', '🤤', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐'],
  },
  {
    id: 'gestures',
    name: 'Gestures',
    icon: ThumbsUp,
    emojis: ['👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤙', '💪'],
  },
  {
    id: 'hearts',
    name: 'Hearts',
    icon: Heart,
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
  },
  {
    id: 'activity',
    name: 'Objects & Food',
    icon: Coffee,
    emojis: ['☕', '🍕', '🍔', '🌮', '🍣', '🎂', '🍷', '🍺', '🍻', '⚽', '🏀', '🎮', '📱', '💻', '📷', '🎧', '✈️', '🚗', '🏝️', '⚡', '⭐', '🌟', '💥'],
  },
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelectEmoji, onClose }) => {
  const [activeTab, setActiveTab] = useState('popular');
  const [search, setSearch] = useState('');

  const currentCategory = EMOJI_CATEGORIES.find((c) => c.id === activeTab) || EMOJI_CATEGORIES[0];

  const allEmojis = EMOJI_CATEGORIES.flatMap((c) => c.emojis);
  const displayedEmojis = search.trim()
    ? allEmojis.filter((e) => e.includes(search))
    : currentCategory.emojis;

  return (
    <div className="w-80 max-w-[90vw] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col p-3 z-50 text-slate-100 animate-in fade-in zoom-in-95 duration-150">
      {/* Search Header */}
      <div className="relative mb-2.5">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
        <input
          type="text"
          placeholder="Search emojis..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          autoFocus
        />
      </div>

      {/* Tabs */}
      {!search && (
        <div className="flex border-b border-slate-800/80 pb-2 mb-2 gap-1 overflow-x-auto no-scrollbar">
          {EMOJI_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`p-1.5 rounded-lg flex items-center justify-center transition cursor-pointer ${
                  activeTab === cat.id
                    ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
                title={cat.name}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="grid grid-cols-6 gap-1.5 max-h-52 overflow-y-auto p-1">
        {displayedEmojis.map((emoji, idx) => (
          <button
            key={`${emoji}-${idx}`}
            onClick={() => {
              onSelectEmoji(emoji);
              onClose?.();
            }}
            className="w-10 h-10 flex items-center justify-center text-xl rounded-xl hover:bg-slate-800/80 active:scale-90 transition cursor-pointer hover:scale-110"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export const QuickReactionPill: React.FC<{
  onReact: (emoji: string) => void;
  onOpenFull?: () => void;
}> = ({ onReact, onOpenFull }) => {
  const quick = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
  return (
    <div className="flex items-center gap-1 bg-slate-900/95 border border-slate-800 rounded-full px-2 py-1 shadow-xl backdrop-blur-md">
      {quick.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onReact(emoji)}
          className="w-7 h-7 flex items-center justify-center text-base hover:scale-125 transition-transform cursor-pointer"
        >
          {emoji}
        </button>
      ))}
      {onOpenFull && (
        <button
          onClick={onOpenFull}
          className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center text-xs ml-1 hover:bg-slate-700 cursor-pointer"
          title="More reactions"
        >
          +
        </button>
      )}
    </div>
  );
};
