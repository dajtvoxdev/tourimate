import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Eye,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { httpJson, getApiBase } from "@/src/lib/http";
import { toast } from "sonner";
import { useAuth } from "@/src/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface Revenue {
  id: string;
  bookingNumber: string;
  totalAmount: number;
  paymentStatus: number;
  status: number;
  createdAt: string;
  updatedAt: string;
  tour: {
    id: string;
    title: string;
    tourGuideId: string;
  };
  tourAvailability: {
    date: string;
    adultPrice: number;
    childPrice: number;
  };
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface RevenueResponse {
  revenues: Revenue[];
  summary: {
    totalRevenue: number;
    totalBookings: number;
    averageRevenue: number;
  };
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

interface RevenueStatistics {
  totalRevenue: number;
  totalBookings: number;
  averageRevenue: number;
  revenueByMonth: Array<{
    year: number;
    month: number;
    revenue: number;
    bookings: number;
    monthName: string;
  }>;
  revenueByTour: Array<{
    tourId: string;
    tourTitle: string;
    revenue: number;
    bookings: number;
  }>;
  revenueByStatus: Array<{
    status: number;
    revenue: number;
    bookings: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdminRevenue() {
  const { user } = useAuth();
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [statistics, setStatistics] = useState<RevenueStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedRevenue, setSelectedRevenue] = useState<Revenue | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Check if user has access (Admin or TourGuide)
  if (!user || (user.role !== "Admin" && user.role !== "TourGuide")) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600">Bạn cần quyền quản trị hoặc hướng dẫn viên để truy cập trang này.</p>
        </div>
      </div>
    );
  }

  // Filter states
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [tourFilter, setTourFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");

  // Summary from response
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    averageRevenue: 0,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchRevenues();
    fetchStatistics();
  }, [page, paymentStatusFilter, dateFrom, dateTo, tourFilter]);

  const fetchRevenues = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      if (tourFilter) params.append("tourId", tourFilter);
      if (paymentStatusFilter && paymentStatusFilter !== "all") params.append("paymentStatus", paymentStatusFilter);

      const response = await httpJson<RevenueResponse>(
        `${getApiBase()}/api/revenue?${params.toString()}`
      );

      setRevenues(response.revenues);
      setSummary(response.summary);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Error fetching revenues:", error);
      toast.error("Không thể tải dữ liệu doanh thu");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      setStatsLoading(true);
      const params = new URLSearchParams();
      
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const response = await httpJson<RevenueStatistics>(
        `${getApiBase()}/api/revenue/statistics?${params.toString()}`
      );

      setStatistics(response);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      toast.error("Không thể tải thống kê doanh thu");
    } finally {
      setStatsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const response = await httpJson<any[]>(
        `${getApiBase()}/api/revenue/export?${params.toString()}`
      );

      // Convert to CSV and download
      const csv = convertToCSV(response);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revenue-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Xuất dữ liệu thành công");
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Không thể xuất dữ liệu");
    }
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  };

  const getPaymentStatusBadge = (status: number) => {
    switch (status) {
      case 1: // Pending
        return <Badge className="bg-yellow-100 text-yellow-800">Chờ thanh toán</Badge>;
      case 2: // Paid
        return <Badge className="bg-green-100 text-green-800">Đã thanh toán</Badge>;
      case 3: // Failed
        return <Badge className="bg-red-100 text-red-800">Thất bại</Badge>;
      case 4: // Refunded
        return <Badge className="bg-purple-100 text-purple-800">Đã hoàn tiền</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getBookingStatusBadge = (status: number) => {
    switch (status) {
      case 1: // PendingPayment
        return <Badge className="bg-yellow-100 text-yellow-800">Chờ thanh toán</Badge>;
      case 2: // Confirmed
        return <Badge className="bg-blue-100 text-blue-800">Xác nhận</Badge>;
      case 3: // Cancelled
        return <Badge className="bg-red-100 text-red-800">Đã hủy</Badge>;
      case 4: // Completed
        return <Badge className="bg-green-100 text-green-800">Hoàn thành</Badge>;
      case 5: // Refunded
        return <Badge className="bg-purple-100 text-purple-800">Đã hoàn tiền</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getVietnameseMonthName = (month: number) => {
    const months = [
      "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
      "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
    ];
    return months[month - 1] || `Tháng ${month}`;
  };

  // Transform revenue data to include Vietnamese month names
  const getTransformedRevenueData = () => {
    if (!statistics?.revenueByMonth) return [];
    
    return statistics.revenueByMonth.map(item => ({
      ...item,
      monthName: getVietnameseMonthName(item.month)
    }));
  };

  const handleViewDetails = (revenue: Revenue) => {
    setSelectedRevenue(revenue);
    setShowDetailsDialog(true);
  };

  const filteredRevenues = revenues.filter(
    (revenue) =>
      revenue.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      revenue.tour.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      revenue.customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      revenue.customer.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Quản lý Doanh thu</h1>
            <p className="text-gray-600 mt-1">
              {user?.role === "Admin" 
                ? "Xem và quản lý doanh thu từ tất cả các tour" 
                : "Xem doanh thu từ các tour của bạn"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchRevenues}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
            <Button onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Xuất dữ liệu
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng số booking</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalBookings}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Doanh thu trung bình</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.averageRevenue)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        {!statsLoading && statistics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Month */}
            <Card>
              <CardHeader>
                <CardTitle>Doanh thu theo tháng</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getTransformedRevenueData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthName" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Doanh thu" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Tours by Revenue */}
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Tour theo doanh thu</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statistics.revenueByTour}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tourTitle" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#82ca9d" name="Doanh thu" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Bộ lọc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Input
                type="date"
                placeholder="Từ ngày"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />

              <Input
                type="date"
                placeholder="Đến ngày"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />

              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Trạng thái thanh toán" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="Paid">Đã thanh toán</SelectItem>
                  <SelectItem value="Pending">Chờ thanh toán</SelectItem>
                  <SelectItem value="Failed">Thất bại</SelectItem>
                  <SelectItem value="Refunded">Đã hoàn tiền</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setDateFrom("");
                  setDateTo("");
                  setPaymentStatusFilter("all");
                  setTourFilter("");
                  setPage(1);
                }}
              >
                Xóa bộ lọc
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Revenue List */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách Doanh thu</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredRevenues.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">
                  Không có dữ liệu doanh thu
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Chưa có giao dịch nào trong khoảng thời gian này.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRevenues.map((revenue) => (
                  <div
                    key={revenue.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {/* Tour Title */}
                        <h3 className="font-semibold text-lg mb-2">{revenue.tour.title}</h3>

                        {/* Booking Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Mã booking:</span>{" "}
                            <span className="font-mono">{revenue.bookingNumber}</span>
                          </div>
                          <div>
                            <span className="font-medium">Khách hàng:</span>{" "}
                            {revenue.customer.firstName} {revenue.customer.lastName}
                          </div>
                          <div>
                            <span className="font-medium">Email:</span> {revenue.customer.email}
                          </div>
                          <div>
                            <span className="font-medium">Ngày tour:</span>{" "}
                            {formatDate(revenue.tourAvailability.date)}
                          </div>
                        </div>

                        {/* Status Badges */}
                        <div className="flex gap-2 mt-3">
                          {getPaymentStatusBadge(revenue.paymentStatus)}
                          {getBookingStatusBadge(revenue.status)}
                        </div>
                      </div>

                      {/* Amount and Actions */}
                      <div className="text-right flex flex-col items-end gap-3">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(revenue.totalAmount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(revenue.createdAt)}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(revenue)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Chi tiết
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-500">
                  Hiển thị {(page - 1) * pageSize + 1} -{" "}
                  {Math.min(page * pageSize, pagination.totalCount)} trong tổng số{" "}
                  {pagination.totalCount} doanh thu
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Trước
                  </Button>
                  <span className="flex items-center px-4">
                    Trang {page} / {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={page === pagination.totalPages}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Chi tiết Doanh thu</DialogTitle>
            </DialogHeader>

            {selectedRevenue && (
              <div className="space-y-6">
                {/* Booking Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Thông tin Booking</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-gray-500">Mã booking</label>
                      <p className="font-mono font-semibold">{selectedRevenue.bookingNumber}</p>
                    </div>
                    <div>
                      <label className="text-gray-500">Tổng tiền</label>
                      <p className="font-semibold text-green-600">
                        {formatCurrency(selectedRevenue.totalAmount)}
                      </p>
                    </div>
                    <div>
                      <label className="text-gray-500">Trạng thái thanh toán</label>
                      <div className="mt-1">
                        {getPaymentStatusBadge(selectedRevenue.paymentStatus)}
                      </div>
                    </div>
                    <div>
                      <label className="text-gray-500">Trạng thái booking</label>
                      <div className="mt-1">{getBookingStatusBadge(selectedRevenue.status)}</div>
                    </div>
                  </div>
                </div>

                {/* Tour Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Thông tin Tour</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <label className="text-gray-500">Tên tour</label>
                      <p className="font-semibold">{selectedRevenue.tour.title}</p>
                    </div>
                    <div>
                      <label className="text-gray-500">Ngày khởi hành</label>
                      <p>{formatDate(selectedRevenue.tourAvailability.date)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-gray-500">Giá người lớn</label>
                        <p>{formatCurrency(selectedRevenue.tourAvailability.adultPrice)}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">Giá trẻ em</label>
                        <p>{formatCurrency(selectedRevenue.tourAvailability.childPrice || 0)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Thông tin Khách hàng</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-gray-500">Tên khách hàng</label>
                      <p>
                        {selectedRevenue.customer.firstName} {selectedRevenue.customer.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="text-gray-500">Email</label>
                      <p>{selectedRevenue.customer.email}</p>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Thông tin Thời gian</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-gray-500">Ngày tạo</label>
                      <p>{formatDate(selectedRevenue.createdAt)}</p>
                    </div>
                    <div>
                      <label className="text-gray-500">Cập nhật cuối</label>
                      <p>{formatDate(selectedRevenue.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

