import API from "./axios";

export const notificationApi = {
  // Get unread notifications
  getUnread: async (limit = 50) => {
    const { data } = await API.get(`/notifications/unread?limit=${limit}`);
    return data;
  },

  // Get recent notifications
  getRecent: async (limit = 50) => {
    const { data } = await API.get(`/notifications/recent?limit=${limit}`);
    return data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const { data } = await API.get("/notifications/unread-count");
    return data.count;
  },

  // Mark as read
  markAsRead: async (notificationId) => {
    const { data } = await API.put(`/notifications/${notificationId}/read`);
    return data;
  },

  // Mark all as read
  markAllAsRead: async () => {
    const { data } = await API.put("/notifications/mark-all-read");
    return data;
  },
};

export default notificationApi;
