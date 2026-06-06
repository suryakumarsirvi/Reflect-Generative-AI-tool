import { useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { API } from "../../../api/axios.api";
import {
  setChats,
  setCurrentChatId,
  setMessages,
  addMessage,
  updateLastMessage,
  updateLastMessageThought,
  setLastMessageSources,
  setLastMessageVisuals,
  truncateMessagesAfterIndex,
  setIsLoading,
  setIsStreaming,
  updateChatInList,
  deleteChatSuccess,
} from "../store/chat.slice";

export const useChat = () => {
  const dispatch = useDispatch();
  const { messages, isLoading, isStreaming, currentChatId: chatId, chats } = useSelector((state) => state.chat);
  const accessToken = useSelector((state) => state.auth.accessToken);
  const abortControllerRef = useRef(null);

  const fetchChats = useCallback(async () => {
    try {
      const response = await API.get("/chat");
      if (response.data.success) {
        dispatch(setChats(response.data.data));
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  }, [dispatch]);

  const fetchMessages = useCallback(async (selectedChatId) => {
    try {
      dispatch(setIsLoading(true));
      const response = await API.get(`/chat/${selectedChatId}/messages`);
      if (response.data.success) {
        dispatch(setMessages(response.data.data));
        dispatch(setCurrentChatId(selectedChatId));
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      dispatch(setIsLoading(false));
    }
  }, [dispatch]);

  const sendMessage = useCallback(
    async (message, useWebSearch = false, forcedChatId = null, truncateAfterMessageId = null) => {
      if (!message.trim() || isStreaming) return;

      try {
        dispatch(setIsLoading(true));
        
        // If truncateAfterMessageId is provided, we truncate messages after that index
        if (truncateAfterMessageId) {
          const index = messages.findIndex((m) => m._id === truncateAfterMessageId || m.id === truncateAfterMessageId);
          if (index !== -1) {
            dispatch(truncateMessagesAfterIndex(index + 1));
          }
        } else {
          // Ensure user message is appended
          dispatch(addMessage({ role: "user", content: message }));
        }

        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        const assistantMessageId = Date.now().toString();
        dispatch(addMessage({ role: "assistant", content: "", id: assistantMessageId, isStreaming: true }));
        dispatch(setIsStreaming(true));

        const headers = {
          "Content-Type": "application/json",
        };
        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`;
        }

        const targetChatId = forcedChatId || chatId;

        const response = await fetch(`${import.meta.env.VITE_API_URL || "/api"}/chat`, {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({ message, chatId: targetChatId, useWebSearch, truncateAfterMessageId }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === "meta") {
                  if (!chatId) {
                    dispatch(setCurrentChatId(data.chat._id));
                    dispatch(updateChatInList(data.chat));
                  }
                } else if (data.type === "message") {
                  dispatch(updateLastMessage(data.text));
                } else if (data.type === "thought") {
                  dispatch(updateLastMessageThought(data.text));
                } else if (data.type === "sources") {
                  dispatch(setLastMessageSources(data.sources));
                } else if (data.type === "visuals") {
                  dispatch(setLastMessageVisuals(data.visuals));
                } else if (data.error) {
                  throw new Error(data.error);
                }
              } catch (e) {
                console.error("Error parsing SSE data:", e);
              }
            }
          }
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error sending message:", error);
          dispatch(updateLastMessage("\n\n**Error generating response.** Please try again."));
        }
      } finally {
        dispatch(setIsStreaming(false));
        dispatch(setIsLoading(false));
      }
    },
    [chatId, accessToken, dispatch, messages]
  );

  const startNewChat = useCallback(() => {
    dispatch(setCurrentChatId(null));
    dispatch(setMessages([]));
  }, [dispatch]);

  const stopGenerating = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      dispatch(setIsStreaming(false));
      dispatch(setIsLoading(false));
    }
  }, [dispatch]);

  const deleteChat = useCallback(async (targetChatId) => {
    try {
      const response = await API.delete(`/chat/${targetChatId}`);
      if (response.data.success) {
        dispatch(deleteChatSuccess(targetChatId));
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  }, [dispatch]);

  return {
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
    deleteChat,
  };
};
