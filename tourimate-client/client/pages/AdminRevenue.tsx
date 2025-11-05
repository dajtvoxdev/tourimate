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

interface Booking {
  id: string;
  bookingNumber: string;
  totalAmount: number;
  paymentStatus: number;
  status: number;
  createdAt: string;
  updatedAt: string;
  tour?: {
    id: string;
    title: string;
    tourGuideId: string;
  };
  tourAvailability?: {
    date: string;
    adultPrice: number;
    childPrice: number;
  };
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  paymentStatus: number;
  status: number;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Revenue {
  id: string;
  transactionId: string;
  entityId?: string;
  kind: string; // Tour, Product
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  revenueAmount?: number; // For admin: GrossAmount, for tour guide: NetAmount
  currency: string;
  payoutStatus: string; // pending, paid, held
  payoutDate?: string;
  createdAt: string;
  updatedAt: string;
  transaction?: {
    type: string;
    status: string;
    entityId?: string;
    entityType?: string;
    description?: string;
  };
  booking?: Booking | null;
  order?: Order | null;
}

interface RevenueResponse {
  revenues: Revenue[];
  summary: {
    totalRevenue: number;
    totalBookings: number;
    totalOrders?: number;
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
  revenueByTour: Array<{ // now entity-level
    entityType: string;
    entityId?: string;
    revenue: number;
    count: number;
  }>;
  revenueByStatus: Array<{
    status: string;
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

  const filteredRevenues = revenues.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      (r.transactionId || '').toLowerCase().includes(term) ||
      (r.kind || '').toLowerCase().includes(term) ||
      (r.transaction?.type || '').toLowerCase().includes(term)
    );
  });

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
              <CardTitle className="text-sm font-medium">Tổng số đơn hàng</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalOrders ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts removed per request */}

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
                        <h3 className="font-semibold text-lg mb-2">
                          {revenue.kind === "Tour" ? "Tour" : revenue.kind === "Product" ? "Sản phẩm" : revenue.kind}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                          <div>
                            <span className="font-medium">Giao dịch:</span>{" "}
                            <span className="font-mono text-xs">{revenue.transactionId}</span>
                          </div>
                          
                          
                          <div>
                            <span className="font-medium">Ngày:</span> {formatDate(revenue.createdAt)}
                          </div>
                        </div>
                        
                        {/* Booking/Order Information */}
                        {revenue.booking && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <div className="font-medium text-blue-900 mb-2">Thông tin Booking</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="font-medium">Mã booking:</span> {revenue.booking.bookingNumber}
                              </div>
                              <div>
                                <span className="font-medium">Tour:</span> {revenue.booking.tour?.title || "N/A"}
                              </div>
                              {revenue.booking.tourAvailability && (
                                <div>
                                  <span className="font-medium">Ngày tour:</span> {new Date(revenue.booking.tourAvailability.date).toLocaleDateString("vi-VN")}
                                </div>
                              )}
                              {revenue.booking.customer && (
                                <div>
                                  <span className="font-medium">Khách hàng:</span> {revenue.booking.customer.firstName} {revenue.booking.customer.lastName}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {revenue.order && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg">
                            <div className="font-medium text-green-900 mb-2">Thông tin Đơn hàng</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="font-medium">Mã đơn:</span> {revenue.order.orderNumber}
                              </div>
                              <div>
                                <span className="font-medium">Tổng tiền:</span> {formatCurrency(revenue.order.totalAmount)}
                              </div>
                              {revenue.order.customer && (
                                <div>
                                  <span className="font-medium">Khách hàng:</span> {revenue.order.customer.firstName} {revenue.order.customer.lastName}
                                </div>
                              )}
                              {revenue.order.customer && (
                                <div>
                                  <span className="font-medium">Email:</span> {revenue.order.customer.email}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Amount and Actions */}
                      <div className="text-right flex flex-col items-end gap-3">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(revenue.revenueAmount ?? revenue.grossAmount)}
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
                {/* Revenue Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Thông tin Doanh thu</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-gray-500">Giao dịch</label>
                      <p className="font-mono text-xs">{selectedRevenue.transactionId}</p>
                    </div>
                    
                    <div>
                      <label className="text-gray-500">Doanh thu {user?.role === "Admin" ? "(100%)" : "(Net)"}</label>
                      <p className="font-semibold text-green-600">
                        {formatCurrency(selectedRevenue.revenueAmount ?? (user?.role === "Admin" ? selectedRevenue.grossAmount : selectedRevenue.netAmount))}
                      </p>
                    </div>
                    
                    
                    <div>
                      <label className="text-gray-500">Ngày tạo</label>
                      <p>{formatDate(selectedRevenue.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Booking Details */}
                {selectedRevenue.booking && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Thông tin Booking</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="text-gray-500">Mã booking</label>
                        <p className="font-semibold">{selectedRevenue.booking.bookingNumber}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">Tổng tiền</label>
                        <p>{formatCurrency(selectedRevenue.booking.totalAmount)}</p>
                      </div>
                      {selectedRevenue.booking.tour && (
                        <>
                          <div>
                            <label className="text-gray-500">Tour</label>
                            <p>{selectedRevenue.booking.tour.title}</p>
                          </div>
                          <div>
                            <label className="text-gray-500">Tour Guide ID</label>
                            <p className="font-mono text-xs">{selectedRevenue.booking.tour.tourGuideId}</p>
                          </div>
                        </>
                      )}
                      {selectedRevenue.booking.tourAvailability && (
                        <>
                          <div>
                            <label className="text-gray-500">Ngày tour</label>
                            <p>{new Date(selectedRevenue.booking.tourAvailability.date).toLocaleDateString("vi-VN")}</p>
                          </div>
                          <div>
                            <label className="text-gray-500">Giá người lớn</label>
                            <p>{formatCurrency(selectedRevenue.booking.tourAvailability.adultPrice)}</p>
                          </div>
                        </>
                      )}
                      {selectedRevenue.booking.customer && (
                        <>
                          <div>
                            <label className="text-gray-500">Khách hàng</label>
                            <p>{selectedRevenue.booking.customer.firstName} {selectedRevenue.booking.customer.lastName}</p>
                          </div>
                          <div>
                            <label className="text-gray-500">Email</label>
                            <p>{selectedRevenue.booking.customer.email}</p>
                          </div>
                        </>
                      )}
                      <div>
                        <label className="text-gray-500">Trạng thái thanh toán</label>
                        <p>{getPaymentStatusBadge(selectedRevenue.booking.paymentStatus)}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">Trạng thái booking</label>
                        <p>{getBookingStatusBadge(selectedRevenue.booking.status)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Details */}
                {selectedRevenue.order && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Thông tin Đơn hàng</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="text-gray-500">Mã đơn</label>
                        <p className="font-semibold">{selectedRevenue.order.orderNumber}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">Tổng tiền</label>
                        <p>{formatCurrency(selectedRevenue.order.totalAmount)}</p>
                      </div>
                      {selectedRevenue.order.customer && (
                        <>
                          <div>
                            <label className="text-gray-500">Khách hàng</label>
                            <p>{selectedRevenue.order.customer.firstName} {selectedRevenue.order.customer.lastName}</p>
                          </div>
                          <div>
                            <label className="text-gray-500">Email</label>
                            <p>{selectedRevenue.order.customer.email}</p>
                          </div>
                        </>
                      )}
                      <div>
                        <label className="text-gray-500">Trạng thái thanh toán</label>
                        <p>{getPaymentStatusBadge(selectedRevenue.order.paymentStatus)}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">Trạng thái đơn</label>
                        <p>{selectedRevenue.order.status}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}





