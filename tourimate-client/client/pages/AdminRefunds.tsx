import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  Calendar,
  DollarSign,
  RotateCcw,
  Eye,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle
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
  DialogFooter,
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

interface RefundBooking {
  id: string;
  bookingNumber: string;
  totalAmount: number;
  status: number;
  cancellationReason?: string;
  cancelledAt?: string;
  tour: {
    id: string;
    title: string;
    tourGuideId: string;
  };
  tourAvailability: {
    date: string;
  };
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
}

interface Refund {
  id: string;
  refundAmount: number;
  originalAmount: number;
  refundPercentage: number;
  refundStatus: string;
  currency: string;
  refundReason?: string;
  refundReference?: string;
  refundBankName?: string;
  refundBankAccount?: string;
  refundAccountName?: string;
  refundNotes?: string;
  daysBeforeTour: number;
  refundProcessedAt?: string;
  refundCompletedAt?: string;
  createdAt: string;
  updatedAt: string;
  booking: RefundBooking;
}

interface RefundResponse {
  refunds: Refund[];
  summary: {
    totalRefundAmount: number;
    totalOriginalAmount: number;
    totalCount: number;
    averageRefundAmount: number;
  };
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

interface RefundStatistics {
  totalRefundAmount: number;
  totalOriginalAmount: number;
  totalRefunds: number;
  averageRefundAmount: number;
  averageRefundPercentage: number;
  refundsByStatus: Array<{
    status: string;
    count: number;
    totalAmount: number;
  }>;
  refundsByMonth: Array<{
    year: number;
    month: number;
    count: number;
    totalAmount: number;
    monthName: string;
  }>;
  refundsByPercentage: Array<{
    percentage: number;
    count: number;
    totalAmount: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdminRefunds() {
  const { user } = useAuth();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [statistics, setStatistics] = useState<RefundStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  // Filter states
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Status update states
  const [newStatus, setNewStatus] = useState("");
  const [refundReference, setRefundReference] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);

  const [summary, setSummary] = useState({
    totalRefundAmount: 0,
    totalOriginalAmount: 0,
    totalCount: 0,
    averageRefundAmount: 0,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchRefunds();
    fetchStatistics();
  }, [page, statusFilter, dateFrom, dateTo]);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (searchTerm.trim()) params.append("search", searchTerm.trim());

      const response = await httpJson<RefundResponse>(
        `${getApiBase()}/api/refund?${params.toString()}`
      );

      setRefunds(response.refunds);
      setSummary(response.summary);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Error fetching refunds:", error);
      toast.error("Không thể tải dữ liệu hoàn tiền");
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

      const response = await httpJson<RefundStatistics>(
        `${getApiBase()}/api/refund/statistics?${params.toString()}`
      );

      setStatistics(response);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      toast.error("Không thể tải thống kê hoàn tiền");
    } finally {
      setStatsLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedRefund || !newStatus) {
      toast.error("Vui lòng chọn trạng thái");
      return;
    }

    try {
      setUpdateLoading(true);
      await httpJson(`${getApiBase()}/api/refund/${selectedRefund.id}/status`, {
        method: "PUT",
        body: JSON.stringify({
          status: newStatus,
          refundReference: refundReference.trim() || null,
          notes: statusNotes.trim() || null,
        }),
      });

      toast.success("Cập nhật trạng thái thành công");
      setShowStatusDialog(false);
      setNewStatus("");
      setRefundReference("");
      setStatusNotes("");
      fetchRefunds();
      fetchStatistics();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Không thể cập nhật trạng thái");
    } finally {
      setUpdateLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Chờ xử lý</Badge>;
      case "Processing":
        return <Badge className="bg-blue-100 text-blue-800">Đang xử lý</Badge>;
      case "Completed":
        return <Badge className="bg-green-100 text-green-800">Hoàn thành</Badge>;
      case "Failed":
        return <Badge className="bg-red-100 text-red-800">Thất bại</Badge>;
      case "Cancelled":
        return <Badge className="bg-gray-100 text-gray-800">Đã hủy</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "Processing":
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
      case "Completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "Failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "Cancelled":
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
      default:
        return null;
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

  const handleViewDetails = (refund: Refund) => {
    setSelectedRefund(refund);
    setShowDetailsDialog(true);
  };

  const handleOpenStatusDialog = (refund: Refund) => {
    setSelectedRefund(refund);
    setNewStatus(refund.refundStatus);
    setRefundReference(refund.refundReference || "");
    setStatusNotes("");
    setShowStatusDialog(true);
  };

  const filteredRefunds = refunds.filter(
    (refund) =>
      refund.booking.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.booking.tour.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.booking.customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.booking.customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (refund.refundReference && refund.refundReference.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (user?.role !== "Admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600">Bạn cần quyền quản trị để truy cập trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Quản lý Hoàn tiền</h1>
            <p className="text-gray-600 mt-1">
              Xem và quản lý các yêu cầu hoàn tiền
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchRefunds}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng hoàn tiền</CardTitle>
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalRefundAmount)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng tiền gốc</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalOriginalAmount)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Số yêu cầu</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trung bình</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.averageRefundAmount)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        {!statsLoading && statistics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Refunds by Month */}
            <Card>
              <CardHeader>
                <CardTitle>Hoàn tiền theo tháng</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={statistics.refundsByMonth || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthName" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Line type="monotone" dataKey="totalAmount" stroke="#f59e0b" name="Số tiền" />
                    <Line type="monotone" dataKey="count" stroke="#8b5cf6" name="Số lượng" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Refunds by Status */}
            <Card>
              <CardHeader>
                <CardTitle>Phân bố theo trạng thái</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statistics.refundsByStatus || []}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.status}: ${entry.count}`}
                    >
                      {(statistics.refundsByStatus || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
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

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="Pending">Chờ xử lý</SelectItem>
                  <SelectItem value="Processing">Đang xử lý</SelectItem>
                  <SelectItem value="Completed">Hoàn thành</SelectItem>
                  <SelectItem value="Failed">Thất bại</SelectItem>
                  <SelectItem value="Cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setDateFrom("");
                  setDateTo("");
                  setStatusFilter("all");
                  setPage(1);
                }}
              >
                Xóa bộ lọc
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Refunds List */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách Hoàn tiền</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredRefunds.length === 0 ? (
              <div className="text-center py-12">
                <RotateCcw className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">
                  Không có dữ liệu hoàn tiền
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Chưa có yêu cầu hoàn tiền nào.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRefunds.map((refund) => (
                  <div
                    key={refund.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        {/* Tour & Booking Info */}
                        <h3 className="font-semibold text-lg mb-2">{refund.booking.tour.title}</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Mã booking:</span>{" "}
                            <span className="font-mono">{refund.booking.bookingNumber}</span>
                          </div>
                          <div>
                            <span className="font-medium">Khách hàng:</span>{" "}
                            {refund.booking.customer.firstName} {refund.booking.customer.lastName}
                          </div>
                          <div>
                            <span className="font-medium">Email:</span> {refund.booking.customer.email}
                          </div>
                          <div>
                            <span className="font-medium">Số tiền gốc:</span>{" "}
                            {formatCurrency(refund.originalAmount)}
                          </div>
                          <div>
                            <span className="font-medium">Số tiền hoàn:</span>{" "}
                            <span className="text-green-600 font-semibold">
                              {formatCurrency(refund.refundAmount)} ({refund.refundPercentage}%)
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Hủy trước:</span>{" "}
                            {refund.daysBeforeTour} ngày
                          </div>
                        </div>

                        {/* Bank Info */}
                        {refund.refundBankName && (
                          <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                            <div className="font-medium text-blue-900">Thông tin tài khoản:</div>
                            <div className="text-blue-700">
                              {refund.refundBankName} - {refund.refundBankAccount} - {refund.refundAccountName}
                            </div>
                          </div>
                        )}

                        {/* Status */}
                        <div className="flex gap-2 mt-3 items-center">
                          {getStatusIcon(refund.refundStatus)}
                          {getStatusBadge(refund.refundStatus)}
                          {refund.refundReference && (
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              Ref: {refund.refundReference}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="text-right flex flex-col items-end gap-3">
                        <div className="text-sm text-gray-500">
                          {formatDate(refund.createdAt)}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(refund)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Chi tiết
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleOpenStatusDialog(refund)}
                          >
                            Cập nhật
                          </Button>
                        </div>
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
                  {pagination.totalCount} hoàn tiền
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chi tiết Hoàn tiền</DialogTitle>
            </DialogHeader>

            {selectedRefund && (
              <div className="space-y-6">
                {/* Refund Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Thông tin Hoàn tiền</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-gray-500">Số tiền gốc</label>
                      <p className="font-semibold">{formatCurrency(selectedRefund.originalAmount)}</p>
                    </div>
                    <div>
                      <label className="text-gray-500">Số tiền hoàn</label>
                      <p className="font-semibold text-green-600">
                        {formatCurrency(selectedRefund.refundAmount)} ({selectedRefund.refundPercentage}%)
                      </p>
                    </div>
                    <div>
                      <label className="text-gray-500">Trạng thái</label>
                      <div className="mt-1">{getStatusBadge(selectedRefund.refundStatus)}</div>
                    </div>
                    <div>
                      <label className="text-gray-500">Hủy trước tour</label>
                      <p>{selectedRefund.daysBeforeTour} ngày</p>
                    </div>
                    {selectedRefund.refundReference && (
                      <div className="col-span-2">
                        <label className="text-gray-500">Mã tham chiếu</label>
                        <p className="font-mono">{selectedRefund.refundReference}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bank Information */}
                {selectedRefund.refundBankName && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Thông tin Tài khoản</h3>
                    <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                      <div>
                        <label className="text-gray-500">Ngân hàng</label>
                        <p>{selectedRefund.refundBankName}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">Số tài khoản</label>
                        <p className="font-mono">{selectedRefund.refundBankAccount}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">Tên tài khoản</label>
                        <p>{selectedRefund.refundAccountName}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Booking Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Thông tin Booking</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <label className="text-gray-500">Mã booking</label>
                      <p className="font-mono font-semibold">{selectedRefund.booking.bookingNumber}</p>
                    </div>
                    <div>
                      <label className="text-gray-500">Tour</label>
                      <p>{selectedRefund.booking.tour.title}</p>
                    </div>
                    <div>
                      <label className="text-gray-500">Ngày tour</label>
                      <p>{formatDate(selectedRefund.booking.tourAvailability.date)}</p>
                    </div>
                    {selectedRefund.booking.cancellationReason && (
                      <div>
                        <label className="text-gray-500">Lý do hủy</label>
                        <p className="whitespace-pre-wrap">{selectedRefund.booking.cancellationReason}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Thông tin Khách hàng</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-gray-500">Tên khách hàng</label>
                      <p>
                        {selectedRefund.booking.customer.firstName}{" "}
                        {selectedRefund.booking.customer.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="text-gray-500">Email</label>
                      <p>{selectedRefund.booking.customer.email}</p>
                    </div>
                    {selectedRefund.booking.customer.phoneNumber && (
                      <div>
                        <label className="text-gray-500">Số điện thoại</label>
                        <p>{selectedRefund.booking.customer.phoneNumber}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {selectedRefund.refundNotes && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Ghi chú</h3>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="whitespace-pre-wrap text-sm">{selectedRefund.refundNotes}</p>
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Thời gian</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-gray-500">Ngày tạo</label>
                      <p>{formatDate(selectedRefund.createdAt)}</p>
                    </div>
                    {selectedRefund.refundProcessedAt && (
                      <div>
                        <label className="text-gray-500">Ngày xử lý</label>
                        <p>{formatDate(selectedRefund.refundProcessedAt)}</p>
                      </div>
                    )}
                    {selectedRefund.refundCompletedAt && (
                      <div>
                        <label className="text-gray-500">Ngày hoàn thành</label>
                        <p>{formatDate(selectedRefund.refundCompletedAt)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Status Update Dialog */}
        <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cập nhật trạng thái Hoàn tiền</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Trạng thái</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Chờ xử lý</SelectItem>
                    <SelectItem value="Processing">Đang xử lý</SelectItem>
                    <SelectItem value="Completed">Hoàn thành</SelectItem>
                    <SelectItem value="Failed">Thất bại</SelectItem>
                    <SelectItem value="Cancelled">Đã hủy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Mã tham chiếu (tùy chọn)</label>
                <Input
                  placeholder="Nhập mã tham chiếu giao dịch"
                  value={refundReference}
                  onChange={(e) => setRefundReference(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Ghi chú (tùy chọn)</label>
                <textarea
                  className="w-full border rounded-md p-2"
                  rows={3}
                  placeholder="Nhập ghi chú..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
                Hủy
              </Button>
              <Button onClick={handleUpdateStatus} disabled={updateLoading}>
                {updateLoading ? "Đang xử lý..." : "Cập nhật"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

