import React, { useState, useEffect } from "react";
import { 
  DollarSign, 
  Users, 
  CreditCard, 
  MessageSquare, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart, Line, LineChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { httpJson, getApiBase } from "@/src/lib/http";
import { toast } from "sonner";
import { useAuth } from "@/src/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";

interface DashboardMetrics {
  totalRevenue: number;
  totalUsers: number;
  totalTransactions: number;
  totalReviews: number;
  recent: {
    revenue: number;
    users: number;
    transactions: number;
    reviews: number;
  };
  statistics: {
    bookings: Array<{ status: string; count: number }>;
    orders: Array<{ status: string; count: number }>;
    reviews: Array<{ status: string; count: number }>;
  };
  topTours: Array<{
    tourId: string;
    tourTitle: string;
    bookingCount: number;
    revenue: number;
  }>;
}

interface RevenueChartData {
  year: number;
  month: number;
  revenue: number;
  monthName: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [revenueChart, setRevenueChart] = useState<RevenueChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [metricsResponse, chartResponse] = await Promise.all([
        httpJson<DashboardMetrics>(`${getApiBase()}/api/dashboard/metrics`),
        httpJson<RevenueChartData[]>(`${getApiBase()}/api/dashboard/revenue-chart`)
      ]);
      
      setMetrics(metricsResponse);
      setRevenueChart(chartResponse);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Không thể tải dữ liệu dashboard");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'pendingpayment':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pendingpayment':
        return 'Chờ thanh toán';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      case 'approved':
        return 'Đã duyệt';
      case 'rejected':
        return 'Từ chối';
      case 'pending':
        return 'Chờ duyệt';
      default:
        return status;
    }
  };

  if (!user || user.role !== "Admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600">Bạn cần quyền quản trị để truy cập trang này.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Tổng quan hệ thống TouriMate</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 ngày</SelectItem>
                <SelectItem value="30">30 ngày</SelectItem>
                <SelectItem value="90">90 ngày</SelectItem>
                <SelectItem value="365">1 năm</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchDashboardData} variant="outline">
              <Activity className="w-4 h-4 mr-2" />
              Làm mới
            </Button>
          </div>
        </div>

        {/* Main Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics?.totalRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+{formatCurrency(metrics?.recent.revenue || 0)}</span> trong {timeRange} ngày qua
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(metrics?.totalUsers || 0)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+{formatNumber(metrics?.recent.users || 0)}</span> người dùng mới
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng giao dịch</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(metrics?.totalTransactions || 0)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+{formatNumber(metrics?.recent.transactions || 0)}</span> giao dịch mới
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng đánh giá</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(metrics?.totalReviews || 0)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+{formatNumber(metrics?.recent.reviews || 0)}</span> đánh giá mới
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Doanh thu theo tháng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(() => {
                  const maxRevenue = Math.max(...(revenueChart?.map(d => d.revenue) || [0]));
                  return revenueChart?.slice(-6).map((data, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{data.monthName}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min(100, (data.revenue / maxRevenue) * 100)}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-20 text-right">
                          {formatCurrency(data.revenue)}
                        </span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Top Tours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Tour phổ biến nhất
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.topTours?.slice(0, 5).map((tour, index) => (
                  <div key={tour.tourId || `tour-${index}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{tour.tourTitle}</p>
                        <p className="text-xs text-gray-500">{tour.bookingCount} đặt tour</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-green-600">
                      {formatCurrency(tour.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Booking Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Trạng thái đặt tour
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics?.statistics?.bookings?.map((stat, index) => (
                  <div key={`booking-${stat.status}`} className="flex items-center justify-between">
                    <Badge className={getStatusColor(stat.status)}>
                      {getStatusText(stat.status)}
                    </Badge>
                    <span className="text-sm font-medium">{formatNumber(stat.count)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Trạng thái đơn hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics?.statistics?.orders?.map((stat, index) => (
                  <div key={`order-${stat.status}`} className="flex items-center justify-between">
                    <Badge className={getStatusColor(stat.status)}>
                      {getStatusText(stat.status)}
                    </Badge>
                    <span className="text-sm font-medium">{formatNumber(stat.count)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Review Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Trạng thái đánh giá
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics?.statistics?.reviews?.map((stat, index) => (
                  <div key={`review-${stat.status}`} className="flex items-center justify-between">
                    <Badge className={getStatusColor(stat.status)}>
                      {getStatusText(stat.status)}
                    </Badge>
                    <span className="text-sm font-medium">{formatNumber(stat.count)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
