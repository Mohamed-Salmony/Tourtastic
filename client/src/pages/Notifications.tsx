import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Mail, MapPin, Calendar, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

// Mock notifications data
const initialNotifications = [
  {
    id: 1,
    title: 'Booking Confirmed',
    message: 'Your booking for Paris has been confirmed. Check your email for details.',
    timestamp: new Date(2025, 4, 20, 14, 30),
    read: false,
    type: 'booking',
    icon: CheckCircle,
  },
  {
    id: 2,
    title: 'Payment Successful',
    message: 'Payment of $549.00 for your flight to Paris has been processed successfully.',
    timestamp: new Date(2025, 4, 19, 10, 15),
    read: true,
    type: 'payment',
    icon: CreditCard,
  },
  {
    id: 3,
    title: 'Flight Schedule Change',
    message: 'Your flight TS234 to Paris has been rescheduled. Please check the updated time.',
    timestamp: new Date(2025, 4, 18, 16, 45),
    read: false,
    type: 'alert',
    icon: AlertCircle,
  },
  {
    id: 4,
    title: 'New Destination Added',
    message: 'Explore our new destination - Tokyo, Japan! Check out our special introductory offers.',
    timestamp: new Date(2025, 4, 15, 9, 0),
    read: true,
    type: 'marketing',
    icon: MapPin,
  },
  {
    id: 5,
    title: 'Trip Reminder',
    message: 'Your trip to Paris is coming up in 7 days. Make sure you have everything ready!',
    timestamp: new Date(2025, 4, 14, 12, 30),
    read: true,
    type: 'reminder',
    icon: Calendar,
  },
  {
    id: 6,
    title: 'Newsletter',
    message: 'Our latest newsletter is out! Read about the top 10 beaches to visit this summer.',
    timestamp: new Date(2025, 4, 10, 8, 15),
    read: true,
    type: 'marketing',
    icon: Mail,
  },
];

// Notification type icon mapping
const typeIcons = {
  booking: CheckCircle,
  payment: CreditCard,
  alert: AlertCircle,
  marketing: Mail,
  reminder: Calendar,
};

// Get icon color based on notification type
const getIconColor = (type: string) => {
  switch (type) {
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
    default:
      return 'text-gray-500';
  }
};

const Notifications = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [activeTab, setActiveTab] = useState('all');
  
  // Get filtered notifications based on active tab
  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(notification => !notification.read);
  
  // Mark a notification as read
  const markAsRead = (id: number) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, read: true })));
    toast.success('All notifications marked as read');
  };
  
  // Format notification timestamp
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return `Today at ${format(timestamp, 'h:mm a')}`;
    } else if (diffInDays === 1) {
      return `Yesterday at ${format(timestamp, 'h:mm a')}`;
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return format(timestamp, 'MMM d, yyyy');
    }
  };
  
  return (
    <Layout>
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
    </Layout>
  );
};

// Notifications list component
interface NotificationsListProps {
  notifications: typeof initialNotifications;
  markAsRead: (id: number) => void;
  formatTimestamp: (timestamp: Date) => string;
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
        const IconComponent = notification.icon;
        
        return (
          <Card 
            key={notification.id} 
            className={`transition-all hover:shadow-md ${!notification.read ? 'bg-blue-50' : ''}`}
            onClick={() => !notification.read && markAsRead(notification.id)}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className={`mt-1 p-2 rounded-full bg-white ${getIconColor(notification.type)}`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h3 className="text-lg font-medium">{notification.title}</h3>
                    <span className="text-sm text-gray-500">{formatTimestamp(notification.timestamp)}</span>
                  </div>
                  
                  <p className="text-gray-600 mt-1">{notification.message}</p>
                  
                  {!notification.read && (
                    <div className="mt-3 flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
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
