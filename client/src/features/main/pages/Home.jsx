import React, { useEffect } from "react";
import AppLayout from "../components/layout/AppLayout";
import ChatInterface from "../components/chat/ChatInterface";
import { useChat } from "../hooks/useChat";

const Home = () => {
  const {
    messages,
    isLoading,
    isStreaming,
    chatId,
    chats,
    sendMessage,
    fetchChats,
    fetchMessages,
    startNewChat,
    stopGenerating,
  } = useChat();

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  return (
    <AppLayout 
      chats={chats} 
      currentChatId={chatId} 
      onChatSelect={fetchMessages} 
      onNewChat={startNewChat}
    >
      <ChatInterface 
        messages={messages} 
        isLoading={isLoading} 
        isStreaming={isStreaming}
        sendMessage={sendMessage} 
        onNewChat={startNewChat}
        stopGenerating={stopGenerating}
        chatId={chatId}
      />
    </AppLayout>
  );
};

export default Home;