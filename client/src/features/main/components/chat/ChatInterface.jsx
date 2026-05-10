import React, { useEffect, useRef, useState } from "react";
import { 
  ChatContainerRoot, 
  ChatContainerContent, 
  ChatContainerScrollAnchor 
} from "@/components/ui/chat-container";
import { PromptInput, PromptInputTextarea } from "@/components/ui/prompt-input";
import { Loader } from "@/components/ui/loader";
import { Markdown } from "@/components/ui/markdown";
import { ArrowRight, Plus, Search, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const ChatInterface = ({ messages, isLoading, isStreaming, sendMessage, onNewChat }) => {
  const scrollRef = useRef(null);
  const [inputValue, setInputValue] = useState("");
  const [useWebSearch, setUseWebSearch] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming]);

  const handleSendMessage = (message) => {
    if (message.trim()) {
      sendMessage(message, useWebSearch);
      setInputValue("");
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#171615] text-[#e8e8e6] relative">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 w-full max-w-3xl mx-auto">
          <h1 className="text-[2.5rem] font-serif tracking-tight text-white mb-8 text-center">
            Where knowledge begins
          </h1>
          
          <div className="w-full relative group">
            <div className="absolute inset-0 bg-[#2f3131] rounded-full blur-xl opacity-0 group-focus-within:opacity-50 transition-opacity duration-500"></div>
            <div className="relative bg-[#202222] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden focus-within:ring-1 focus-within:ring-white/20 transition-all">
              <div className="flex flex-col px-4 pt-4 pb-3">
                <PromptInput
                  value={inputValue}
                  onValueChange={setInputValue}
                  onSubmit={() => handleSendMessage(inputValue)}
                  disabled={isLoading || isStreaming}
                  className="bg-transparent border-none focus-within:ring-0 shadow-none px-0"
                >
                  <PromptInputTextarea
                    placeholder="Ask anything..."
                    className="bg-transparent border-none focus-visible:ring-0 text-[#e8e8e6] text-lg resize-none min-h-[60px] placeholder:text-[#8e8e8e] placeholder:font-serif px-2"
                  />
                </PromptInput>
                <div className="flex justify-between items-center px-2 mt-2">
                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => setUseWebSearch(!useWebSearch)}
                      className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                        useWebSearch 
                          ? "text-[#e8e8e6] bg-[#2a2a2a] border border-white/20" 
                          : "text-[#8e8e8e] bg-white/5 hover:bg-white/10 hover:text-[#e8e8e6]"
                      }`}
                    >
                      <Globe size={14} className={useWebSearch ? "text-blue-400" : ""} />
                      Pro Search
                    </button>
                    <button className="flex items-center gap-2 text-xs font-medium text-[#8e8e8e] hover:text-[#e8e8e6] bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors">
                      <Plus size={14} />
                      Attach
                    </button>
                  </div>
                  <button
                    onClick={() => handleSendMessage(inputValue)}
                    disabled={!inputValue.trim() || isLoading || isStreaming}
                    className="p-2 rounded-full bg-white text-black disabled:bg-[#2f3131] disabled:text-[#8e8e8e] hover:bg-gray-200 transition-colors disabled:cursor-not-allowed"
                  >
                    <ArrowRight size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-8 text-sm text-[#8e8e8e]">
            <button onClick={() => handleSendMessage("What is the history of AI?")} className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#202222] border border-white/5 hover:border-white/20 hover:text-[#e8e8e6] transition-colors">
               <Search size={14} /> What is the history of AI?
            </button>
            <button onClick={() => handleSendMessage("How does quantum computing work?")} className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#202222] border border-white/5 hover:border-white/20 hover:text-[#e8e8e6] transition-colors">
               <Search size={14} /> How does quantum computing work?
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto scrollbar-hide pt-10 pb-40">
             <div className="max-w-3xl mx-auto px-4 sm:px-6 w-full space-y-8">
              {messages.map((msg, index) => (
                <div key={index} className="flex flex-col">
                  {msg.role === "user" ? (
                     <div className="text-[1.75rem] font-medium text-white mb-6 leading-snug">
                        {msg.content}
                     </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-sm text-[#8e8e8e] font-medium">
                         <img src="/svg/perplexity.svg" alt="Perplexity Logo" className="w-4 h-4 invert opacity-70" />
                         <span>Answer</span>
                      </div>
                        <div className="pl-0 pt-2">
                          {msg.isLoading && !msg.content ? (
                            <div className="py-2 text-[#8e8e8e]">
                              <Loader variant="text-shimmer" text="Generating answer..." size="sm" className="text-[#8e8e8e]" />
                            </div>
                          ) : (
                            <Markdown className="prose prose-invert max-w-none text-[#e8e8e6] prose-p:leading-loose prose-p:text-[15px] prose-headings:font-medium prose-headings:text-white prose-headings:mt-8 prose-headings:mb-4 prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-pre:bg-[#1a1a1a] prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-li:marker:text-[#8e8e8e] prose-ul:space-y-2 prose-strong:text-white prose-strong:font-semibold">
                              {msg.content}
                            </Markdown>
                          )}
                        </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={scrollRef} className="h-4" />
             </div>
          </div>

          {/* Sticky Bottom Input */}
          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#171615] via-[#171615] to-transparent pt-10 pb-6 px-4">
             <div className="max-w-3xl mx-auto w-full">
                <div className="bg-[#202222] border border-white/10 rounded-[28px] shadow-2xl overflow-hidden focus-within:ring-1 focus-within:ring-white/20 transition-all">
                  <div className="flex flex-col px-4 pt-3 pb-2">
                    <PromptInput
                      value={inputValue}
                      onValueChange={setInputValue}
                      onSubmit={() => handleSendMessage(inputValue)}
                      disabled={isLoading || isStreaming}
                      className="bg-transparent border-none focus-within:ring-0 shadow-none px-0 py-0"
                    >
                      <PromptInputTextarea
                        placeholder="Ask a follow-up..."
                        className="bg-transparent border-none focus-visible:ring-0 text-[#e8e8e6] text-base resize-none min-h-[40px] placeholder:text-[#8e8e8e] px-2"
                      />
                    </PromptInput>
                    <div className="flex justify-between items-center px-2 mt-1">
                      <div className="flex items-center gap-2">
                        <button 
                          type="button"
                          onClick={() => setUseWebSearch(!useWebSearch)}
                          className={`flex items-center gap-2 text-xs font-medium transition-colors px-2 py-1 rounded-md ${
                            useWebSearch 
                              ? "text-[#e8e8e6] bg-[#2a2a2a]" 
                              : "text-[#8e8e8e] hover:text-[#e8e8e6] hover:bg-white/5"
                          }`}
                        >
                          <Globe size={14} className={useWebSearch ? "text-blue-400" : ""} />
                          Pro Search
                        </button>
                        <button className="flex items-center gap-2 text-xs font-medium text-[#8e8e8e] hover:text-[#e8e8e6] transition-colors px-2 py-1">
                          <Plus size={14} />
                          Attach
                        </button>
                      </div>
                      <button
                        onClick={() => handleSendMessage(inputValue)}
                        disabled={!inputValue.trim() || isLoading || isStreaming}
                        className="p-1.5 rounded-full bg-white text-black disabled:bg-[#2f3131] disabled:text-[#8e8e8e] hover:bg-gray-200 transition-colors disabled:cursor-not-allowed"
                      >
                        <ArrowRight size={16} strokeWidth={2.5} />
                      </button>
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
