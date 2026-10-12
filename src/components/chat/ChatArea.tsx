import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useCall } from '../../context/CallContext';
import { Message, MessageType } from '../../types';
import {
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Send,
  X,
  Reply,
  Edit2,
  Trash2,
  Forward,
  Copy,
  Check,
  CheckCheck,
  Play,
  Pause,
  FileText,
  Download,
  Square,
  Image as ImageIcon,
  Camera,
  Film,
  Info,
  ChevronDown,
} from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { EmojiPicker, QuickReactionPill } from '../common/EmojiPicker';
import { uploadMediaFile, AudioRecorder } from '../../lib/storage';
import { ConversationDetails } from './ConversationDetails';
import { ForwardModal } from './ForwardModal';

export const ChatArea: React.FC<{ onBackToChats?: () => void }> = ({ onBackToChats }) => {
  const { currentUser } = useAuth();
  const {
    activeConversation,
    messages,
    sendMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    typingUsers,
    sendTypingSignal,
    replyingTo,
    setReplyingTo,
    editingMessage,
    setEditingMessage,
    setForwardingMessage,
  } = useChat();
  const { startCall } = useCall();

  const [inputVal, setInputVal] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [activeMediaModal, setActiveMediaModal] = useState<string | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [reactionPopoverId, setReactionPopoverId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const recordingTimerRef = useRef<number | null>(null);

  // Audio playback state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const audioElementsRef = useRef<{ [key: string]: HTMLAudioElement }>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync editing text
  useEffect(() => {
    if (editingMessage) {
      setInputVal(editingMessage.text || '');
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  // Autoscroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, activeConversation?.id]);

  if (!activeConversation) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center p-6 text-center bg-slate-950 chat-pattern text-slate-400 select-none">
        <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-teal-400 mb-4 shadow-xl">
          <svg className="w-10 h-10 fill-current opacity-80" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l5.12-1.34C8.54 21.49 10.22 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">PulseFlow Messenger</h2>
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
          Select a chat from the sidebar to start instant real-time messaging, crystal-clear voice/video calls, and end-to-end encrypted sharing.
        </p>
      </div>
    );
  }

  const isGroup = activeConversation.type === 'group';
  const otherUser = activeConversation.other_member;

  // Handle typing debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputVal(e.target.value);
    sendTypingSignal(true);
  };

  const handleSend = async () => {
    if (!inputVal.trim()) return;

    if (editingMessage) {
      await editMessage(editingMessage.id, inputVal.trim());
      setInputVal('');
      setEditingMessage(null);
      return;
    }

    await sendMessage({
      text: inputVal.trim(),
      message_type: 'text',
      reply_to_message_id: replyingTo?.id,
    });

    setInputVal('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // File / Media attachments
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let msgType: MessageType = 'document';
    if (file.type.startsWith('image/')) msgType = 'image';
    else if (file.type.startsWith('video/')) msgType = 'video';
    else if (file.type.startsWith('audio/')) msgType = 'audio';

    try {
      const uploadRes = await uploadMediaFile(file, 'chat-attachments');
      await sendMessage({
        message_type: msgType,
        media_url: uploadRes.url,
        file_name: uploadRes.name,
        file_size: uploadRes.size,
        reply_to_message_id: replyingTo?.id,
      });
      setShowAttachMenu(false);
    } catch (err) {
      console.error('File upload error:', err);
    }
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const recorder = new AudioRecorder();
      recorderRef.current = recorder;
      await recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = window.setInterval(() => {
        setRecordingDuration((p) => p + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone permission denied:', err);
    }
  };

  const stopAndSendRecording = async () => {
    if (!recorderRef.current) return;
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

    try {
      const { file, duration } = await recorderRef.current.stop();
      setIsRecording(false);
      const res = await uploadMediaFile(file, 'chat-attachments');
      await sendMessage({
        message_type: 'voice',
        media_url: res.url,
        duration,
        reply_to_message_id: replyingTo?.id,
      });
    } catch (err) {
      console.warn('Voice recording stop error:', err);
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    recorderRef.current?.cancel();
    setIsRecording(false);
    setRecordingDuration(0);
  };

  // Audio note playback
  const togglePlayAudio = (msgId: string, url: string) => {
    let audio = audioElementsRef.current[msgId];
    if (!audio) {
      audio = new Audio(url);
      audio.playbackRate = playbackSpeed;
      audioElementsRef.current[msgId] = audio;

      audio.onended = () => {
        setPlayingAudioId(null);
      };
    }

    if (playingAudioId === msgId) {
      audio.pause();
      setPlayingAudioId(null);
    } else {
      // Pause others
      Object.values(audioElementsRef.current).forEach((a) => a.pause());
      audio.play().catch(console.warn);
      setPlayingAudioId(msgId);
    }
  };

  const copyMessage = (msg: Message) => {
    if (msg.text) {
      navigator.clipboard.writeText(msg.text);
      setCopiedId(msg.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const formatAudioTime = (sec?: number | null) => {
    if (!sec) return '0:00';
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const conversationTyping = typingUsers.filter(
    (t) => t.conversation_id === activeConversation.id
  );

  return (
    <div className="flex-1 h-full flex flex-row overflow-hidden relative bg-slate-950">
      {/* Main chat column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 chat-pattern relative">
        {/* Header */}
        <div className="h-16 px-4 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Back Button */}
            {onBackToChats && (
              <button
                onClick={onBackToChats}
                className="md:hidden p-1.5 -ml-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <ChevronDown className="w-5 h-5 rotate-90" />
              </button>
            )}

            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-3 text-left hover:opacity-90 transition cursor-pointer"
            >
              <Avatar
                src={activeConversation.avatar_url}
                name={activeConversation.name || 'Chat'}
                size="md"
                isOnline={!isGroup && otherUser?.is_online}
                showOnlineStatus={!isGroup}
              />
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-white truncate">
                  {activeConversation.name}
                </h2>
                <p className="text-[11px] text-teal-400 truncate">
                  {isGroup
                    ? `${activeConversation.members?.length || 3} members`
                    : otherUser?.is_online
                    ? 'online'
                    : 'last seen recently'}
                </p>
              </div>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 sm:gap-2">
            {!isGroup && otherUser && (
              <>
                <button
                  onClick={() => startCall(otherUser, activeConversation.id, 'voice')}
                  className="p-2 rounded-xl text-slate-300 hover:text-teal-300 hover:bg-slate-900 transition cursor-pointer"
                  title="Voice Call"
                >
                  <Phone className="w-5 h-5" />
                </button>
                <button
                  onClick={() => startCall(otherUser, activeConversation.id, 'video')}
                  className="p-2 rounded-xl text-slate-300 hover:text-teal-300 hover:bg-slate-900 transition cursor-pointer"
                  title="Video Call"
                >
                  <Video className="w-5 h-5" />
                </button>
              </>
            )}

            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 transition cursor-pointer"
              title="Chat Info"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs py-10">
              <span className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 mb-2">
                🔒 Messages are protected by PostgreSQL RLS
              </span>
              <p>Say hello to start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === currentUser?.id;
              const isDeleted = !!msg.deleted_at;
              const isHovered = hoveredMessageId === msg.id;

              return (
                <div
                  key={msg.id}
                  onMouseEnter={() => setHoveredMessageId(msg.id)}
                  onMouseLeave={() => {
                    setHoveredMessageId(null);
                    setReactionPopoverId(null);
                  }}
                  className={`flex flex-col group relative ${
                    isMine ? 'items-end' : 'items-start'
                  }`}
                >
                  {/* Floating Action Pill on Hover */}
                  {isHovered && !isDeleted && (
                    <div
                      className={`absolute -top-7 z-20 flex items-center gap-1 bg-slate-900/95 border border-slate-800 rounded-full px-2 py-0.5 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 ${
                        isMine ? 'right-2' : 'left-2'
                      }`}
                    >
                      <button
                        onClick={() => setReplyingTo(msg)}
                        className="p-1 hover:text-teal-400 text-slate-400 transition"
                        title="Reply"
                      >
                        <Reply className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => reactToMessage(msg.id, '❤️')}
                        className="p-1 hover:scale-125 transition text-xs"
                        title="React ❤️"
                      >
                        ❤️
                      </button>
                      <button
                        onClick={() => reactToMessage(msg.id, '👍')}
                        className="p-1 hover:scale-125 transition text-xs"
                        title="React 👍"
                      >
                        👍
                      </button>

                      <button
                        onClick={() => copyMessage(msg)}
                        className="p-1 hover:text-teal-400 text-slate-400 transition"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-teal-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => setForwardingMessage(msg)}
                        className="p-1 hover:text-teal-400 text-slate-400 transition"
                        title="Forward"
                      >
                        <Forward className="w-3.5 h-3.5" />
                      </button>

                      {isMine && (
                        <>
                          {msg.message_type === 'text' && (
                            <button
                              onClick={() => setEditingMessage(msg)}
                              className="p-1 hover:text-teal-400 text-slate-400 transition"
                              title="Edit message"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            className="p-1 hover:text-rose-400 text-slate-400 transition"
                            title="Delete message"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Bubble Container */}
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow-md relative break-words transition ${
                      isMine
                        ? 'bg-gradient-to-r from-teal-700 to-teal-800 text-white rounded-tr-xs'
                        : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-xs'
                    }`}
                  >
                    {/* Sender name for group chats */}
                    {isGroup && !isMine && msg.sender && (
                      <span className="text-[11px] font-bold text-teal-400 block mb-1">
                        {msg.sender.display_name}
                      </span>
                    )}

                    {/* Reply quote banner */}
                    {msg.reply_to_message_id && (
                      <div className="mb-2 p-2 rounded-xl bg-black/25 border-l-2 border-teal-400 text-xs">
                        <span className="text-[10px] text-teal-300 font-bold block">
                          {msg.reply_message?.sender?.display_name || 'Replied message'}
                        </span>
                        <p className="text-slate-300 truncate text-[11px]">
                          {msg.reply_message?.text || `[${msg.reply_message?.message_type}]`}
                        </p>
                      </div>
                    )}

                    {/* Deleted state */}
                    {isDeleted ? (
                      <p className="italic text-xs text-slate-400 flex items-center gap-1.5">
                        <Trash2 className="w-3.5 h-3.5 opacity-60" />
                        This message was deleted
                      </p>
                    ) : (
                      <>
                        {/* Media: Image */}
                        {msg.message_type === 'image' && msg.media_url && (
                          <div
                            onClick={() => setActiveMediaModal(msg.media_url!)}
                            className="rounded-xl overflow-hidden mb-2 max-h-72 cursor-pointer border border-black/20 hover:opacity-95 transition"
                          >
                            <img
                              src={msg.media_url}
                              alt="Attached"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Media: Video */}
                        {msg.message_type === 'video' && msg.media_url && (
                          <div className="rounded-xl overflow-hidden mb-2 max-h-72 border border-black/20">
                            <video
                              src={msg.media_url}
                              controls
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Media: Audio or Voice Note */}
                        {(msg.message_type === 'audio' || msg.message_type === 'voice') &&
                          msg.media_url && (
                            <div className="flex items-center gap-3 p-2 bg-black/20 rounded-xl mb-1 min-w-[220px]">
                              <button
                                onClick={() => togglePlayAudio(msg.id, msg.media_url!)}
                                className="w-9 h-9 rounded-full bg-teal-400 text-slate-950 flex items-center justify-center shrink-0 hover:scale-105 transition cursor-pointer"
                              >
                                {playingAudioId === msg.id ? (
                                  <Pause className="w-4 h-4 fill-current" />
                                ) : (
                                  <Play className="w-4 h-4 fill-current ml-0.5" />
                                )}
                              </button>

                              {/* Simulated audio waveform */}
                              <div className="flex-1 flex items-center gap-0.5 h-6">
                                {[40, 70, 30, 90, 60, 40, 80, 50, 100, 35, 75, 45, 60, 85].map(
                                  (h, idx) => (
                                    <span
                                      key={idx}
                                      style={{ height: `${h}%` }}
                                      className={`w-1 rounded-full transition-all ${
                                        playingAudioId === msg.id
                                          ? 'bg-teal-300 animate-pulse'
                                          : 'bg-white/40'
                                      }`}
                                    />
                                  )
                                )}
                              </div>

                              <span className="text-[11px] font-mono text-slate-300">
                                {formatAudioTime(msg.duration || 4)}
                              </span>
                            </div>
                          )}

                        {/* Media: Document */}
                        {msg.message_type === 'document' && (
                          <div className="flex items-center gap-3 p-2.5 bg-black/20 rounded-xl mb-1 min-w-[200px]">
                            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold truncate text-white">
                                {msg.file_name || 'Document'}
                              </p>
                              <span className="text-[10px] text-slate-400">
                                {msg.file_size ? `${Math.round(msg.file_size / 1024)} KB` : 'File'}
                              </span>
                            </div>
                            {msg.media_url && (
                              <a
                                href={msg.media_url}
                                download={msg.file_name || 'download'}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-black/20"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        )}

                        {/* Text */}
                        {msg.text && (
                          <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                            {msg.text}
                          </p>
                        )}
                      </>
                    )}

                    {/* Bottom Metadata (Timestamp, Edited, Status) */}
                    <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] text-slate-300/80">
                      {msg.edited_at && !isDeleted && (
                        <span className="italic text-[9px] opacity-75">edited</span>
                      )}
                      <span>
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {isMine && !isDeleted && (
                        <span>
                          {msg.status === 'read' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-teal-300 inline" />
                          ) : msg.status === 'delivered' ? (
                            <CheckCheck className="w-3.5 h-3.5 opacity-70 inline" />
                          ) : (
                            <Check className="w-3.5 h-3.5 opacity-70 inline" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reaction Pills list */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div
                      className={`flex flex-wrap gap-1 mt-1 z-10 ${
                        isMine ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {msg.reactions.map((react) => (
                        <button
                          key={react.id}
                          onClick={() => reactToMessage(msg.id, react.reaction)}
                          className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-xs shadow-md hover:scale-110 transition flex items-center gap-1 cursor-pointer"
                        >
                          <span>{react.reaction}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Typing Indicator */}
          {conversationTyping.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-teal-400 italic py-1 animate-pulse">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce delay-100" />
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce delay-200" />
              </span>
              <span>{conversationTyping[0].display_name} is typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Replying banner */}
        {replyingTo && (
          <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2 min-w-0">
              <Reply className="w-4 h-4 text-teal-400 shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-teal-400">Replying to message: </span>
                <span className="italic text-slate-400">{replyingTo.text || `[${replyingTo.message_type}]`}</span>
              </div>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Editing banner */}
        {editingMessage && (
          <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2 min-w-0">
              <Edit2 className="w-4 h-4 text-teal-400 shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-teal-400">Editing message</span>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingMessage(null);
                setInputVal('');
              }}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800/80 relative z-30">
          {/* Emoji Picker Popover */}
          {showEmojiPicker && (
            <div className="absolute bottom-16 left-4 z-50">
              <EmojiPicker
                onSelectEmoji={(emoji) => setInputVal((prev) => prev + emoji)}
                onClose={() => setShowEmojiPicker(false)}
              />
            </div>
          )}

          {/* Attachment Popover */}
          {showAttachMenu && (
            <div className="absolute bottom-16 left-12 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 flex flex-col gap-1 w-44 text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-100">
              <label className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800 cursor-pointer">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>Photos & Videos</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <label className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800 cursor-pointer">
                <FileText className="w-4 h-4 text-teal-400" />
                <span>Document</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.zip"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Voice Recording Active UI */}
          {isRecording ? (
            <div className="flex items-center justify-between bg-slate-900 border border-red-500/30 rounded-2xl p-2.5 px-4 shadow-xl animate-pulse">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <span className="text-xs font-mono font-bold text-red-400">
                  Recording {formatAudioTime(recordingDuration)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelRecording}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={stopAndSendRecording}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-bold text-white transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-end gap-2">
              <button
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowAttachMenu(false);
                }}
                className={`p-2.5 rounded-xl transition cursor-pointer ${
                  showEmojiPicker
                    ? 'text-teal-400 bg-teal-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
                title="Emojis"
              >
                <Smile className="w-5 h-5" />
              </button>

              <button
                onClick={() => {
                  setShowAttachMenu(!showAttachMenu);
                  setShowEmojiPicker(false);
                }}
                className={`p-2.5 rounded-xl transition cursor-pointer ${
                  showAttachMenu
                    ? 'text-teal-400 bg-teal-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
                title="Attach Media"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Text Area */}
              <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-1.5 focus-within:border-teal-500/80 transition">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  placeholder="Type a message..."
                  value={inputVal}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent px-2.5 py-1 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none max-h-32 leading-relaxed"
                />
              </div>

              {/* Voice record OR Send button */}
              {inputVal.trim() || editingMessage ? (
                <button
                  onClick={handleSend}
                  className="w-10 h-10 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-teal-950/50 transition cursor-pointer active:scale-95"
                  title="Send message"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  className="w-10 h-10 rounded-2xl bg-slate-900 hover:bg-teal-600 hover:text-white border border-slate-800 text-teal-400 flex items-center justify-center shrink-0 transition cursor-pointer active:scale-95"
                  title="Record Voice Note"
                >
                  <Mic className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Drawer: Details */}
      {showDetails && (
        <ConversationDetails
          conversation={activeConversation}
          onClose={() => setShowDetails(false)}
        />
      )}

      {/* Forward Message Modal */}
      <ForwardModal />

      {/* Media Lightbox */}
      {activeMediaModal && (
        <div
          onClick={() => setActiveMediaModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 cursor-zoom-out backdrop-blur-md"
        >
          <img
            src={activeMediaModal}
            alt="Fullscreen view"
            className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
