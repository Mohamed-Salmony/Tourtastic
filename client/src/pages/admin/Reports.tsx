
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '@/config/api';
import currency, { formatSypFromUsd, getSypRate, setSypRate } from '@/utils/currency';
import { saveAs } from 'file-saver';

const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Colors for pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

type BookingRecord = {
  _id?: string;
  bookingId?: string;
  userId?: { name?: string; email?: string } | string;
  destination?: string;
  bookingDate?: string | Date;
  createdAt?: string | Date;
  amount?: number;
  // include nested selectedFlight price shape to satisfy TS when accessing details.flightDetails.selectedFlight.price.total
  details?: { flightDetails?: { from?: string; to?: string; selectedFlight?: { price?: { total?: number }, [key: string]: any } } } | any;
  status?: string;
  customerName?: string;
};

type SearchLogRecord = {
  _id?: string;
  from?: string;
  to?: string;
  // backend aggregated shape
  count?: number;
  lastSearchedAt?: string | Date;
  // legacy shape fallback
  searchedAt?: string | Date;
  resultsCount?: number;
};

type DistributionEntry = { name: string; value: number; percent?: number };
type TopDestination = { destination: string; bookings: number; growthPercent: number };

const AdminReports: React.FC = () => {
  const { t } = useTranslation();
  const [revenueByMonth, setRevenueByMonth] = useState<number[]>(Array(12).fill(0));
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [sypRate, setSypRateState] = useState<number>(getSypRate());
  const [totalBookings, setTotalBookings] = useState<number>(0);
  const [bookingDistribution, setBookingDistribution] = useState<DistributionEntry[]>([]);
  const [topDestinations, setTopDestinations] = useState<TopDestination[]>([]);
  const [searchLogs, setSearchLogs] = useState<SearchLogRecord[]>([]);
  const [orders, setOrders] = useState<BookingRecord[]>([]);
  const [growthRate, setGrowthRate] = useState<{ revenue?: number; bookings?: number }>({});

  useEffect(() => { fetchReports(); fetchOrders(); loadSypFromServer(); }, []);

  const loadSypFromServer = async () => {
    try {
      const resp = await api.get('/settings/sypRate');
      if (resp.data && resp.data.success && resp.data.data != null) {
        const v = Number(resp.data.data);
        if (!isNaN(v) && v > 0) {
          setSypRateState(v);
          setSypRate(v);
        }
      }
    } catch (e) {
      // ignore and use local value
    }
  };

  const fetchReports = async (year?: number) => {
    try {
      const res = await api.get('/admin/reports', { params: { year } });
      if (res.data && res.data.success) {
        const d = res.data.data as {
          totalRevenue?: number;
          totalBookings?: number;
          revenueByMonth?: number[];
          bookingDistribution?: DistributionEntry[];
          topDestinations?: TopDestination[];
          searchLogs?: any[];
          growthRate?: { revenue?: number; bookings?: number };
        };
        setTotalRevenue(d.totalRevenue || 0);
        setTotalBookings(d.totalBookings || 0);
        setRevenueByMonth((d.revenueByMonth || []).map((v:number,i:number) => v));
        setBookingDistribution(d.bookingDistribution || []);
        setTopDestinations(d.topDestinations || []);
        setSearchLogs((d.searchLogs || []) as SearchLogRecord[]);
        setGrowthRate(d.growthRate || {});
      }
    } catch (err) {
      console.error('Failed to fetch reports', err);
    }
  };

  const fetchOrders = async () => {
    try {
      // Use flight bookings endpoint and show only completed tickets (status = done)
      const res = await api.get('/admin/flight-bookings');
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        const all = res.data.data as any[];
        const doneOnly = all.filter(b => (b?.status || '').toLowerCase() === 'done');
        // adapt to BookingRecord shape for rendering
        const mapped: BookingRecord[] = doneOnly.map((b) => ({
          _id: b._id,
          bookingId: b.bookingId,
          userId: b.customerName || b.customerEmail,
          destination: b.details?.flightDetails?.to || b.destination,
          bookingDate: b.date || b.bookingDate || b.createdAt,
          createdAt: b.createdAt,
          amount: b.amount,
          details: { flightDetails: { from: b.details?.flightDetails?.from, to: b.details?.flightDetails?.to, selectedFlight: b.details?.selectedFlight } },
          status: b.status,
          customerName: b.customerName
        }));
        setOrders(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch orders', err);
    }
  };

  // time range selector removed - always showing full year by default

  const chartData = revenueByMonth.map((r:number, idx:number) => ({ month: monthNames[idx], revenue: r || 0 }));

  const handleDownload = async () => {
    try {
      const res = await api.get('/admin/reports/download', { responseType: 'blob' });
      const contentType = res.headers['content-type'];
      const ext = contentType && contentType.includes('spreadsheet') ? 'xlsx' : 'csv';
      const filename = `tourtastic_orders.${ext}`;
      saveAs(new Blob([res.data]), filename);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{t('reports')}</h1>
      <div className="mb-4 flex items-center gap-4">
        <label className="text-sm font-medium">SYP rate (1 USD = )</label>
        <input
          type="number"
          step="0.01"
          className="border px-2 py-1 rounded w-32"
          value={sypRate}
          onChange={(e) => {
              const v = Number(e.target.value);
              const safe = isNaN(v) || v <= 0 ? 1 : v;
              setSypRateState(safe);
              if (!isNaN(v) && v > 0) {
                setSypRate(v);
                // persist to server (admin only route)
                api.put('/settings/sypRate', { value: v }).catch((err) => console.warn('Failed to save syp rate', err));
              }
            }}
        />
        <div className="text-sm text-gray-600">Prices will display in SP</div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{formatSypFromUsd(Number(totalRevenue || 0))}</div>
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
            <div className="text-2xl font-bold flex gap-4">
              <span>{typeof growthRate.revenue === 'number' ? `${growthRate.revenue}%` : '-'}</span>
              <span className="text-sm text-gray-500">{t('revenue')}</span>
              <span>|</span>
              <span>{typeof growthRate.bookings === 'number' ? `${growthRate.bookings}%` : '-'}</span>
              <span className="text-sm text-gray-500">{t('bookings')}</span>
            </div>
            <p className="text-sm text-gray-500">{t('growthRate')}</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl">{t('revenue')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
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
                  data={bookingDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {bookingDistribution.map((entry, index) => (
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
              </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {topDestinations && topDestinations.length > 0 ? topDestinations.map((td) => (
                  <div key={td.destination} className="border rounded-lg p-4 text-center">
                    <div className="text-lg font-bold">{td.destination}</div>
                    <div className="text-sm text-gray-500">{td.bookings} {t('bookings')}</div>
                    <div className={`mt-2 ${td.growthPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>{td.growthPercent >=0 ? `+${td.growthPercent}%` : `${td.growthPercent}%`} {t('vs')}</div>
                  </div>
                )) : <div className="text-sm text-gray-500">No destination data</div>}
              </div>
            </CardContent>
          </Card>
      </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('searchQueries', 'Search Queries')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto max-h-64">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th>{t('from', 'From')}</th>
                      <th>{t('to', 'To')}</th>
                      <th>{t('date', 'Date')}</th>
                      <th>{t('count', 'Count')}</th>
                    </tr>
                  </thead>
                  <tbody>
                      {searchLogs.map((s, idx) => (
                        <tr key={s._id || `${s.from}-${s.to}-${idx}`}>
                          <td>{s.from}</td>
                          <td>{s.to}</td>
                          <td>{s.lastSearchedAt ? new Date(s.lastSearchedAt).toLocaleString() : (s.searchedAt ? new Date(s.searchedAt).toLocaleString() : '')}</td>
                          <td>{typeof s.count === 'number' ? s.count : (typeof s.resultsCount === 'number' ? s.resultsCount : 0)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <CardTitle className="text-lg">{t('orders', 'Orders')}</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    {t('downloadReport')}
                  </Button>
                </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto max-h-64">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th>{t('orderId', 'Order ID')}</th>
                      <th>{t('user', 'User')}</th>
                      <th>{t('from', 'From')}</th>
                      <th>{t('to', 'To')}</th>
                      <th>{t('date', 'Date')}</th>
                      <th>{t('amount', 'Amount')}</th>
                      <th>{t('status', 'Status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o._id || o.bookingId}>
                        <td>{o.bookingId || o._id}</td>
                        <td>{(typeof o.userId === 'object' ? (o.userId && (o.userId.name || o.userId.email)) : o.userId) || o.customerName}</td>
                        <td>{(o.details && o.details.flightDetails && o.details.flightDetails.from) || ''}</td>
                        <td>{(o.details && o.details.flightDetails && o.details.flightDetails.to) || o.destination || ''}</td>
                        <td>{o.bookingDate ? new Date(o.bookingDate as any).toLocaleDateString() : (o.createdAt ? new Date(o.createdAt as any).toLocaleDateString() : '')}</td>
                        <td>{formatSypFromUsd(o.amount ?? (o.details?.flightDetails?.selectedFlight?.price?.total ?? o.createdAt ? 0 : null))}</td>
                        <td>{o.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
};

export default AdminReports;
