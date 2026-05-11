import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import AppLayout from "../components/layout/AppLayout";
import { clearUser } from "../../auth/slice/auth.slice";
import { API } from "../../../api/axios.api";
import { User, Mail, LogOut, ArrowLeft } from "lucide-react";
import { useChat } from "../hooks/useChat";

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const {
    chats,
    chatId,
    fetchChats,
    fetchMessages,
    startNewChat,
  } = useChat();

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      // Call backend to clear httpOnly cookies
      await API.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear redux state and redirect regardless of backend success
      dispatch(clearUser());
      navigate("/login", { replace: true });
    }
  };

  const handleChatSelect = (id) => {
    // Navigate back to home and open the selected chat
    fetchMessages(id);
    navigate("/home");
  };

  const handleNewChat = () => {
    startNewChat();
    navigate("/home");
  };

  // Get user initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <AppLayout
      chats={chats}
      currentChatId={chatId}
      onChatSelect={handleChatSelect}
      onNewChat={handleNewChat}
    >
      <div className="flex flex-col h-full w-full bg-[#171615] text-[#e8e8e6] overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-12">
          
          <button 
            onClick={() => navigate("/home")}
            className="flex items-center gap-2 text-[#8e8e8e] hover:text-white transition-colors mb-8 w-fit"
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </button>

          <h1 className="text-3xl sm:text-4xl font-serif tracking-tight text-white mb-10">
            Profile Settings
          </h1>

          <div className="bg-[#202222] border border-white/5 rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              
              {/* Avatar Section */}
              <div className="relative">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="w-28 h-28 rounded-full object-cover border-4 border-[#2f3131]"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-linear-to-br from-[#2f3131] to-[#1a1c1c] border-4 border-[#202222] flex items-center justify-center shadow-inner">
                    <span className="text-3xl font-serif text-white tracking-widest">
                      {getInitials(user?.name)}
                    </span>
                  </div>
                )}
              </div>

              {/* User Details */}
              <div className="flex-1 w-full space-y-4 text-center sm:text-left">
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-1">
                    {user?.name || "Anonymous User"}
                  </h2>
                  <p className="text-[#8e8e8e] flex items-center justify-center sm:justify-start gap-2">
                    <Mail size={14} />
                    {user?.email || "No email provided"}
                  </p>
                </div>

                <div className="pt-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-xs font-medium text-[#e8e8e6] border border-white/10">
                    <User size={12} />
                    Free Plan
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-white/5">
              <h3 className="text-sm font-semibold text-[#8e8e8e] uppercase tracking-wider mb-4">
                Account Actions
              </h3>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center justify-center sm:justify-start gap-3 w-full sm:w-auto px-6 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut size={18} />
                {isLoggingOut ? "Logging out..." : "Log out of account"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
