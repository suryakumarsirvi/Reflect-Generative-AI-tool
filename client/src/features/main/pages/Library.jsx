import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import AppLayout from "../components/layout/AppLayout";
import { useChat } from "../hooks/useChat";
import { Library as LibraryIcon, Search, Trash2, ArrowRight, MessageSquare } from "lucide-react";

const Library = () => {
  const navigate = useNavigate();
  const {
    chats,
    chatId,
    fetchChats,
    fetchMessages,
    startNewChat,
    deleteChat
  } = useChat();

  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const handleChatSelect = (id) => {
    fetchMessages(id);
    navigate("/home");
  };

  const handleDeleteClick = async (e, id) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await deleteChat(id);
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingId(null);
    }
  };

  // Group chats chronologically
  const getGroupedChats = () => {
    const filtered = chats.filter(c => 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.lastMessage && c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const groups = {
      today: [],
      yesterday: [],
      older: []
    };

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    filtered.forEach(chat => {
      const chatDate = new Date(chat.updatedAt || chat.createdAt);
      if (chatDate >= todayStart) {
        groups.today.push(chat);
      } else if (chatDate >= yesterdayStart) {
        groups.yesterday.push(chat);
      } else {
        groups.older.push(chat);
      }
    });

    return groups;
  };

  const grouped = getGroupedChats();

  const renderThreadSection = (title, threads) => {
    if (threads.length === 0) return null;

    return (
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#8e8e8e] px-1">
          {title}
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {threads.map((thread) => (
            <div
              key={thread._id}
              onClick={() => handleChatSelect(thread._id)}
              className="bg-[#202222] border border-white/5 hover:border-white/10 rounded-2xl p-4 flex justify-between items-center group cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-2.5 bg-white/5 rounded-xl text-[#8e8e8e] group-hover:text-white group-hover:bg-white/10 transition-colors">
                  <MessageSquare size={16} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-white truncate max-w-[400px]">
                    {thread.title}
                  </span>
                  <span className="text-xs text-[#8e8e8e] truncate max-w-[400px] mt-0.5">
                    {thread.lastMessage || "No messages"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleDeleteClick(e, thread._id)}
                  disabled={deletingId === thread._id}
                  className="opacity-0 group-hover:opacity-100 p-2 text-[#8e8e8e] hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  title="Delete thread"
                >
                  <Trash2 size={15} />
                </button>
                <ArrowRight size={14} className="text-[#8e8e8e] group-hover:text-white transition-colors mr-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <AppLayout
      chats={chats}
      currentChatId={chatId}
      onChatSelect={handleChatSelect}
      onNewChat={() => {
        startNewChat();
        navigate("/home");
      }}
    >
      <div className="flex flex-col h-full w-full bg-[#171615] text-[#e8e8e6] overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-12">
          
          <div className="flex items-center gap-3 mb-4">
            <LibraryIcon size={24} className="text-[#8e8e8e]" />
            <h1 className="text-3xl sm:text-4xl font-serif tracking-tight text-white">
              Library
            </h1>
          </div>
          <p className="text-sm text-[#8e8e8e] mb-8 max-w-lg">
            Manage your historical threads, search context records, and delete search traces.
          </p>

          {/* Search bar */}
          <div className="relative mb-8">
            <input
              type="text"
              placeholder="Search library threads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#202222] border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-[#5c5d5d] focus:border-white/10 outline-hidden transition-colors"
            />
            <Search className="absolute left-4 top-3.5 text-[#5c5d5d]" size={16} />
          </div>

          <div className="flex flex-col gap-8">
            {grouped.today.length === 0 && grouped.yesterday.length === 0 && grouped.older.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-2 border border-dashed border-white/5 rounded-2xl">
                <span className="text-sm font-semibold text-[#8e8e8e]">No threads found</span>
                <button
                  onClick={() => {
                    startNewChat();
                    navigate("/home");
                  }}
                  className="text-xs text-blue-400 hover:underline font-semibold mt-1 cursor-pointer"
                >
                  Start a new thread
                </button>
              </div>
            ) : (
              <>
                {renderThreadSection("Today", grouped.today)}
                {renderThreadSection("Yesterday", grouped.yesterday)}
                {renderThreadSection("Previous Threads", grouped.older)}
              </>
            )}
          </div>

        </div>
      </div>
    </AppLayout>
  );
};

export default Library;
