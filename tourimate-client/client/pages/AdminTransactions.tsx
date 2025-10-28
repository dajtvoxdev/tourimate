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
  TrendingDown
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
  transactionNumber: string;
  type: string;
  status: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  tourTitle?: string;
  tourDate?: string;
  participants?: number;
  createdAt: string;
  updatedAt: string;
  paymentStatus: string;
  contactInfo?: string;
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
  totalRevenue: number;
  pendingRevenue: number;
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
      const transaction = transactions.find(t => t.id === transactionId);
      if (!transaction) return;

      await httpJson(`${getApiBase()}/api/transactions/${transactionId}/status?type=${transaction.type}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus })
      });
      
      toast.success("Cập nhật trạng thái thành công");
      fetchTransactions();
    } catch (error: any) {
      console.error("Error updating transaction status:", error);
      toast.error(error.message || "Không thể cập nhật trạng thái");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Hoàn thành</Badge>;
      case "confirmed":
      case "confirm":
        return <Badge className="bg-blue-100 text-blue-800">Đã chuyển khoản</Badge>;
      case "pendingpayment":
        return <Badge className="bg-yellow-100 text-yellow-800">Chờ thanh toán</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Đã hủy</Badge>;
      case "pending":
        return <Badge className="bg-blue-100 text-blue-800">Chờ duyệt</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case "booking":
        return <Badge className="bg-blue-100 text-blue-800">Đặt tour</Badge>;
      case "payment":
        return <Badge className="bg-green-100 text-green-800">Thanh toán</Badge>;
      case "order":
        return <Badge className="bg-purple-100 text-purple-800">Đơn hàng</Badge>;
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

  if (!user || (user.role !== "Admin" && !(user.role === "TourGuide" && isMineView))) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600">
            {!user ? "Bạn cần đăng nhập để truy cập trang này." : 
             user.role !== "Admin" && !isMineView ? "Bạn cần quyền quản trị để truy cập trang này." :
             "Bạn chỉ có thể xem giao dịch của tour của chính mình."}
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
                <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Doanh thu chờ</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.pendingRevenue)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Đặt tour</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.bookingStats.reduce((sum, stat) => sum + stat.count, 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Đơn hàng</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.orderStats.reduce((sum, stat) => sum + stat.count, 0)}
                </div>
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
                    <SelectItem value="completed">Hoàn thành</SelectItem>
                    <SelectItem value="confirmed">Đã chuyển khoản</SelectItem>
                    <SelectItem value="pendingpayment">Chờ thanh toán</SelectItem>
                    <SelectItem value="cancelled">Đã hủy</SelectItem>
                    <SelectItem value="pending">Chờ duyệt</SelectItem>
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
                            {getTypeBadge(transaction.type)}
                            {getStatusBadge(transaction.status)}
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDate(transaction.createdAt)}
                          </span>
                        </div>

                        {/* Transaction Info */}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            {transaction.type === "Payment" ? (
                              <DollarSign className="w-4 h-4 text-green-600" />
                            ) : (
                              <CreditCard className="w-4 h-4" />
                            )}
                            <span>{transaction.transactionNumber}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{transaction.customerName}</span>
                          </div>
                          {transaction.tourTitle && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{transaction.tourTitle}</span>
                            </div>
                          )}
                        </div>

                        {/* Amount and Details */}
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-semibold text-green-600">
                            {formatCurrency(transaction.amount)}
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
                            {transaction.status !== "Confirmed" && transaction.status !== "confirm" && transaction.status !== "Completed" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(transaction.id, "Confirmed")}
                                disabled={actionLoading === transaction.id}
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Đã chuyển khoản
                              </DropdownMenuItem>
                            )}
                            {transaction.status !== "Completed" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(transaction.id, "Completed")}
                                disabled={actionLoading === transaction.id}
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Hoàn thành
                              </DropdownMenuItem>
                            )}
                            {transaction.status !== "Cancelled" && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(transaction.id, "Cancelled")}
                                disabled={actionLoading === transaction.id}
                              >
                                <X className="w-4 h-4 mr-2" />
                                Hủy
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
                  <p className="text-lg font-semibold">{selectedTransaction.transactionNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Loại</label>
                  <div className="mt-1">{getTypeBadge(selectedTransaction.type)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                  <div className="mt-1">{getStatusBadge(selectedTransaction.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Số tiền</label>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(selectedTransaction.amount)}
                  </p>
                </div>
              </div>

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
