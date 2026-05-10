import React, { useState } from "react";
import Sidebar from "./Sidebar";

const AppLayout = ({ children, chats, currentChatId, onChatSelect, onNewChat }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Sidebar
        isCollapsed={isCollapsed}
        toggleCollapse={() => setIsCollapsed(!isCollapsed)}
        chats={chats}
        currentChatId={currentChatId}
        onChatSelect={onChatSelect}
        onNewChat={onNewChat}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
