import api from '@/config/api';

export const sendNotification = (formData: FormData) => {
  return api.post('/notifications/send', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
};

export const fetchNotificationsForUser = (userId: string) => {
  return api.get(`/notifications/${userId}`);
};

export const markNotificationRead = (notificationId: string) => {
  return api.put(`/notifications/mark-read/${notificationId}`);
};

export const markAllRead = () => {
  return api.put('/notifications/read-all');
};

export default { sendNotification, fetchNotificationsForUser, markNotificationRead, markAllRead };
