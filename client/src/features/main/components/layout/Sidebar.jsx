import React from "react";
import { cn } from "@/lib/utils";
import { 
  Plus, 
  Search, 
  Library,
  Compass,
  User,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";

const Sidebar = ({ 
  isCollapsed, 
  toggleCollapse, 
  chats = [], 
  onChatSelect, 
  onNewChat,
  currentChatId 
}) => {
  return (
    <div
      className={cn(
        "h-screen flex flex-col bg-[#202222] text-[#e8e8e6] border-r border-white/5 transition-all duration-300 ease-in-out relative",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Top Header */}
      <div className="p-4 flex items-center justify-between h-16">
        {!isCollapsed && (
          <div className="flex items-center gap-2 px-2 font-serif text-xl tracking-tight text-white">
            <img src="/svg/perplexity.svg" alt="Perplexity Logo" className="w-6 h-6 invert" />
            <span>Perplexity</span>
          </div>
        )}
        {isCollapsed && (
          <div className="w-full flex justify-center">
             <img src="/svg/perplexity.svg" alt="Perplexity Logo" className="w-6 h-6 invert" />
          </div>
        )}
      </div>

      <div className="px-3 pb-4">
        <button
          onClick={onNewChat}
          className={cn(
            "w-full flex items-center justify-between gap-2 px-3 py-2 bg-[#2f3131] hover:bg-[#3f4141] text-[#e8e8e6] rounded-full transition-colors group",
            isCollapsed && "justify-center px-0 h-10 w-10 mx-auto"
          )}
        >
          {!isCollapsed && <span className="text-sm font-medium">New Thread</span>}
          <div className="flex items-center justify-center bg-[#202222] rounded-full p-1 group-hover:bg-[#4d4f4f] transition-colors">
            <Plus size={16} />
          </div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-hide">
        <SidebarItem 
          icon={<Compass size={18} strokeWidth={2} />} 
          label="Discover" 
          isCollapsed={isCollapsed} 
        />
        <SidebarItem 
          icon={<Library size={18} strokeWidth={2} />} 
          label="Library" 
          isCollapsed={isCollapsed} 
        />
        
        {!isCollapsed && (
          <div className="mt-8 px-2">
            <h3 className="text-xs font-semibold text-[#8e8e8e] uppercase tracking-wider mb-2">
              Recent Threads
            </h3>
          </div>
        )}

        <div className="space-y-1">
          {chats.map((chat) => (
            <SidebarItem
              key={chat._id}
              icon={<Search size={16} className="text-[#8e8e8e]" strokeWidth={2} />}
              label={chat.title}
              isCollapsed={isCollapsed}
              isActive={currentChatId === chat._id}
              onClick={() => onChatSelect(chat._id)}
            />
          ))}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-white/5 space-y-1">
        <SidebarItem 
          icon={<User size={18} strokeWidth={2} />} 
          label="Profile" 
          isCollapsed={isCollapsed} 
        />
        <button
          onClick={toggleCollapse}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer text-[#8e8e8e] hover:text-[#e8e8e6] hover:bg-white/5 transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <div className={cn("shrink-0", isCollapsed && "mx-auto")}>
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </div>
          {!isCollapsed && (
            <span className="text-sm font-medium">
              Collapse
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon, label, isCollapsed, isActive, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors group",
        isActive 
          ? "bg-[#2f3131] text-white" 
          : "text-[#8e8e8e] hover:bg-white/5 hover:text-[#e8e8e6]",
        isCollapsed && "justify-center px-0 py-3"
      )}
      title={isCollapsed ? label : ""}
    >
      <div className="shrink-0">
        {icon}
      </div>
      {!isCollapsed && (
        <span className="text-sm truncate font-medium">
          {label}
        </span>
      )}
    </div>
  );
};

export default Sidebar;
