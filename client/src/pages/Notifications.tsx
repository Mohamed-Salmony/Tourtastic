import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Mail, MapPin, Calendar, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Notification type icon mapping
const typeIcons = {
  welcome: Bell,
  booking: CheckCircle,
  payment: CreditCard,
  alert: AlertCircle,
  marketing: Mail,
  reminder: Calendar,
  profile: Bell,
  cart: Bell,
  system: Bell
};

// Get icon color based on notification type
const getIconColor = (type: string) => {
  switch (type) {
    case 'welcome':
      return 'text-blue-500';
    case 'booking':
      return 'text-green-500';
    case 'payment':
      return 'text-blue-500';
    case 'alert':
      return 'text-red-500';
    case 'marketing':
      return 'text-purple-500';
    case 'reminder':
      return 'text-yellow-500';
    case 'profile':
      return 'text-indigo-500';
    case 'cart':
      return 'text-orange-500';
    case 'system':
      return 'text-gray-500';
    default:
      return 'text-gray-500';
  }
};

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

const Notifications = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  // Get auth token from localStorage
  const getAuthToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return null;
    }
    return token;
  };

  // Configure axios with auth token
  const configureAxios = () => {
    const token = getAuthToken();
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      configureAxios();
      const response = await axios.get('/api/notifications');
      setNotifications(response.data.data);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      if (error.response?.status === 401) {
        // If unauthorized, redirect to login
        navigate('/login');
      } else {
        toast.error('Failed to load notifications');
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Get filtered notifications based on active tab
  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(notification => !notification.read);

  // Mark a notification as read
  const markAsRead = async (id: string) => {
    try {
      configureAxios();
      await axios.put(`/api/notifications/${id}/read`);
      setNotifications(notifications.map(notification => 
        notification._id === id ? { ...notification, read: true } : notification
      ));
      toast.success('Notification marked as read');
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        toast.error('Failed to mark notification as read');
      }
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      configureAxios();
      await axios.put('/api/notifications/read-all');
      setNotifications(notifications.map(notification => ({ ...notification, read: true })));
      toast.success('All notifications marked as read');
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        toast.error('Failed to mark all notifications as read');
      }
    }
  };

  // Format notification timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (diffInDays === 1) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

  if (loading) {
    return (
      <div className="container-custom py-12">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tourtastic-blue"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 py-12">
        <div className="container-custom">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-4">{t('notifications', 'Notifications')}</h1>
              <p className="text-gray-600">
                {t('notifications.description', 'Stay updated with your bookings, payments, and special offers.')}
              </p>
            </div>
            
            {filteredNotifications.some(notification => !notification.read) && (
              <Button onClick={markAllAsRead}>
                {t('notifications.markAllAsRead', 'Mark All as Read')}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="py-12 container-custom">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="all">{t('notifications.tabs.all', 'All')}</TabsTrigger>
              <TabsTrigger value="unread">{t('notifications.tabs.unread', 'Unread')}</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="all" className="mt-0">
            <NotificationsList 
              notifications={filteredNotifications} 
              markAsRead={markAsRead} 
              formatTimestamp={formatTimestamp} 
              getIconColor={getIconColor}
            />
          </TabsContent>
          
          <TabsContent value="unread" className="mt-0">
            <NotificationsList 
              notifications={filteredNotifications} 
              markAsRead={markAsRead} 
              formatTimestamp={formatTimestamp}
              getIconColor={getIconColor}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

// Notifications list component
interface NotificationsListProps {
  notifications: Notification[];
  markAsRead: (id: string) => void;
  formatTimestamp: (timestamp: string) => string;
  getIconColor: (type: string) => string;
}

const NotificationsList: React.FC<NotificationsListProps> = ({ 
  notifications, 
  markAsRead, 
  formatTimestamp,
  getIconColor
}) => {
  const { t } = useTranslation();

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">{t('notifications.empty', 'No notifications')}</h3>
          <p className="text-gray-500">
            {t('notifications.emptyDescription', "You're all caught up! There are no notifications to display.")}
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {notifications.map((notification) => {
        const IconComponent = typeIcons[notification.type as keyof typeof typeIcons] || Bell;
        
        return (
          <Card 
            key={notification._id} 
            className={`transition-all hover:shadow-md ${!notification.read ? 'bg-blue-50' : ''}`}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className={`mt-1 p-2 rounded-full bg-white ${getIconColor(notification.type)}`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h3 className="text-lg font-medium">{notification.title}</h3>
                    <span className="text-sm text-gray-500">{formatTimestamp(notification.createdAt)}</span>
                  </div>
                  
                  <p className="text-gray-600 mt-1">{notification.message}</p>
                  
                  {!notification.read && (
                    <div className="mt-3 flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => markAsRead(notification._id)}>
                        {t('notifications.markAsRead', 'Mark as Read')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default Notifications;
