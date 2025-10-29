import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

export const useMessageStore = create((set, get) => ({
  messages: [],
  isFetchingMessages: false,
  error: null,

  // Fetch messages from API
  fetchMessages: async () => {
    set({ isFetchingMessages: true, error: null });
    try {
      const response = await axiosInstance.get("/messages");
      set({ messages: response.data });
    } catch (error) {
      console.error("Error fetching messages:", error);
      set({ error: error.response?.data?.error || error.message || "Failed to fetch messages" });
    } finally {
      set({ isFetchingMessages: false });
    }
  },

  // Add a single message (useful for real-time updates)
  addMessage: (message) => {
    const { messages } = get();
    
    // Avoid duplicates based on src and msg_id
    const isDuplicate = messages.some(
      msg => msg.src === message.src && msg.msg_id === message.msg_id
    );
    
    if (!isDuplicate) {
      const updatedMessages = [...messages, message];
      
      // Limit to last 200 messages
      if (updatedMessages.length > 200) {
        updatedMessages.shift();
      }
      
      set({ messages: updatedMessages });
    }
  },

  // Clear all messages
  clearMessages: async () => {
    try {
      await axiosInstance.post("/test/clear");
      set({ messages: [], error: null });
    } catch (error) {
      console.error("Error clearing messages:", error);
      set({ error: error.response?.data?.error || error.message || "Failed to clear messages" });
    }
  },

  // Reset store state
  resetMessages: () => set({ messages: [], error: null, isFetchingMessages: false }),
}));