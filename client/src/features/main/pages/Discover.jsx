import React from "react";
import { useNavigate } from "react-router";
import AppLayout from "../components/layout/AppLayout";
import { useChat } from "../hooks/useChat";
import { Compass, Sparkles, Terminal, Database, Cpu, ArrowRight } from "lucide-react";

const Discover = () => {
  const navigate = useNavigate();
  const {
    chats,
    chatId,
    fetchMessages,
    startNewChat,
    sendMessage
  } = useChat();

  const trendingTopics = [
    {
      category: "Artificial Intelligence",
      icon: <Cpu size={16} className="text-blue-400" />,
      title: "GPT-5 Multimodal Agentic Workflows",
      description: "How GPT-5 models integrate with local environments, browser control agents, and code execution sandboxes.",
      query: "Explain GPT-5 agentic workflows and how sandboxed code execution works under the hood.",
      readTime: "4 min read"
    },
    {
      category: "Backend & Systems",
      icon: <Terminal size={16} className="text-emerald-400" />,
      title: "Rust-Based Web API Framework Performance",
      description: "A complete benchmark analysis of Axum, Actix-web, and Rocket frameworks for building ultra-low latency microservices.",
      query: "Benchmark Rust web API frameworks Axum and Actix-web, comparing memory overhead and throughput.",
      readTime: "6 min read"
    },
    {
      category: "Databases & Vector Storage",
      icon: <Database size={16} className="text-amber-400" />,
      title: "Pinecone Serverless Vector Database Pricing Models",
      description: "Understand read/write unit storage in serverless configurations vs standard pod-based indexes.",
      query: "Detail Pinecone Serverless vector database indexing mechanisms and price optimizations.",
      readTime: "3 min read"
    },
    {
      category: "Frontend Architecture",
      icon: <Compass size={16} className="text-pink-400" />,
      title: "React Server Components vs SolidJS SolidStart",
      description: "Analyzing render speeds, hydration overhead, and developer experience in Next.js 16 and SolidStart.",
      query: "Compare hydration models of React Server Components and SolidJS SolidStart.",
      readTime: "5 min read"
    }
  ];

  const handleChatSelect = (id) => {
    fetchMessages(id);
    navigate("/home");
  };

  const handleTopicClick = (query) => {
    startNewChat();
    navigate("/home");
    // Small delay to ensure route transitions and states are initialized
    setTimeout(() => {
      sendMessage(query, true);
    }, 150);
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
            <Compass size={24} className="text-[#8e8e8e]" />
            <h1 className="text-3xl sm:text-4xl font-serif tracking-tight text-white">
              Discover
            </h1>
          </div>
          <p className="text-sm text-[#8e8e8e] mb-10 max-w-lg">
            Stay ahead with high-fidelity technical news, database updates, and compiler architectures curated for systems engineers.
          </p>

          <div className="grid grid-cols-1 gap-6">
            {trendingTopics.map((topic, index) => (
              <div
                key={index}
                onClick={() => handleTopicClick(topic.query)}
                className="bg-[#202222] border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all duration-300 group cursor-pointer flex flex-col gap-3 hover:translate-x-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#8e8e8e]">
                    {topic.icon}
                    <span>{topic.category}</span>
                  </div>
                  <span className="text-[10px] text-[#8e8e8e]">{topic.readTime}</span>
                </div>

                <h2 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                  {topic.title}
                </h2>

                <p className="text-sm text-[#8e8e8e] leading-relaxed">
                  {topic.description}
                </p>

                <div className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold mt-2 group-hover:underline">
                  <span>Query AI Copilot</span>
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </AppLayout>
  );
};

export default Discover;
