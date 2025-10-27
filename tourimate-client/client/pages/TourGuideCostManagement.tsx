import React, { useState, useEffect } from "react";
import { 
  Search, 
  Eye,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  TrendingDown,
  Filter,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { httpJson, getApiBase } from "@/src/lib/http";
import { toast } from "sonner";
import { useAuth } from "@/src/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";

interface Cost {
  id: string;
  costCode: string;
  costName: string;
  description: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  payerId: string;
  payerName: string;
  recipientId: string;
  recipientName: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  referenceNumber?: string;
  dueDate?: string;
  paidDate?: string;
  paymentMethod?: string;
  notes?: string;
  isRecurring: boolean;
  recurringIntervalDays?: number;
  nextDueDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface CostsResponse {
  costs: Cost[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

interface CostStatistics {
  totalPendingAmount: number;
  totalPaidAmount: number;
  totalOverdueAmount: number;
  pendingCount: number;
  paidCount: number;
  overdueCount: number;
}

export default function TourGuideCostManagement() {
  const { user } = useAuth();
  const [costs, setCosts] = useState<Cost[]>([]);
  const [statistics, setStatistics] = useState<CostStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Dialog states
  const [selectedCost, setSelectedCost] = useState<Cost | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const costTypes = [
    { value: "TourGuidePayment", label: "Thanh toán cho hướng dẫn viên" },
    { value: "RefundPayment", label: "Hoàn tiền cho khách" },
    { value: "FeaturedTourFee", label: "Phí đăng tour nổi bật" },
    { value: "CommissionFee", label: "Phí hoa hồng" },
    { value: "ServiceFee", label: "Phí dịch vụ" },
    { value: "PenaltyFee", label: "Phí phạt" },
    { value: "Other", label: "Chi phí khác" }
  ];

  useEffect(() => {
    fetchCosts();
    fetchStatistics();
  }, [currentPage, typeFilter, statusFilter, searchTerm]);

  const fetchCosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: "20",
        recipientId: user?.id || "" // Chỉ lấy chi phí mà tour guide là người nhận
      });
      
      if (typeFilter !== "all") {
        params.append("type", typeFilter);
      }
      
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      
      if (searchTerm.trim()) {
        params.append("searchTerm", searchTerm.trim());
      }

      const response = await httpJson<CostsResponse>(
        `${getApiBase()}/api/cost?${params.toString()}`
      );
      
      setCosts(response.costs);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.totalCount);
    } catch (error) {
      console.error("Error fetching costs:", error);
      toast.error("Không thể tải danh sách chi phí");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const params = new URLSearchParams({
        recipientId: user?.id || ""
      });
      
      const response = await httpJson<CostStatistics>(`${getApiBase()}/api/cost/statistics?${params.toString()}`);
      setStatistics(response);
    } catch (error) {
      console.error("Error fetching cost statistics:", error);
    }
  };

  const getTypeBadge = (type: string) => {
    const typeInfo = costTypes.find(t => t.value === type);
    const colorMap: { [key: string]: string } = {
      "TourGuidePayment": "bg-blue-100 text-blue-800",
      "RefundPayment": "bg-green-100 text-green-800",
      "FeaturedTourFee": "bg-purple-100 text-purple-800",
      "CommissionFee": "bg-yellow-100 text-yellow-800",
      "ServiceFee": "bg-gray-100 text-gray-800",
      "PenaltyFee": "bg-red-100 text-red-800",
      "Other": "bg-gray-100 text-gray-800"
    };
    
    return (
      <Badge className={colorMap[type] || "bg-gray-100 text-gray-800"}>
        {typeInfo?.label || type}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const colorMap: { [key: string]: string } = {
      "Pending": "bg-yellow-100 text-yellow-800",
      "Approved": "bg-blue-100 text-blue-800",
      "Paid": "bg-green-100 text-green-800",
      "Cancelled": "bg-red-100 text-red-800",
      "Overdue": "bg-red-100 text-red-800"
    };
    
    const statusMap: { [key: string]: string } = {
      "Pending": "Chờ thanh toán",
      "Approved": "Đã duyệt",
      "Paid": "Đã thanh toán",
      "Cancelled": "Đã hủy",
      "Overdue": "Quá hạn"
    };
    
    return (
      <Badge className={colorMap[status] || "bg-gray-100 text-gray-800"}>
        {statusMap[status] || status}
      </Badge>
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency === 'VND' ? 'VND' : currency === 'USD' ? 'USD' : 'EUR'
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

  const openDetailDialog = (cost: Cost) => {
    setSelectedCost(cost);
    setShowDetailDialog(true);
  };

  if (!user || (user.role !== "Admin" && user.role !== "TourGuide")) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600">Bạn cần quyền hướng dẫn viên để truy cập trang này.</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Chi phí của tôi</h1>
            <p className="text-gray-600">Quản lý các khoản chi phí và thanh toán</p>
          </div>
          <div className="text-sm text-gray-500">
            Tổng cộng: {totalCount} chi phí
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chờ thanh toán</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(statistics.totalPendingAmount, "VND")}</div>
                <p className="text-xs text-muted-foreground">
                  {statistics.pendingCount} chi phí
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Đã thanh toán</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(statistics.totalPaidAmount, "VND")}</div>
                <p className="text-xs text-muted-foreground">
                  {statistics.paidCount} chi phí
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quá hạn</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(statistics.totalOverdueAmount, "VND")}</div>
                <p className="text-xs text-muted-foreground">
                  {statistics.overdueCount} chi phí
                </p>
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
                    placeholder="Tìm kiếm theo tên, mã chi phí..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Loại chi phí" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    {costTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="Pending">Chờ thanh toán</SelectItem>
                    <SelectItem value="Approved">Đã duyệt</SelectItem>
                    <SelectItem value="Paid">Đã thanh toán</SelectItem>
                    <SelectItem value="Cancelled">Đã hủy</SelectItem>
                    <SelectItem value="Overdue">Quá hạn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Costs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách chi phí</CardTitle>
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
            ) : costs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên chi phí</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Số tiền</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Người trả</TableHead>
                    <TableHead>Ngày đến hạn</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costs.map((cost) => (
                    <TableRow key={cost.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{cost.costName}</div>
                          <div className="text-sm text-gray-500">{cost.costCode}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(cost.type)}</TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(cost.amount, cost.currency)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(cost.status)}</TableCell>
                      <TableCell>{cost.payerName}</TableCell>
                      <TableCell>
                        {cost.dueDate ? formatDate(cost.dueDate) : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetailDialog(cost)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Không có chi phí nào
                </h3>
                <p className="text-gray-600">
                  {searchTerm || typeFilter !== "all" || statusFilter !== "all"
                    ? "Không tìm thấy chi phí phù hợp với bộ lọc"
                    : "Chưa có chi phí nào liên quan đến bạn"
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

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Chi tiết chi phí</DialogTitle>
              <DialogDescription>
                Thông tin chi tiết về chi phí
              </DialogDescription>
            </DialogHeader>

            {selectedCost && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Mã chi phí</Label>
                    <p className="text-lg font-semibold">{selectedCost.costCode}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Loại</Label>
                    <div className="mt-1">{getTypeBadge(selectedCost.type)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Trạng thái</Label>
                    <div className="mt-1">{getStatusBadge(selectedCost.status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Số tiền</Label>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(selectedCost.amount, selectedCost.currency)}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">Tên chi phí</Label>
                  <p className="text-lg">{selectedCost.costName}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">Mô tả</Label>
                  <p className="text-sm text-gray-700">{selectedCost.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Người trả</Label>
                    <p className="text-sm">{selectedCost.payerName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Người nhận</Label>
                    <p className="text-sm">{selectedCost.recipientName}</p>
                  </div>
                </div>

                {selectedCost.dueDate && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Ngày đến hạn</Label>
                    <p className="text-sm">{formatDate(selectedCost.dueDate)}</p>
                  </div>
                )}

                {selectedCost.paidDate && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Ngày thanh toán</Label>
                    <p className="text-sm">{formatDate(selectedCost.paidDate)}</p>
                  </div>
                )}

                {selectedCost.paymentMethod && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Phương thức thanh toán</Label>
                    <p className="text-sm">{selectedCost.paymentMethod}</p>
                  </div>
                )}

                {selectedCost.notes && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Ghi chú</Label>
                    <p className="text-sm text-gray-700">{selectedCost.notes}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Ngày tạo</Label>
                    <p className="text-sm">{formatDate(selectedCost.createdAt)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Cập nhật cuối</Label>
                    <p className="text-sm">{formatDate(selectedCost.updatedAt)}</p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

