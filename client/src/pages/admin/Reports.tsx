
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Mock revenue data
const revenueData = [
  { month: 'Jan', revenue: 12500 },
  { month: 'Feb', revenue: 15000 },
  { month: 'Mar', revenue: 18000 },
  { month: 'Apr', revenue: 20000 },
  { month: 'May', revenue: 22500 },
  { month: 'Jun', revenue: 28000 },
  { month: 'Jul', revenue: 32000 },
  { month: 'Aug', revenue: 38000 },
  { month: 'Sep', revenue: 34000 },
  { month: 'Oct', revenue: 30000 },
  { month: 'Nov', revenue: 26000 },
  { month: 'Dec', revenue: 29000 },
];

// Mock booking data
const bookingData = [
  { name: 'Flights', value: 45 },
  { name: 'Hotels', value: 30 },
  { name: 'Tours', value: 15 },
  { name: 'Car Rentals', value: 10 },
];

// Colors for pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AdminReports = () => {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState('yearly');
  const [chartData, setChartData] = useState(revenueData);
  
  // Function to get data for different time ranges
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
    
    // In a real app, you would fetch different data based on the time range
    // For now, we'll just simulate different data
    if (value === 'monthly') {
      setChartData(revenueData.slice(-1));
    } else if (value === 'quarterly') {
      setChartData(revenueData.slice(-3));
    } else {
      setChartData(revenueData);
    }
  };
  
  // Calculate total revenue
  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
  
  // Calculate total bookings
  const totalBookings = bookingData.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{t('reports')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-sm text-gray-500">{t('totalRevenue')}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalBookings}</div>
            <p className="text-sm text-gray-500">{t('totalBookings')}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">87%</div>
            <p className="text-sm text-gray-500">{t('customerSatisfaction')}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">24%</div>
            <p className="text-sm text-gray-500">{t('growthRate')}</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl">{t('revenue')}</CardTitle>
            <Select value={timeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('selectRange')} />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="monthly">{t('lastMonth')}</SelectItem>
                <SelectItem value="quarterly">{t('lastQuarter')}</SelectItem>
                <SelectItem value="yearly">{t('fullYear')}</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`$${value}`, t('revenue')]} 
                  labelFormatter={(label) => `${t('month')}: ${label}`}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#00d0ff" name={t('revenue')} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t('bookingDistribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={bookingData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {bookingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} ${t('bookings')}`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl">{t('topDestinations')}</CardTitle>
            <Button variant="outline" size="sm">
              {t('downloadReport')}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border rounded-lg p-4 text-center">
                <div className="text-lg font-bold">Paris</div>
                <div className="text-sm text-gray-500">245 {t('bookings')}</div>
                <div className="mt-2 text-green-600">+15% {t('vs')}</div>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <div className="text-lg font-bold">Bali</div>
                <div className="text-sm text-gray-500">189 {t('bookings')}</div>
                <div className="mt-2 text-green-600">+22% {t('vs')}</div>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <div className="text-lg font-bold">New York</div>
                <div className="text-sm text-gray-500">176 {t('bookings')}</div>
                <div className="mt-2 text-green-600">+8% {t('vs')}</div>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <div className="text-lg font-bold">Tokyo</div>
                <div className="text-sm text-gray-500">132 {t('bookings')}</div>
                <div className="mt-2 text-green-600">+18% {t('vs')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminReports;
