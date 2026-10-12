import React, { useState } from 'react';
import { useStatus } from '../../context/StatusContext';
import { X, Image as ImageIcon, Sparkles, Send } from 'lucide-react';
import { uploadMediaFile } from '../../lib/storage';

interface CreateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BG_GRADIENTS = [
  '#0d9488', // teal
  '#0f766e', // deep teal
  '#0369a1', // cyan/sky
  '#4338ca', // indigo
  '#7c3aed', // purple
  '#be185d', // pink
  '#b45309', // amber
  '#1e293b', // slate
];

export const CreateStatusModal: React.FC<CreateStatusModalProps> = ({ isOpen, onClose }) => {
  const { createStatus } = useStatus();
  const [type, setType] = useState<'text' | 'media'>('text');
  const [content, setContent] = useState('');
  const [selectedBg, setSelectedBg] = useState(BG_GRADIENTS[0]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    const url = URL.createObjectURL(file);
    setMediaPreview(url);
    setType('media');
  };

  const handlePublish = async () => {
    setLoading(true);
    try {
      if (type === 'media' && mediaFile) {
        const uploadRes = await uploadMediaFile(mediaFile, 'status-media');
        await createStatus({
          type: mediaFile.type.startsWith('video') ? 'video' : 'image',
          media_url: uploadRes.url,
          caption: caption.trim() || undefined,
        });
      } else {
        if (!content.trim()) return;
        await createStatus({
          type: 'text',
          content: content.trim(),
          background_color: selectedBg,
        });
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 text-slate-100">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
            <h3 className="text-sm font-bold text-white">Create 24h Status Story</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {type === 'text' ? (
            <div className="space-y-4">
              <div
                style={{ backgroundColor: selectedBg }}
                className="w-full aspect-4/3 rounded-2xl p-6 flex items-center justify-center text-center shadow-inner relative transition-colors"
              >
                <textarea
                  rows={4}
                  placeholder="Type a status update..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-transparent text-white font-bold text-lg sm:text-xl placeholder:text-white/60 text-center focus:outline-none resize-none leading-relaxed"
                  autoFocus
                />
              </div>

              {/* Color picker */}
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-2">
                  Select Theme Color
                </span>
                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {BG_GRADIENTS.map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setSelectedBg(bg)}
                      style={{ backgroundColor: bg }}
                      className={`w-7 h-7 rounded-full shrink-0 border-2 transition cursor-pointer ${
                        selectedBg === bg ? 'border-white scale-110' : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-full aspect-4/3 rounded-2xl overflow-hidden bg-black flex items-center justify-center relative">
                {mediaPreview && (
                  <img
                    src={mediaPreview}
                    alt="Status preview"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              <input
                type="text"
                placeholder="Add a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          )}

          {/* Switch to media */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <label className="flex items-center gap-2 text-xs text-teal-400 hover:text-teal-300 font-medium cursor-pointer">
              <ImageIcon className="w-4 h-4" />
              <span>{type === 'media' ? 'Choose Different Image' : 'Upload Photo/Video'}</span>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaSelect}
                className="hidden"
              />
            </label>

            {type === 'media' && (
              <button
                type="button"
                onClick={() => {
                  setType('text');
                  setMediaFile(null);
                  setMediaPreview(null);
                }}
                className="text-xs text-slate-400 hover:text-white"
              >
                Switch to Text
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            disabled={loading || (type === 'text' && !content.trim()) || (type === 'media' && !mediaFile)}
            onClick={handlePublish}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-950/50 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{loading ? 'Posting...' : 'Share Status'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
