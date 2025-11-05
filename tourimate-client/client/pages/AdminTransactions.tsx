import React, { useState, useEffect } from "react";
import { HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
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
  RefreshCw
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
import { useSearchParams } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";

interface Transaction {
  id: string;
  transactionId: string;
  transactionNumber: string;
  type: string;
  entityType?: string;
  status: string; // Primary status from Transaction model: pending, completed, failed, cancelled, refunded
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  paymentMethod?: string;
  paymentGateway?: string;
  description?: string;
  // Related entity info (secondary)
  bookingNumber?: string;
  orderNumber?: string;
  tourTitle?: string;
  tourDate?: string;
  participants?: number;
  paymentStatus?: string; // From related Booking/Order
  contactInfo?: string;
  createdAt: string;
  updatedAt: string;
}

interface TransactionsResponse {
  transactions: Transaction[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

interface TransactionStats {
  bookingStats: Array<{ status: string; count: number }>;
  orderStats: Array<{ status: string; count: number }>;
  paymentStats: Array<{ status: string; count: number }>;
  orderPaymentStats: Array<{ status: string; count: number }>;
  totalRevenue?: number;
  pendingRevenue?: number;
  totalIn?: number;
  totalOut?: number;
  totalInCount?: number;
  totalOutCount?: number;
}

export default function AdminTransactions() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Check if this is "mine" view for tour guide
  const isMineView = searchParams.get('mine') === '1';

  // SignalR real-time updates
  useEffect(() => {
    if (!user) return;

    const API_BASE = getApiBase();
    const connection = new HubConnectionBuilder()
      .withUrl(`${API_BASE}/hubs/transaction`, {
        withCredentials: true,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    const startConnection = async () => {
      try {
        await connection.start();
        console.log("SignalR Transaction Hub Connected");

        // Join appropriate group based on user role
        if (isMineView && user.id) {
          await connection.invoke("JoinTourGuideGroup", user.id);
          console.log(`Joined tour guide transaction group: ${user.id}`);
        } else {
          await connection.invoke("JoinAdminGroup");
          console.log("Joined admin transaction group");
        }
      } catch (err) {
        console.error("SignalR Connection Error: ", err);
        setTimeout(startConnection, 5000); // Retry after 5 seconds
      }
    };

    // Listen for transaction updates
    connection.on("TransactionUpdated", (data) => {
      console.log("Transaction updated:", data);

      // Show toast notification
      toast.success(data.message || "Giao dịch đã được cập nhật", {
        description: `${data.transactionCode} - ${data.amount?.toLocaleString()} ${data.currency}`,
      });

      // Refresh transaction list
      fetchTransactions();
      fetchStats();
    });

    startConnection();

    // Cleanup on unmount
    return () => {
      if (connection.state === HubConnectionState.Connected) {
        if (isMineView && user.id) {
          connection.invoke("LeaveTourGuideGroup", user.id);
        } else {
          connection.invoke("LeaveAdminGroup");
        }
        connection.stop();
      }
    };
  }, [user, isMineView]);

  useEffect(() => {
    if (user) { // Only fetch when user is available
      fetchTransactions();
      fetchStats();
    }
  }, [currentPage, statusFilter, typeFilter, searchTerm, user, isMineView]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      // Check if user is authenticated
      if (!user) {
        console.log("AdminTransactions - No user, skipping fetch");
        return;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: "20"
      });

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      if (typeFilter !== "all") {
        params.append("type", typeFilter);
      }

      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      // Use different API endpoint based on user role and view
      let apiEndpoint = `${getApiBase()}/api/transactions`;
      if (isMineView && user?.role === "TourGuide") {
        apiEndpoint = `${getApiBase()}/api/transactions/tour-guide`;
      }

      console.log("AdminTransactions - API Debug:", {
        isMineView,
        userRole: user?.role,
        apiEndpoint,
        userId: user?.id,
        hasToken: !!localStorage.getItem("accessToken")
      });

      const response = await httpJson<TransactionsResponse>(
        `${apiEndpoint}?${params.toString()}`
      );

      setTransactions(response.transactions);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.totalCount);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Không thể tải danh sách giao dịch");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Check if user is authenticated
      if (!user) {
        console.log("AdminTransactions - No user for stats, skipping fetch");
        return;
      }

      // Use different API endpoint based on user role and view
      let apiEndpoint = `${getApiBase()}/api/transactions/statistics`;
      if (isMineView && user?.role === "TourGuide") {
        apiEndpoint = `${getApiBase()}/api/transactions/tour-guide/statistics`;
      }

      console.log("AdminTransactions - Stats API Debug:", {
        isMineView,
        userRole: user?.role,
        statsApiEndpoint: apiEndpoint,
        hasToken: !!localStorage.getItem("accessToken")
      });

      const response = await httpJson<TransactionStats>(apiEndpoint);
      setStats(response);
    } catch (error) {
      console.error("Error fetching transaction stats:", error);
    }
  };

  const handleStatusChange = async (transactionId: string, newStatus: string) => {
    try {
      setActionLoading(transactionId);

      await httpJson(`${getApiBase()}/api/transactions/${transactionId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus })
      });

      toast.success("Cập nhật trạng thái giao dịch thành công");
      fetchTransactions();
    } catch (error: any) {
      console.error("Error updating transaction status:", error);
      toast.error(error.message || "Không thể cập nhật trạng thái");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    // Transaction status values: pending, completed, failed, cancelled, refunded
    switch (status.toLowerCase()) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Đã hoàn thành</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Chờ xử lý</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Thất bại</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Đã hủy</Badge>;
      case "refunded":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Đã hoàn tiền</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string, entityType?: string) => {
    // Use entityType if available, otherwise use type
    const displayType = entityType || type;

    switch (displayType.toLowerCase()) {
      case "booking":
        return <Badge className="bg-blue-100 text-blue-800">Đặt tour</Badge>;
      case "order":
        return <Badge className="bg-purple-100 text-purple-800">Đơn hàng</Badge>;
      case "booking_payment":
        return <Badge className="bg-blue-100 text-blue-800">Thanh toán tour</Badge>;
      case "order_payment":
        return <Badge className="bg-purple-100 text-purple-800">Thanh toán đơn hàng</Badge>;
      case "payment":
        return <Badge className="bg-green-100 text-green-800">Thanh toán</Badge>;
      case "payout":
        return <Badge className="bg-gray-100 text-dark-800">Chuyển tiền ra</Badge>;
      case "refund":
        return <Badge className="bg-red-100 text-red-800">Hoàn tiền</Badge>;
      case "promotion_payment":
        return <Badge className="bg-yellow-100 text-yellow-800">Thanh toán khuyến mãi</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
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

  if (!user || user.role !== "Admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600">
            {!user ? "Bạn cần đăng nhập để truy cập trang này." : "Bạn cần quyền quản trị để truy cập trang này."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isMineView ? "Giao dịch của tôi" : "Quản lý giao dịch"}
            </h1>
            <p className="text-gray-600">
              {isMineView ? "Xem các giao dịch từ tour của bạn" : "Quản lý tất cả giao dịch đặt tour và đơn hàng"}
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Tổng cộng: {totalCount} giao dịch
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Giao dịch chuyển tiền vào</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalIn ?? 0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Giao dịch chuyển tiền đi</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalOut ?? 0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Số lượng chuyển tiền vào</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalInCount ?? 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Số lượng chuyển tiền đi</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOutCount ?? 0}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Tìm kiếm theo mã giao dịch, tên khách hàng, tour..."
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
                    <SelectItem value="completed">Đã hoàn thành</SelectItem>
                    <SelectItem value="pending">Chờ xử lý</SelectItem>
                    <SelectItem value="failed">Thất bại</SelectItem>
                    <SelectItem value="cancelled">Đã hủy</SelectItem>
                    <SelectItem value="refunded">Đã hoàn tiền</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-48">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Loại giao dịch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="booking">Đặt tour</SelectItem>
                    <SelectItem value="payment">Thanh toán</SelectItem>
                    <SelectItem value="order">Đơn hàng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách giao dịch</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {getTypeBadge(transaction.type, transaction.entityType)}
                            {getStatusBadge(transaction.status)}
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDate(transaction.createdAt)}
                          </span>
                        </div>

                        {/* Transaction Info */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <CreditCard className="w-4 h-4" />
                            <span className="font-mono">{transaction.transactionNumber}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{transaction.customerName}</span>
                          </div>
                          {transaction.bookingNumber && (
                            <div className="flex items-center gap-1 text-blue-600">
                              <span className="font-medium">Đặt tour: {transaction.bookingNumber}</span>
                            </div>
                          )}
                          {transaction.orderNumber && (
                            <div className="flex items-center gap-1 text-purple-600">
                              <span className="font-medium">Đơn hàng: {transaction.orderNumber}</span>
                            </div>
                          )}
                          {transaction.tourTitle && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{transaction.tourTitle}</span>
                            </div>
                          )}
                        </div>

                        {/* Amount and Details */}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-semibold text-green-600">
                              {formatCurrency(transaction.amount)} {transaction.currency}
                            </div>
                            {transaction.paymentMethod && (
                              <div className="text-xs text-gray-500">
                                {transaction.paymentMethod} {transaction.paymentGateway && `via ${transaction.paymentGateway}`}
                              </div>
                            )}
                          </div>
                          {transaction.participants && (
                            <span className="text-sm text-gray-500">
                              {transaction.participants} người
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setShowTransactionDialog(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" disabled={actionLoading === transaction.id}>
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {transaction.status.toLowerCase() !== "completed" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(transaction.id, "completed")}
                                disabled={actionLoading === transaction.id}
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Đánh dấu hoàn thành
                              </DropdownMenuItem>
                            )}
                            {transaction.status.toLowerCase() !== "pending" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(transaction.id, "pending")}
                                disabled={actionLoading === transaction.id}
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Đặt lại chờ xử lý
                              </DropdownMenuItem>
                            )}
                            {transaction.status.toLowerCase() !== "failed" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(transaction.id, "failed")}
                                disabled={actionLoading === transaction.id}
                              >
                                <X className="w-4 h-4 mr-2" />
                                Đánh dấu thất bại
                              </DropdownMenuItem>
                            )}
                            {transaction.status.toLowerCase() !== "cancelled" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(transaction.id, "cancelled")}
                                disabled={actionLoading === transaction.id}
                              >
                                <X className="w-4 h-4 mr-2" />
                                Hủy
                              </DropdownMenuItem>
                            )}
                            {transaction.status.toLowerCase() !== "refunded" && transaction.status.toLowerCase() !== "completed" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(transaction.id, "refunded")}
                                disabled={actionLoading === transaction.id}
                              >
                                <DollarSign className="w-4 h-4 mr-2" />
                                Đánh dấu đã hoàn tiền
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
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Không có giao dịch nào
                </h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                    ? "Không tìm thấy giao dịch phù hợp với bộ lọc"
                    : "Chưa có giao dịch nào trong hệ thống"
                  }
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Trước
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                    const page = index + 1;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Sau
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction Detail Dialog */}
      {selectedTransaction && (
        <AlertDialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Chi tiết giao dịch</AlertDialogTitle>
            </AlertDialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Mã giao dịch</label>
                  <p className="text-lg font-semibold font-mono">{selectedTransaction.transactionNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Loại</label>
                  <div className="mt-1">{getTypeBadge(selectedTransaction.type, selectedTransaction.entityType)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Trạng thái giao dịch</label>
                  <div className="mt-1">{getStatusBadge(selectedTransaction.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Số tiền</label>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(selectedTransaction.amount)} {selectedTransaction.currency}
                  </p>
                </div>
                {selectedTransaction.paymentMethod && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phương thức thanh toán</label>
                    <p className="text-sm">{selectedTransaction.paymentMethod}</p>
                    {selectedTransaction.paymentGateway && (
                      <p className="text-xs text-gray-500">via {selectedTransaction.paymentGateway}</p>
                    )}
                  </div>
                )}
                {selectedTransaction.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Mô tả</label>
                    <p className="text-sm">{selectedTransaction.description}</p>
                  </div>
                )}
              </div>

              {/* Related entity info */}
              {(selectedTransaction.bookingNumber || selectedTransaction.orderNumber) && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Thông tin liên quan</h3>
                  {selectedTransaction.bookingNumber && (
                    <div className="mb-2">
                      <label className="text-xs font-medium text-gray-500">Mã đặt tour</label>
                      <p className="text-sm text-blue-600 font-medium">{selectedTransaction.bookingNumber}</p>
                    </div>
                  )}
                  {selectedTransaction.orderNumber && (
                    <div className="mb-2">
                      <label className="text-xs font-medium text-gray-500">Mã đơn hàng</label>
                      <p className="text-sm text-purple-600 font-medium">{selectedTransaction.orderNumber}</p>
                    </div>
                  )}
                  {selectedTransaction.paymentStatus && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Trạng thái thanh toán (từ đơn)</label>
                      <p className="text-sm">{selectedTransaction.paymentStatus}</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500">Khách hàng</label>
                <p className="text-lg">{selectedTransaction.customerName}</p>
                <p className="text-sm text-gray-600">{selectedTransaction.customerEmail}</p>
              </div>

              {selectedTransaction.tourTitle && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Tour</label>
                  <p className="text-lg">{selectedTransaction.tourTitle}</p>
                  {selectedTransaction.tourDate && (
                    <p className="text-sm text-gray-600">
                      Ngày: {new Date(selectedTransaction.tourDate).toLocaleDateString('vi-VN')}
                    </p>
                  )}
                  {selectedTransaction.participants && (
                    <p className="text-sm text-gray-600">
                      Số người: {selectedTransaction.participants}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Ngày tạo</label>
                  <p className="text-sm">{formatDate(selectedTransaction.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Cập nhật cuối</label>
                  <p className="text-sm">{formatDate(selectedTransaction.updatedAt)}</p>
                </div>
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Đóng</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </AdminLayout>
  );
}
