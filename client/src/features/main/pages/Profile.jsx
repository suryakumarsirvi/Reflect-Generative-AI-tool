import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import AppLayout from "../components/layout/AppLayout";
import { clearUser, updateUserProfile } from "../../auth/slice/auth.slice";
import { setGoProModalOpen } from "../store/chat.slice";
import { API } from "../../../api/axios.api";
import { User, Mail, LogOut, ArrowLeft, Settings, Save, Sparkles, Plus, X } from "lucide-react";
import { useChat } from "../hooks/useChat";

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [fullname, setFullname] = useState("");
  const [tone, setTone] = useState("neutral");
  const [searchStyle, setSearchStyle] = useState("fast");
  const [interestTags, setInterestTags] = useState([]);
  const [newTag, setNewTag] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

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

  // Sync state when user profile is loaded
  useEffect(() => {
    if (user) {
      setFullname(user.fullname || "");
      setTone(user.preferences?.tone || "neutral");
      setSearchStyle(user.preferences?.search_style || "fast");
      setInterestTags(user.preferences?.interest_tags || []);
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const payload = {
        fullname,
        preferences: {
          tone,
          search_style: searchStyle,
          interest_tags: interestTags
        }
      };

      const response = await API.put("/auth/profile", payload);
      if (response.data.success) {
        dispatch(updateUserProfile(response.data.data));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Save profile error:", err);
      setSaveError(err.response?.data?.message || "Failed to update profile settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    const tag = newTag.trim();
    if (tag && !interestTags.includes(tag)) {
      setInterestTags([...interestTags, tag]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setInterestTags(interestTags.filter((t) => t !== tagToRemove));
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await API.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      dispatch(clearUser());
      navigate("/login", { replace: true });
    }
  };

  const handleChatSelect = (id) => {
    fetchMessages(id);
    navigate("/home");
  };

  const handleNewChat = () => {
    startNewChat();
    navigate("/home");
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const isPro = user?.tier === "pro";

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
            className="flex items-center gap-2 text-[#8e8e8e] hover:text-white transition-colors mb-8 w-fit cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </button>

          <h1 className="text-3xl sm:text-4xl font-serif tracking-tight text-white mb-10">
            Profile Settings
          </h1>

          <div className="bg-[#202222] border border-white/5 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col gap-8">

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-white/5">
              <div className="relative">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.fullname}
                    className="w-24 h-24 rounded-full object-cover border-4 border-[#2f3131]"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-linear-to-br from-[#2f3131] to-[#1a1c1c] border-4 border-[#202222] flex items-center justify-center shadow-inner">
                    <span className="text-2xl font-serif text-white tracking-widest">
                      {getInitials(user?.fullname)}
                    </span>
                  </div>
                )}
                {isPro && (
                  <span className="absolute -bottom-1 -right-1 p-1.5 bg-amber-500 rounded-full text-black shadow-md">
                    <Sparkles size={12} />
                  </span>
                )}
              </div>

              <div className="flex-1 w-full text-center sm:text-left space-y-2">
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    {user?.fullname || "Anonymous User"}
                  </h2>
                  <p className="text-[#8e8e8e] text-sm flex items-center justify-center sm:justify-start gap-2 mt-0.5">
                    <Mail size={13} />
                    {user?.email || "No email provided"}
                  </p>
                </div>

                <div className="pt-1">
                  {isPro ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 text-xs font-bold border border-amber-500/20 shadow-sm animate-pulse">
                      <Sparkles size={12} />
                      PRO ACCOUNT
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-xs font-medium text-[#e8e8e6] border border-white/10">
                        <User size={12} />
                        Free Tier
                      </div>
                      <button
                        onClick={() => dispatch(setGoProModalOpen(true))}
                        className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline cursor-pointer"
                      >
                        Upgrade to unlock Pro features
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Forms */}
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">

              <div className="flex items-center gap-2 text-white font-semibold">
                <Settings size={18} className="text-amber-500" />
                <span>Search & Reasoning Preferences</span>
              </div>

              {saveSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm animate-in fade-in">
                  Profile and search preferences saved successfully!
                </div>
              )}

              {saveError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm animate-in fade-in">
                  {saveError}
                </div>
              )}

              {/* Display Name Input */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#8e8e8e]">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  className="bg-[#262828] border border-white/10 rounded-xl px-4 py-3 text-white outline-hidden focus:border-amber-500/50 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Tone Dropdown */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#8e8e8e]">
                    AI Response Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="bg-[#262828] border border-white/10 rounded-xl px-4 py-3 text-white outline-hidden focus:border-amber-500/50 transition-colors cursor-pointer"
                  >
                    <option value="neutral">Neutral & Objective</option>
                    <option value="technical">Technical (Engineer Mode)</option>
                    <option value="simple">Simple (ELI5 / Generalist)</option>
                  </select>
                </div>

                {/* Search Style Dropdown */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#8e8e8e]">
                    Default Search Behavior
                  </label>
                  <select
                    value={searchStyle}
                    onChange={(e) => setSearchStyle(e.target.value)}
                    className="bg-[#262828] border border-white/10 rounded-xl px-4 py-3 text-white outline-hidden focus:border-amber-500/50 transition-colors cursor-pointer"
                  >
                    <option value="fast">Fast Search (Standard)</option>
                    <option value="deep">Deep Research (Advanced Depth)</option>
                  </select>
                </div>

              </div>

              {/* Interest Tags Section */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold uppercase tracking-wider text-[#8e8e8e]">
                  Interest Tags (AI Context personalization)
                </label>

                <div className="flex flex-wrap gap-2 p-3 bg-[#262828] border border-white/10 rounded-xl min-h-16">
                  {interestTags.length === 0 ? (
                    <span className="text-[#5c5d5d] text-sm self-center">No interests added. Type below to customize reasoning contexts.</span>
                  ) : (
                    interestTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-[#e8e8e6] transition-colors"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-400 p-0.5 rounded-full cursor-pointer"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add an interest (e.g. Next.js, Finance, React)"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="flex-1 bg-[#262828] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-hidden focus:border-amber-500/50 transition-colors"
                  />
                  <button
                    onClick={handleAddTag}
                    type="button"
                    className="px-4 py-2 bg-[#2f3131] hover:bg-[#3f4141] border border-white/5 text-[#e8e8e6] text-sm font-semibold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={16} />
                    Add
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto self-end px-6 py-3 bg-white text-black hover:bg-neutral-200 font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                {isSaving ? "Saving changes..." : "Save Settings"}
              </button>

            </form>

            {/* Logout actions */}
            <div className="mt-6 pt-6 border-t border-white/5 flex flex-col gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8e8e8e]">
                Account Actions
              </h3>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center justify-center sm:justify-start gap-3 w-full sm:w-auto px-6 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
