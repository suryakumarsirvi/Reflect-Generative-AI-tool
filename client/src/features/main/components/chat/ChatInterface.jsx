import React, { useEffect, useRef, useState } from "react";
import { PromptInput, PromptInputTextarea } from "@/components/ui/prompt-input";
import { Loader } from "@/components/ui/loader";
import { Markdown } from "@/components/ui/markdown";
import { useSelector, useDispatch } from "react-redux";
import { setGoProModalOpen } from "../../store/chat.slice";
import {
  ArrowRight,
  Plus,
  Search,
  Globe,
  Square,
  FileText,
  X,
  AlertCircle,
  Sparkles,
  Terminal,
  Copy,
  Check,
  RefreshCw,
  Edit3,
  ChevronDown,
  ChevronUp,
  Info,
  Clock,
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import { API } from "@/api/axios.api";

const ChatInterface = ({ messages, isLoading, isStreaming, sendMessage, stopGenerating, chatId: currentChatId }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const [inputValue, setInputValue] = useState("");
  const [useWebSearch, setUseWebSearch] = useState(true);

  // Custom toggles
  const [deepResearch, setDeepResearch] = useState(false);
  const [engineerMode, setEngineerMode] = useState(false);

  const [attachedFile, setAttachedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [activeChatId, setActiveChatId] = useState(currentChatId);

  // States for user interaction features
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [expandedThoughts, setExpandedThoughts] = useState({});

  const isPro = user?.tier === "pro";

  useEffect(() => {
    setActiveChatId(currentChatId);
  }, [currentChatId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming]);

  const handleSendMessage = async (message) => {
    if (message.trim() || attachedFile) {
      let finalChatId = activeChatId;

      if (attachedFile && !isUploading) {
        setIsUploading(true);
        setUploadError(null);
        try {
          const formData = new FormData();
          formData.append("file", attachedFile);
          if (finalChatId) formData.append("chatId", finalChatId);

          const response = await API.post("/chat/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });

          if (response.data.success) {
            finalChatId = response.data.chatId;
            setActiveChatId(finalChatId);
            setAttachedFile(null);
          } else {
            setUploadError(response.data.message || "Upload failed");
            setIsUploading(false);
            return;
          }
        } catch (error) {
          console.error("Upload failed:", error);
          const errorMessage = error.response?.data?.message || error.message || "Failed to upload file. Please try again.";
          setUploadError(errorMessage);
          setIsUploading(false);
          return;
        }
      }

      sendMessage(message || "Analyze this document", useWebSearch, finalChatId);
      setInputValue("");
    }
  };

  const handleDeepResearchToggle = () => {
    if (!isPro) {
      dispatch(setGoProModalOpen(true));
    } else {
      setDeepResearch(!deepResearch);
    }
  };

  const onFileChange = (e) => {
    const file = e.target.files[0];
    setUploadError(null);

    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError("Only PDF files are supported.");
      return;
    }

    const maxSize = 52428800;
    if (file.size > maxSize) {
      setUploadError(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds the 50MB limit.`);
      return;
    }

    setAttachedFile(file);
  };

  const removeFile = () => {
    setAttachedFile(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCopyMessage = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const startEditing = (msg) => {
    setEditingMessageId(msg._id || msg.id);
    setEditValue(msg.content);
  };

  const handleSaveEdit = (msgId) => {
    if (!editValue.trim() || isStreaming) return;

    const targetMsgIndex = messages.findIndex(m => m._id === msgId || m.id === msgId);
    if (targetMsgIndex === -1) return;

    const precedingUserMessage = messages[targetMsgIndex];

    sendMessage(editValue, useWebSearch, activeChatId, precedingUserMessage._id || precedingUserMessage.id);
    setEditingMessageId(null);
    setEditValue("");
  };

  const handleRegenerate = (assistantMsg) => {
    if (isStreaming) return;

    const msgIndex = messages.findIndex(m => m._id === assistantMsg._id || m.id === assistantMsg.id);
    if (msgIndex <= 0) return;

    const precedingUserMsg = messages[msgIndex - 1];
    if (precedingUserMsg && precedingUserMsg.role === "user") {
      sendMessage(precedingUserMsg.content, useWebSearch, activeChatId, precedingUserMsg._id || precedingUserMsg.id);
    }
  };

  const toggleThoughts = (id) => {
    setExpandedThoughts(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderErrorMessage = () => (
    uploadError && (
      <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-3 animate-in fade-in slide-in-from-bottom-2">
        <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-red-400">Upload failed</span>
          <span className="text-xs text-red-400/80">{uploadError}</span>
        </div>
        <button
          onClick={() => setUploadError(null)}
          className="ml-auto text-red-400/60 hover:text-red-400 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    )
  );

  const renderFilePreview = () => (
    attachedFile && (
      <div className="flex items-center gap-3 bg-[#1c1c1c] border border-[#262626] rounded-xl px-4 py-2 mb-3 w-fit animate-in fade-in slide-in-from-bottom-2">
        <div className="p-2 bg-neutral-500/10 rounded-lg">
          <FileText size={20} className="text-neutral-400" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-[#e5e5e5] max-w-[200px] truncate">
            {attachedFile.name}
          </span>
          <span className="text-[10px] text-neutral-500 font-mono">
            {(attachedFile.size / 1024).toFixed(1)} KB
          </span>
        </div>
        <button
          onClick={removeFile}
          className="p-1 hover:bg-white/5 rounded-full transition-colors text-neutral-500 hover:text-white cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>
    )
  );

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0a] text-[#e5e5e5] relative">
      <style>{`
        @keyframes smoothBlueReveal {
          0% {
            color: #3b82f6;
            text-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
            opacity: 0.6;
            filter: blur(2px);
          }
          100% {
            color: inherit;
            text-shadow: none;
            opacity: 1;
            filter: blur(0);
          }
        }
        .stream-reveal p, 
        .stream-reveal li, 
        .stream-reveal h3, 
        .stream-reveal h4,
        .stream-reveal pre,
        .stream-reveal table {
          animation: smoothBlueReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .mono-terminal {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
      `}</style>

      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        accept=".pdf"
        className="hidden"
      />

      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 w-full max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-serif tracking-tight text-white mb-8 text-center animate-in fade-in slide-in-from-top-6 duration-500">
            Where knowledge begins
          </h1>

          <div className="w-full relative group animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="absolute inset-0 bg-neutral-900 rounded-full blur-xl opacity-0 group-focus-within:opacity-40 transition-opacity duration-500"></div>
            <div className="relative bg-[#141414] border border-[#262626] rounded-[24px] shadow-2xl overflow-hidden focus-within:border-neutral-700 transition-all">
              <div className="flex flex-col px-4 pt-4 pb-3">
                {renderErrorMessage()}
                {renderFilePreview()}
                <PromptInput
                  value={inputValue}
                  onValueChange={setInputValue}
                  onSubmit={() => handleSendMessage(inputValue)}
                  disabled={isLoading || isStreaming || isUploading}
                  className="bg-transparent border-none focus-within:ring-0 shadow-none px-0"
                >
                  <PromptInputTextarea
                    placeholder="Ask anything..."
                    className="bg-transparent border-none focus-visible:ring-0 text-[#e5e5e5] text-base resize-none min-h-12 placeholder:text-neutral-600 px-2"
                  />
                </PromptInput>
                <div className="flex flex-wrap gap-2 justify-between items-center px-2 mt-2 border-t border-[#262626] pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Pro Search Toggle */}
                    <button
                      type="button"
                      onClick={() => setUseWebSearch(!useWebSearch)}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer font-mono ${useWebSearch
                          ? "text-white bg-white/10 border border-white/15"
                          : "text-neutral-500 bg-transparent hover:text-white"
                        }`}
                    >
                      <Globe size={13} className={useWebSearch ? "text-neutral-200" : ""} />
                      PRO SEARCH
                    </button>

                    {/* Deep Research Toggle (Pro only growth loop) */}
                    <button
                      type="button"
                      onClick={handleDeepResearchToggle}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer font-mono ${deepResearch && isPro
                          ? "text-amber-300 bg-amber-500/10 border border-amber-500/20"
                          : "text-neutral-500 bg-transparent hover:text-white"
                        }`}
                    >
                      <Sparkles size={13} className="text-amber-400" />
                      DEEP RESEARCH
                    </button>

                    {/* Engineer Mode Tone Toggle */}
                    <button
                      type="button"
                      onClick={() => setEngineerMode(!engineerMode)}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer font-mono ${engineerMode
                          ? "text-emerald-300 bg-emerald-500/10 border border-emerald-500/20"
                          : "text-neutral-500 bg-transparent hover:text-white"
                        }`}
                    >
                      <Terminal size={13} className={engineerMode ? "text-emerald-400" : ""} />
                      ENGINEER
                    </button>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-white bg-transparent px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-mono"
                    >
                      <Plus size={13} />
                      ATTACH
                    </button>
                  </div>
                  {isStreaming || isUploading ? (
                    <button
                      onClick={stopGenerating}
                      className="p-1.5 rounded-full bg-white text-black hover:bg-neutral-200 transition-colors cursor-pointer"
                    >
                      {isUploading ? <Loader size="sm" className="text-black" /> : <Square fill="currentColor" size={14} strokeWidth={0} />}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSendMessage(inputValue)}
                      disabled={(!inputValue.trim() && !attachedFile) || isLoading}
                      className="p-1.5 rounded-full bg-white text-black disabled:bg-[#1f1f1f] disabled:text-neutral-600 hover:bg-neutral-200 transition-colors disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ArrowRight size={16} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-8 text-xs text-neutral-500 font-mono uppercase tracking-wider animate-in fade-in duration-500">
            <button onClick={() => handleSendMessage("Compare Next.js and Remix frameworks")} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#141414] border border-[#262626] hover:border-neutral-700 hover:text-white transition-colors cursor-pointer">
              <Search size={12} /> Compare React Frameworks
            </button>
            <button onClick={() => handleSendMessage("What is today's date and time?")} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#141414] border border-[#262626] hover:border-neutral-700 hover:text-white transition-colors cursor-pointer">
              <Globe size={12} /> Sync System Clock
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Active Messages Feed */}
          <div className="flex-1 overflow-y-auto scrollbar-hide pt-10 pb-40">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 w-full space-y-10">
              {messages.map((msg, index) => {
                const msgId = msg._id || msg.id;

                return (
                  <div key={index} className="flex flex-col animate-in fade-in duration-300">
                    {msg.role === "user" ? (
                      <div className="flex flex-col gap-2 mt-8">
                        {editingMessageId === msgId ? (
                          <div className="flex flex-col gap-3 w-full bg-[#141414] border border-[#262626] rounded-2xl p-4">
                            <textarea
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-full bg-transparent text-white outline-hidden resize-none min-h-[80px]"
                            />
                            <div className="flex justify-end gap-2 text-xs font-mono font-semibold">
                              <button
                                onClick={() => setEditingMessageId(null)}
                                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer"
                              >
                                CANCEL
                              </button>
                              <button
                                onClick={() => handleSaveEdit(msgId)}
                                className="px-3 py-1.5 rounded-lg bg-white text-black hover:bg-neutral-200 cursor-pointer"
                              >
                                SUBMIT
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-start gap-4 group">
                            <div className="text-xl sm:text-[1.5rem] font-medium text-white tracking-tight leading-snug">
                              {msg.content}
                            </div>
                            <button
                              onClick={() => startEditing(msg)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/5 rounded-md transition-all text-neutral-500 hover:text-white cursor-pointer mt-1"
                              title="Edit question"
                            >
                              <Edit3 size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 mt-4">
                        <div className="flex items-center gap-2 text-xs text-neutral-400 font-bold tracking-widest uppercase mb-1">
                          <Terminal size={14} className="text-white" />
                          <span>ANSWER</span>
                          {isPro && (
                            <span className="text-[9px] tracking-widest font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 ml-2">
                              PRO ENGINE
                            </span>
                          )}
                        </div>

                        {/* 1. AI Thought Trace (accordion) */}
                        {((msg.thoughtTrace && msg.thoughtTrace.trim().length > 0) || (msg.isStreaming && !msg.content)) && (
                          <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden mb-3 animate-in fade-in">
                            <button
                              onClick={() => toggleThoughts(msgId)}
                              className="w-full flex items-center justify-between px-4 py-3 text-[10px] font-bold tracking-wider text-neutral-400 hover:text-white transition-colors cursor-pointer font-mono"
                            >
                              <div className="flex items-center gap-2">
                                <Clock size={12} className="text-neutral-400" />
                                <span>REASONING MONITOR LOG</span>
                              </div>
                              {expandedThoughts[msgId] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            {(expandedThoughts[msgId] || msg.isStreaming) && (
                              <div className="px-4 pb-4 pt-1 text-[11px] text-neutral-400 font-mono leading-relaxed border-t border-[#262626] bg-[#0c0c0c] max-h-40 overflow-y-auto scrollbar-hide">
                                {msg.thoughtTrace.split("\n").map((line, lIdx) => (
                                  <div key={lIdx} className="flex items-center gap-2 py-0.5">
                                    {line.trim() ? (
                                      <>
                                        <span className="text-neutral-600 font-bold">{`[+${lIdx * 120}ms]`}</span>
                                        <span>{line}</span>
                                      </>
                                    ) : null}
                                  </div>
                                ))}
                                {msg.isStreaming && !msg.content && (
                                  <div className="flex items-center gap-2 py-1 text-neutral-400 font-mono">
                                    <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-ping"></span>
                                    <span>Synthesizing matrix response...</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 2. Live Sources (Grid) */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mb-4 animate-in fade-in">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2.5 flex items-center gap-1.5 font-mono">
                              <Globe size={12} className="text-neutral-400" />
                              <span>LIVE INDEX ({msg.sources.length})</span>
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {msg.sources.map((src, sIdx) => (
                                <a
                                  key={sIdx}
                                  href={src.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex flex-col gap-1 p-3 bg-[#141414] border border-[#262626] rounded-xl hover:border-neutral-700 transition-all group cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={`https://www.google.com/s2/favicons?sz=64&domain=${src.domain || 'google.com'}`}
                                      alt=""
                                      className="w-3.5 h-3.5 rounded-xs invert opacity-60 group-hover:opacity-100 transition-opacity"
                                      onError={(e) => { e.target.src = "/svg/perplexity.svg" }}
                                    />
                                    <span className="text-[10px] text-neutral-400 group-hover:text-white truncate font-medium font-mono">{src.domain}</span>
                                    <span className="text-[9px] text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded-md ml-auto font-bold font-mono">{src.relevance}</span>
                                  </div>
                                  <span className="text-xs font-semibold text-neutral-200 line-clamp-2 mt-1.5 leading-snug group-hover:underline flex items-center gap-1">
                                    {src.title}
                                    <ExternalLink size={10} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 3. Visuals / Product Intelligence Carousel */}
                        {msg.visuals && msg.visuals.length > 0 && (
                          <div className="mb-4 animate-in fade-in">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2.5 flex items-center gap-1.5 font-mono">
                              <Sparkles size={12} className="text-neutral-400" />
                              <span>SPECIFICATION IMAGES</span>
                            </h4>
                            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                              {msg.visuals.map((vis, vIdx) => (
                                <div key={vIdx} className="flex-shrink-0 w-64 bg-[#141414] border border-[#262626] rounded-xl overflow-hidden shadow-lg flex flex-col hover:border-neutral-700 transition-colors">
                                  <div className="relative aspect-video bg-[#0c0c0c] overflow-hidden group">
                                    <img
                                      src={vis.url}
                                      alt={vis.name}
                                      className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                                      onError={(e) => { e.target.src = "/svg/perplexity.svg" }}
                                    />
                                    <div className="absolute top-2 right-2 bg-[#141414] border border-[#262626] px-2 py-0.5 rounded-md text-[10px] font-mono text-neutral-300">
                                      {vis.priceRange}
                                    </div>
                                  </div>
                                  <div className="p-3.5 flex flex-col gap-2 flex-1 font-mono">
                                    <span className="text-xs font-bold text-white truncate">{vis.name}</span>
                                    <p className="text-[10px] text-neutral-400 line-clamp-2 leading-relaxed">{vis.caption}</p>

                                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#262626] text-[8px] uppercase font-bold text-center">
                                      <div className="text-neutral-300 bg-neutral-800/50 py-1 rounded-md">
                                        PRO SPECS
                                      </div>
                                      <div className="text-neutral-400 bg-neutral-800/30 py-1 rounded-md flex items-center justify-center gap-1">
                                        <ShieldCheck size={10} /> NEUTRAL
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 4. Synthesized Markdown Answer */}
                        <div className="pl-0 leading-relaxed text-[15px]">
                          {msg.isLoading && !msg.content ? (
                            <div className="py-2 text-neutral-500">
                              <Loader variant="text-shimmer" text="COMPILING RESPONSE MATRIX..." size="sm" className="text-neutral-500 font-mono text-xs" />
                            </div>
                          ) : (
                            <div className={msg.isStreaming ? "stream-reveal" : ""}>
                              <Markdown className="prose prose-invert max-w-none text-[#e5e5e5] leading-8 text-[15px] prose-p:mb-6 prose-headings:font-semibold prose-headings:text-white prose-headings:mt-8 prose-headings:mb-4 prose-headings:font-serif prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-pre:bg-[#0c0c0c] prose-pre:border prose-pre:border-[#262626] prose-pre:rounded-xl prose-li:marker:text-neutral-600 prose-ul:space-y-2 prose-ul:mb-6 prose-strong:text-white prose-strong:font-bold">
                                {msg.content}
                              </Markdown>
                            </div>
                          )}
                        </div>

                        {/* 5. Answer Actions */}
                        {!msg.isLoading && (
                          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#262626] text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                            <button
                              onClick={() => handleCopyMessage(msg.content, msgId)}
                              className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                              title="Copy response"
                            >
                              {copiedMessageId === msgId ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                              <span>{copiedMessageId === msgId ? "COPIED" : "COPY"}</span>
                            </button>

                            <button
                              onClick={() => handleRegenerate(msg)}
                              className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer ml-2"
                              title="Regenerate answer"
                            >
                              <RefreshCw size={13} className={isStreaming ? "animate-spin" : ""} />
                              <span>REGENERATE</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={scrollRef} className="h-10" />
            </div>
          </div>

          {/* Bottom input area */}
          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pt-10 pb-6 px-4">
            <div className="max-w-3xl mx-auto w-full">
              <div className="bg-[#141414] border border-[#262626] rounded-[24px] shadow-2xl overflow-hidden focus-within:border-neutral-700 transition-all">
                <div className="flex flex-col px-4 pt-3 pb-2">
                  {renderErrorMessage()}
                  {renderFilePreview()}
                  <PromptInput
                    value={inputValue}
                    onValueChange={setInputValue}
                    onSubmit={() => handleSendMessage(inputValue)}
                    disabled={isLoading || isStreaming || isUploading}
                    className="bg-transparent border-none focus-within:ring-0 shadow-none px-0 py-0"
                  >
                    <PromptInputTextarea
                      placeholder="Ask a follow-up..."
                      className="bg-transparent border-none focus-visible:ring-0 text-[#e5e5e5] text-base resize-none min-h-10 placeholder:text-neutral-600 px-2"
                    />
                  </PromptInput>
                  <div className="flex flex-wrap gap-2 justify-between items-center px-2 mt-1 border-t border-[#262626] pt-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Pro Search Toggle */}
                      <button
                        type="button"
                        onClick={() => setUseWebSearch(!useWebSearch)}
                        className={`flex items-center gap-1.5 text-xs font-semibold transition-colors px-2 py-1 rounded-md cursor-pointer font-mono ${useWebSearch
                            ? "text-white bg-white/10"
                            : "text-neutral-500 hover:text-white"
                          }`}
                      >
                        <Globe size={13} className={useWebSearch ? "text-neutral-200" : ""} />
                        PRO SEARCH
                      </button>

                      {/* Deep Research Toggle */}
                      <button
                        type="button"
                        onClick={handleDeepResearchToggle}
                        className={`flex items-center gap-1.5 text-xs font-semibold transition-colors px-2 py-1 rounded-md cursor-pointer font-mono ${deepResearch && isPro
                            ? "text-amber-300 bg-amber-500/10 border border-amber-500/20"
                            : "text-neutral-500 hover:text-white"
                          }`}
                      >
                        <Sparkles size={13} className="text-amber-400" />
                        DEEP RESEARCH
                      </button>

                      {/* Engineer Mode Toggle */}
                      <button
                        type="button"
                        onClick={() => setEngineerMode(!engineerMode)}
                        className={`flex items-center gap-1.5 text-xs font-semibold transition-colors px-2 py-1 rounded-md cursor-pointer font-mono ${engineerMode
                            ? "text-emerald-300 bg-emerald-500/10 border border-emerald-500/20"
                            : "text-neutral-500 hover:text-white"
                          }`}
                      >
                        <Terminal size={13} className="text-emerald-400" />
                        ENGINEER
                      </button>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-white transition-colors px-2 py-1 cursor-pointer font-mono"
                      >
                        <Plus size={13} />
                        ATTACH
                      </button>
                    </div>
                    {isStreaming || isUploading ? (
                      <button
                        onClick={stopGenerating}
                        className="p-1.5 rounded-full bg-white text-black hover:bg-neutral-200 transition-colors cursor-pointer"
                      >
                        {isUploading ? <Loader size="xs" className="text-black" /> : <Square fill="currentColor" size={14} strokeWidth={0} />}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSendMessage(inputValue)}
                        disabled={(!inputValue.trim() && !attachedFile) || isLoading}
                        className="p-1.5 rounded-full bg-white text-black disabled:bg-[#1f1f1f] disabled:text-neutral-600 hover:bg-neutral-200 transition-colors disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ArrowRight size={16} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatInterface;
