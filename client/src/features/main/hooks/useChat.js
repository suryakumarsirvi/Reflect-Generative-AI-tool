import { useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { API } from "../../../api/axios.api";
import {
  setChats,
  setCurrentChatId,
  setMessages,
  addMessage,
  updateLastMessage,
  setIsLoading,
  setIsStreaming,
  updateChatInList,
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
    async (message, useWebSearch = false) => {
      if (!message.trim() || isStreaming) return;

      try {
        dispatch(setIsLoading(true));
        
        // Ensure user message is appended
        dispatch(addMessage({ role: "user", content: message }));

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

        const response = await fetch(`${import.meta.env.VITE_API_URL || "/api"}/chat`, {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({ message, chatId: chatId, useWebSearch }),
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
    [chatId, accessToken, dispatch]
  );

  const startNewChat = useCallback(() => {
    dispatch(setCurrentChatId(null));
    dispatch(setMessages([]));
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
  };
};
