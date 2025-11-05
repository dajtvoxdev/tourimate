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
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
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
  status: string | number;
  dueDate: string;
  paidDate?: string;
  paymentMethod?: string;
  referenceNumber: string;
  createdAt: string;
  updatedAt: string;
  recipientName: string;
  recipientId?: string;
  recipientBankCode?: string;
  recipientBankName?: string;
  recipientBankAccount?: string;
  recipientBankAccountName?: string;
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

export default function AdminPaymentRequests() {
  const { user } = useAuth();
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [requestToProcess, setRequestToProcess] = useState<PaymentRequest | null>(null);

  // Check access
  if (!user || user.role !== "Admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600">Chỉ admin mới có thể truy cập trang này.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchPaymentRequests();
  }, [currentPage, statusFilter, searchTerm]);

  const fetchPaymentRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: "20",
        type: "TourGuidePayment" // Only get tour guide payment requests
      });
      
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      
      if (searchTerm.trim()) {
        params.append("searchTerm", searchTerm.trim());
      }

      const response = await httpJson<any>(
        `${getApiBase()}/api/cost?${params.toString()}`
      );
      
      setPaymentRequests(response.costs || []);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.totalCount);
    } catch (error) {
      console.error("Error fetching payment requests:", error);
      toast.error("Không thể tải danh sách yêu cầu thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async (requestId: string) => {
    try {
      setActionLoading(requestId);
      
      await httpJson(`${getApiBase()}/api/cost/confirm-payment/${requestId}`, { method: "POST" });

      toast.success("Xử lý thanh toán thành công", {
        description: "Tour guide đã nhận được thông báo về việc thanh toán."
      });

      setShowProcessDialog(false);
      setRequestToProcess(null);
      fetchPaymentRequests();
    } catch (error: any) {
      console.error("Error processing payment:", error);
      
      // Check if error is due to missing bank info
      if (error.missingBankInfo) {
        toast.error("Không thể xử lý thanh toán", {
          description: `${error.tourGuideName || "Hướng dẫn viên"} chưa cấu hình thông tin ngân hàng. Vui lòng yêu cầu họ cập nhật trong phần cài đặt tài khoản.`,
          duration: 8000
        });
      } else {
        toast.error(error.message || "Không thể xử lý thanh toán");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const normalizeStatus = (s: string | number): string => {
    if (typeof s === 'number') {
      // Map numeric codes from CostStatus enum to strings
      // 1 = Pending, 2 = Approved, 3 = Paid, 4 = Cancelled, 5 = Overdue
      switch (s) {
        case 1: return 'pending';
        case 2: return 'approved';
        case 3: return 'paid';
        case 4: return 'cancelled';
        case 5: return 'overdue';
        default: return 'pending';
      }
    }
    return s.toLowerCase();
  };

  const getStatusBadge = (status: string | number) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Chờ xử lý
        </Badge>;
      case "approved":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Đã duyệt
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
      case "overdue":
        return <Badge className="bg-red-100 text-red-800 border-red-200">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Quá hạn
        </Badge>;
      default:
        return <Badge variant="secondary">{String(status)}</Badge>;
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

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý yêu cầu thanh toán</h1>
            <p className="text-gray-600">Xử lý các yêu cầu thanh toán chi phí cho hưỡng dẫn viên</p>
           
          </div>
          <div className="text-sm text-gray-500">
            Tổng cộng: {totalCount} yêu cầu
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Chờ xử lý</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {paymentRequests.filter(r => r.status === "Pending").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Đã thanh toán</p>
                  <p className="text-2xl font-bold text-green-600">
                    {paymentRequests.filter(r => r.status === "Paid").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tổng số tiền</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(paymentRequests.reduce((sum, r) => sum + r.amount, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Tìm kiếm theo mã, tên tour guide..."
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
              <div key={request.id} className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
                request.status === "Pending" && isOverdue(request.dueDate) ? "border-red-200 bg-red-50" : ""
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(request.status)}
                        {request.status === "Pending" && isOverdue(request.dueDate) && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Quá hạn
                          </Badge>
                        )}
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
                        <span>{request.recipientName}</span>
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
                        {request.status === "Pending" && isOverdue(request.dueDate) && (
                          <span className="text-red-600 ml-2">(Quá hạn)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* Primary action button for Pending requests */}
                    {normalizeStatus(request.status) === "pending" && (
                      <Button
                        onClick={() => {
                          setRequestToProcess(request);
                          setShowProcessDialog(true);
                        }}
                        disabled={actionLoading === request.id}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        {actionLoading === request.id ? "Đang xử lý..." : "Xác nhận thanh toán"}
                      </Button>
                    )}
                    
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
                        {normalizeStatus(request.status) === "pending" && (
                          <DropdownMenuItem 
                            onClick={() => {
                              setRequestToProcess(request);
                              setShowProcessDialog(true);
                            }}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Xử lý thanh toán
                          </DropdownMenuItem>
                        )}
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
              <p className="text-gray-600">
                Các Hưỡng dẫn viên sẽ tạo yêu cầu thanh toán sau khi tour hoàn thành.
              </p>
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

        {/* Process Payment Dialog */}
        <AlertDialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
          <AlertDialogContent className="max-h-[80vh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle>Xử lý thanh toán</AlertDialogTitle>
              <AlertDialogDescription>
                Xác nhận rằng bạn đã thanh toán commission cho tour guide này.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            {requestToProcess && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tour guide</label>
                    <p className="text-lg font-semibold">{requestToProcess.recipientName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Số tiền</label>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(requestToProcess.amount)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Mã yêu cầu</label>
                    <p className="text-lg font-semibold">{requestToProcess.costCode}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tour</label>
                    <p className="text-lg font-semibold">{requestToProcess.costName}</p>
                  </div>
                </div>

                {/* Bank Account Information */}
                {requestToProcess.recipientBankAccount && requestToProcess.recipientBankAccountName ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start mb-3">
                      <CreditCard className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-900 mb-2">Thông tin tài khoản nhận</p>
                        <div className="space-y-2 text-sm">
                          <div className="grid grid-cols-3 gap-2">
                            <span className="text-blue-700 font-medium">Ngân hàng:</span>
                            <span className="col-span-2 text-blue-900">{requestToProcess.recipientBankName || requestToProcess.recipientBankCode || "-"}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <span className="text-blue-700 font-medium">Số tài khoản:</span>
                            <span className="col-span-2 text-blue-900 font-mono">{requestToProcess.recipientBankAccount}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <span className="text-blue-700 font-medium">Chủ tài khoản:</span>
                            <span className="col-span-2 text-blue-900">{requestToProcess.recipientBankAccountName}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* QR Code for Bank Transfer */}
                    {requestToProcess.recipientBankCode && requestToProcess.recipientBankAccount && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <p className="text-sm font-semibold text-blue-900 mb-3">Quét mã QR để chuyển khoản</p>
                        <div className="flex justify-center">
                          <img
                            src={`https://img.vietqr.io/image/${requestToProcess.recipientBankCode}-${requestToProcess.recipientBankAccount}-compact2.jpg?amount=${requestToProcess.amount}&addInfo=${encodeURIComponent(`Thanh toan ${requestToProcess.costCode}`)}&accountName=${encodeURIComponent(requestToProcess.recipientBankAccountName)}`}
                            alt="QR Code chuyển khoản"
                            className="w-64 h-64 object-contain rounded-lg border border-blue-300"
                          />
                        </div>
                        <p className="text-xs text-blue-700 text-center mt-2">
                          Quét mã QR bằng app ngân hàng để chuyển khoản tự động
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-900 mb-1">Chưa có thông tin tài khoản</p>
                        <p className="text-sm text-red-800">
                          Tour guide <strong>{requestToProcess.recipientName}</strong> chưa cấu hình thông tin ngân hàng. 
                          Vui lòng yêu cầu họ cập nhật trong phần cài đặt tài khoản trước khi thanh toán.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                    <p className="text-sm text-yellow-800">
                      <strong>Lưu ý:</strong> Sau khi xác nhận, hưỡng dẫn viên sẽ nhận được thông báo về việc thanh toán.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => requestToProcess && handleProcessPayment(requestToProcess.id)}
                disabled={actionLoading !== null}
                className="bg-green-600 hover:bg-green-700"
              >
                {actionLoading ? "Đang xử lý..." : "Xác nhận thanh toán"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Payment Request Details Dialog */}
        {selectedRequest && (
          <AlertDialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
            <AlertDialogContent className="max-h-[80vh] overflow-y-auto">
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
                    <label className="text-sm font-medium text-gray-500">Tour guide</label>
                    <p className="text-lg font-semibold">{selectedRequest.recipientName}</p>
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
