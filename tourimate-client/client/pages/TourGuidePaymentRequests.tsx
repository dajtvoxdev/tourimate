import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Check, 
  X, 
  Calendar,
  User,
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { httpJson, getApiBase } from "@/src/lib/http";
import { toast } from "sonner";
import { useAuth } from "@/src/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";

interface PaymentRequest {
  id: string;
  costCode: string;
  costName: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: string;
  paidDate?: string;
  paymentMethod?: string;
  referenceNumber: string;
  createdAt: string;
  updatedAt: string;
  payerName: string;
  relatedBooking?: {
    id: string;
    bookingNumber: string;
  };
}

interface PaymentRequestsResponse {
  paymentRequests: PaymentRequest[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

interface Booking {
  id: string;
  bookingNumber: string;
  tourTitle: string;
  status: string;
  totalAmount: number;
  tourDate: string;
}

export default function TourGuidePaymentRequests() {
  const { user } = useAuth();
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string>("");

  // Check access
  if (!user || user.role !== "TourGuide") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600">Chỉ hướng dẫn viên mới có thể truy cập trang này.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchPaymentRequests();
    fetchCompletedBookings();
  }, [currentPage, statusFilter, searchTerm]);

  const fetchPaymentRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: "20"
      });
      
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      const response = await httpJson<PaymentRequestsResponse>(
        `${getApiBase()}/api/paymentrequest/tour-guide?${params.toString()}`
      );
      
      setPaymentRequests(response.paymentRequests);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.totalCount);
    } catch (error) {
      console.error("Error fetching payment requests:", error);
      toast.error("Không thể tải danh sách yêu cầu thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedBookings = async () => {
    try {
      const response = await httpJson<Booking[]>(
        `${getApiBase()}/api/bookings/tour-guide?status=completed&pageSize=100`
      );
      setBookings(response);
    } catch (error) {
      console.error("Error fetching completed bookings:", error);
    }
  };

  const handleCreatePaymentRequest = async () => {
    if (!selectedBookingId) {
      toast.error("Vui lòng chọn tour đã hoàn thành");
      return;
    }

    try {
      setActionLoading(selectedBookingId);
      
      const response = await httpJson(`${getApiBase()}/api/paymentrequest/create`, {
        method: "POST",
        body: JSON.stringify({
          bookingId: selectedBookingId
        })
      });

      toast.success("Tạo yêu cầu thanh toán thành công", {
        description: `Số tiền: ${formatCurrency(response.amount)} - Trạng thái: ${response.status}`
      });

      setShowCreateDialog(false);
      setSelectedBookingId("");
      fetchPaymentRequests();
    } catch (error: any) {
      console.error("Error creating payment request:", error);
      toast.error(error.message || "Không thể tạo yêu cầu thanh toán");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Chờ xử lý
        </Badge>;
      case "paid":
        return <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Đã thanh toán
        </Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 border-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Đã hủy
        </Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Yêu cầu thanh toán</h1>
            <p className="text-gray-600">Quản lý các yêu cầu thanh toán từ tour đã hoàn thành</p>
            <div className="mt-2 text-sm text-gray-500">
              <p>💡 <strong>Luồng:</strong> Tour hoàn thành → Tạo yêu cầu → Admin xử lý → Nhận thanh toán</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Tổng cộng: {totalCount} yêu cầu
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Tạo yêu cầu
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Tìm kiếm theo mã, tên tour..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="pending">Chờ xử lý</SelectItem>
                    <SelectItem value="paid">Đã thanh toán</SelectItem>
                    <SelectItem value="cancelled">Đã hủy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Requests List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : paymentRequests.length > 0 ? (
          <div className="space-y-4">
            {paymentRequests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(request.status)}
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(request.createdAt)}
                      </span>
                    </div>

                    {/* Request Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span>{request.costCode}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{request.payerName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{request.costName}</span>
                      </div>
                    </div>

                    {/* Amount and Details */}
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-semibold text-green-600">
                        {formatCurrency(request.amount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Hạn thanh toán: {formatDate(request.dueDate)}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedRequest(request)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Xem chi tiết
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có yêu cầu thanh toán</h3>
              <p className="text-gray-600 mb-4">
                Tạo yêu cầu thanh toán cho các tour đã hoàn thành để nhận commission.
              </p>
              <Button onClick={() => setShowCreateDialog(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Tạo yêu cầu đầu tiên
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Trước
            </Button>
            <span className="text-sm text-gray-600">
              Trang {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Sau
            </Button>
          </div>
        )}

        {/* Create Payment Request Dialog */}
        <AlertDialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tạo yêu cầu thanh toán</AlertDialogTitle>
              <AlertDialogDescription>
                Chọn tour đã hoàn thành để tạo yêu cầu thanh toán commission.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Tour đã hoàn thành</label>
                <Select value={selectedBookingId} onValueChange={setSelectedBookingId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn tour..." />
                  </SelectTrigger>
                  <SelectContent>
                    {bookings.map((booking) => (
                      <SelectItem key={booking.id} value={booking.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{booking.tourTitle}</span>
                          <span className="text-sm text-gray-500">
                            {booking.bookingNumber} - {formatCurrency(booking.totalAmount)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleCreatePaymentRequest}
                disabled={!selectedBookingId || actionLoading !== null}
              >
                {actionLoading ? "Đang tạo..." : "Tạo yêu cầu"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Payment Request Details Dialog */}
        {selectedRequest && (
          <AlertDialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Chi tiết yêu cầu thanh toán</AlertDialogTitle>
              </AlertDialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Mã yêu cầu</label>
                    <p className="text-lg font-semibold">{selectedRequest.costCode}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                    <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Số tiền</label>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(selectedRequest.amount)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Người thanh toán</label>
                    <p className="text-lg font-semibold">{selectedRequest.payerName}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Mô tả</label>
                  <p className="text-gray-700">{selectedRequest.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Hạn thanh toán</label>
                    <p className="text-gray-700">{formatDate(selectedRequest.dueDate)}</p>
                  </div>
                  {selectedRequest.paidDate && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Ngày thanh toán</label>
                      <p className="text-gray-700">{formatDate(selectedRequest.paidDate)}</p>
                    </div>
                  )}
                </div>

                {selectedRequest.paymentMethod && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phương thức thanh toán</label>
                    <p className="text-gray-700">{selectedRequest.paymentMethod}</p>
                  </div>
                )}
              </div>

              <AlertDialogFooter>
                <AlertDialogAction onClick={() => setSelectedRequest(null)}>
                  Đóng
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </AdminLayout>
  );
}
