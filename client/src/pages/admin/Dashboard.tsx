
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend 
} from 'recharts';

// Mock data for charts and statistics
const monthlyRevenueData = [
  { name: 'Jan', revenue: 18000 },
  { name: 'Feb', revenue: 22000 },
  { name: 'Mar', revenue: 32000 },
  { name: 'Apr', revenue: 27000 },
  { name: 'May', revenue: 35000 },
  { name: 'Jun', revenue: 42000 },
  { name: 'Jul', revenue: 38000 },
];

const bookingTypeData = [
  { name: 'Flights', value: 40 },
  { name: 'Hotels', value: 30 },
  { name: 'Packages', value: 20 },
  { name: 'Experiences', value: 10 },
];

const AdminDashboard: React.FC = () => {
  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Bookings"
          value="1,284"
          change="+12.5%"
          trend="up"
          description="vs. previous month"
        />
        <StatsCard
          title="Revenue"
          value="$214,500"
          change="+8.2%"
          trend="up"
          description="vs. previous month"
        />
        <StatsCard
          title="New Users"
          value="384"
          change="+18.7%"
          trend="up"
          description="vs. previous month"
        />
        <StatsCard
          title="Avg. Booking Value"
          value="$167"
          change="-3.1%"
          trend="down"
          description="vs. previous month"
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Revenue Chart */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-6">Monthly Revenue</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis 
                    tickFormatter={(value) => `$${value/1000}k`}
                  />
                  <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#00d0ff" 
                    strokeWidth={2} 
                    dot={{ r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Booking Distribution Chart */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-6">Booking Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={bookingTypeData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `${value}%`} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                  <Legend />
                  <Bar dataKey="value" fill="#00d0ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Activity */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold mb-6">Recent Activity</h3>
          <div className="space-y-4">
            <ActivityItem
              type="booking"
              title="New Booking: Paris Trip Package"
              user="John Smith"
              time="2 hours ago"
              amount="$1,249"
            />
            <ActivityItem
              type="user"
              title="New User Registration"
              user="Emma Watson"
              time="3 hours ago"
            />
            <ActivityItem
              type="booking"
              title="New Booking: Tokyo Flight"
              user="Michael Johnson"
              time="5 hours ago"
              amount="$879"
            />
            <ActivityItem
              type="refund"
              title="Refund Processed"
              user="Sarah Williams"
              time="6 hours ago"
              amount="$349"
            />
            <ActivityItem
              type="booking"
              title="New Booking: Bali Resort"
              user="David Brown"
              time="8 hours ago"
              amount="$1,599"
            />
          </div>
          <div className="mt-6 text-center">
            <button className="text-tourtastic-blue hover:underline">View All Activity</button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  description: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, change, trend, description }) => {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className="flex items-baseline mt-4">
          <span className="text-3xl font-bold">{value}</span>
          <span className={`ml-2 text-sm font-medium ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {change}
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500">{description}</p>
      </CardContent>
    </Card>
  );
};

// Activity Item Component
interface ActivityItemProps {
  type: 'booking' | 'user' | 'refund';
  title: string;
  user: string;
  time: string;
  amount?: string;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ type, title, user, time, amount }) => {
  const getTypeIcon = () => {
    switch (type) {
      case 'booking':
        return (
          <div className="rounded-full bg-green-100 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
              <line x1="16" x2="16" y1="2" y2="6"></line>
              <line x1="8" x2="8" y1="2" y2="6"></line>
              <line x1="3" x2="21" y1="10" y2="10"></line>
            </svg>
          </div>
        );
      case 'user':
        return (
          <div className="rounded-full bg-blue-100 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        );
      case 'refund':
        return (
          <div className="rounded-full bg-red-100 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
              <path d="M22 7H2V11H22V7Z" />
              <path d="M12 22L12 11" />
              <path d="M9 14L12 11L15 14" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center">
      {getTypeIcon()}
      <div className="ml-4 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-gray-500">by {user} • {time}</p>
      </div>
      {amount && (
        <div className="text-sm font-medium">{amount}</div>
      )}
    </div>
  );
};

export default AdminDashboard;
