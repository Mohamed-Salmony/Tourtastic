import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Mail, MapPin, Calendar, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import i18n from '@/i18n';
import notificationService from '@/services/notificationService';
import { useAuth } from '@/hooks/useAuth';

// small type guard for axios-like errors
function isAxiosErrorWithStatus(err: unknown): err is { response?: { status?: number } } {
  return typeof err === 'object' && err !== null && 'response' in err;
}

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

interface PopulatedUser {
  _id?: string;
  name?: string;
  email?: string;
  username?: string;
}

interface Notification {
  _id: string;
  title: {
    en: string;
    ar: string;
  };
  message: {
    en: string;
    ar: string;
  };
  type: string;
  read: boolean;
  createdAt: string;
  pdfUrl?: string | null;
  userId?: PopulatedUser | string;
}

const Notifications = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  // Tabs onValueChange provides a string; normalize to our narrow union
  const handleTabChange = (value: string) => {
    if (value === 'all' || value === 'unread') {
      setActiveTab(value);
    }
  };
  const [loading, setLoading] = useState(true);

  const { user, loading: authLoading } = useAuth();

  // Fetch notifications by userId
  const fetchNotifications = useCallback(async () => {
    try {
      // If auth is still initializing, skip fetching until we have a definitive user value
      if (authLoading) return;
      if (!user) return navigate('/login');
  const userId = (user.id ?? (user as unknown as { _id?: string })?._id) as string | undefined;
  if (!userId) return navigate('/login');
      const response = await notificationService.fetchNotificationsForUser(userId);
      setNotifications(response.data.data);
      setLoading(false);
    } catch (error: unknown) {
      console.error('Error fetching notifications:', error);
  if (isAxiosErrorWithStatus(error) && error.response?.status === 401) {
        navigate('/login');
      } else {
        toast.error(t('notifications.fetchError') || 'Failed to fetch notifications');
      }
      setLoading(false);
    }
  }, [navigate, t, user, authLoading]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Get filtered notifications based on active tab
  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(notification => !notification.read);

  // PDF preview state moved to NotificationsList (local to list component)

  // Mark a notification as read
  const markAsRead = async (id: string) => {
    try {
      await notificationService.markNotificationRead(id);
      setNotifications(notifications.map(notification => (notification._id === id ? { ...notification, read: true } : notification)));
      toast.success(t('notifications.markAsReadSuccess'));
    } catch (error: unknown) {
      console.error('Error marking notification as read:', error);
  if (isAxiosErrorWithStatus(error) && error.response?.status === 401) {
        navigate('/login');
      } else {
        toast.error(t('notifications.markAsReadError') || 'Failed to mark notification');
      }
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications(notifications.map(notification => ({ ...notification, read: true })));
      toast.success(t('notifications.markAllAsReadSuccess'));
    } catch (error: unknown) {
      console.error('Error marking all notifications as read:', error);
  if (isAxiosErrorWithStatus(error) && error.response?.status === 401) {
        navigate('/login');
      } else {
        toast.error(t('notifications.markAllAsReadError') || 'Failed to mark all notifications');
      }
    }
  };

  // Format notification timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    const isArabic = i18n.language === 'ar';
    
    if (diffInDays === 0) {
      return isArabic 
        ? `اليوم ${format(date, 'h:mm a')}` 
        : `Today at ${format(date, 'h:mm a')}`;
    } else if (diffInDays === 1) {
      return isArabic
        ? `أمس ${format(date, 'h:mm a')}`
        : `Yesterday at ${format(date, 'h:mm a')}`;
    } else if (diffInDays < 7) {
      return isArabic
        ? `منذ ${diffInDays} ${diffInDays === 1 ? 'يوم' : 'أيام'}`
        : `${diffInDays} days ago`;
    } else {
      // For Arabic, we'll use a different date format
      return isArabic
        ? format(date, 'dd/MM/yyyy')
        : format(date, 'MMM d, yyyy');
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
              <h1 className="text-4xl font-bold mb-4">{t('notifications.title')}</h1>
              <p className="text-gray-600">
                {t('notifications.description')}
              </p>
            </div>
            
            {filteredNotifications.some(notification => !notification.read) && (
              <Button onClick={markAllAsRead}>
                {t('notifications.markAllAsRead')}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="py-12 container-custom">
  <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="all">{t('notifications.tabs.all')}</TabsTrigger>
              <TabsTrigger value="unread">{t('notifications.tabs.unread')}</TabsTrigger>
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
  const [previewOpen, setPreviewOpen] = useState<Record<string, boolean>>({});

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">{t('notifications.empty')}</h3>
          <p className="text-gray-500">
            {t('notifications.emptyDescription')}
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {notifications.map((notification) => {
        const IconComponent = typeIcons[notification.type as keyof typeof typeIcons] || Bell;
        const populatedUser = notification.userId && typeof notification.userId !== 'string' ? notification.userId as PopulatedUser : undefined;
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
                    <h3 className="text-lg font-medium">
                      {i18n.language === 'ar' ? notification.title.ar : notification.title.en}
                    </h3>
                    <span className="text-sm text-gray-500">{formatTimestamp(notification.createdAt)}</span>
                  </div>
                  
                  <p className="text-gray-600 mt-1">
                    {i18n.language === 'ar' ? notification.message.ar : notification.message.en}
                  </p>

                  {/* PDF link and inline preview toggle */}
                  {notification.pdfUrl && (
                    <div className="mt-3">
                      <a href={notification.pdfUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline mr-3">
                        {i18n.language === 'ar' ? 'تحميل ملف PDF' : 'Download PDF File'}
                      </a>
                      <button className="text-sm text-gray-600" onClick={() => setPreviewOpen(prev => ({ ...prev, [notification._id]: !prev[notification._id] }))}>
                        {previewOpen[notification._id] ? (i18n.language === 'ar' ? 'إخفاء المعاينة' : 'Hide preview') : (i18n.language === 'ar' ? 'عرض المعاينة' : 'Show preview')}
                      </button>
                      {previewOpen[notification._id] && (
                        <div className="mt-2 border rounded overflow-hidden" style={{height: 400}}>
                          <iframe src={notification.pdfUrl} title={`attachment-${notification._id}`} className="w-full h-full" />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!notification.read && (
                    <div className="mt-3 flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => markAsRead(notification._id)}>
                        {t('notifications.markAsRead')}
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
