import React, { useState, useEffect } from "react";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  DollarSign,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  TrendingDown,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  createdByName?: string;
  updatedByName?: string;
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
  typeSummary: Array<{
    type: string;
    typeName: string;
    totalAmount: number;
    count: number;
  }>;
  statusSummary: Array<{
    status: string;
    statusName: string;
    totalAmount: number;
    count: number;
  }>;
}

export default function AdminCostManagement() {
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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState<Cost | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    costCode: "",
    costName: "",
    description: "",
    amount: 0,
    currency: "VND",
    type: "",
    payerId: "",
    recipientId: "",
    relatedEntityId: "",
    relatedEntityType: "",
    referenceNumber: "",
    dueDate: "",
    paymentMethod: "",
    notes: "",
    isRecurring: false,
    recurringIntervalDays: 0
  });

  const costTypes = [
    { value: "TourGuidePayment", label: "Thanh toán cho hướng dẫn viên" },
    { value: "RefundPayment", label: "Hoàn tiền cho khách" },
    { value: "FeaturedTourFee", label: "Phí đăng tour nổi bật" },
    { value: "CommissionFee", label: "Phí hoa hồng" },
    { value: "ServiceFee", label: "Phí dịch vụ" },
    { value: "PenaltyFee", label: "Phí phạt" },
    { value: "Other", label: "Chi phí khác" }
  ];

  const currencies = ["VND", "USD", "EUR"];

  useEffect(() => {
    fetchCosts();
    fetchStatistics();
  }, [currentPage, typeFilter, statusFilter, searchTerm]);

  const fetchCosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: "20"
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
      const response = await httpJson<CostStatistics>(`${getApiBase()}/api/cost/statistics`);
      setStatistics(response);
    } catch (error) {
      console.error("Error fetching cost statistics:", error);
    }
  };

  const handleCreateCost = async () => {
    try {
      setActionLoading("create");
      
      const payload = {
        ...formData,
        amount: Number(formData.amount),
        payerId: formData.payerId || user?.id,
        recipientId: formData.recipientId || user?.id,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        relatedEntityId: formData.relatedEntityId || null,
        recurringIntervalDays: formData.isRecurring ? Number(formData.recurringIntervalDays) : null
      };

      await httpJson(`${getApiBase()}/api/cost`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      
      toast.success("Tạo chi phí thành công");
      setIsCreateDialogOpen(false);
      resetForm();
      fetchCosts();
      fetchStatistics();
    } catch (error: any) {
      console.error("Error creating cost:", error);
      toast.error(error.message || "Không thể tạo chi phí");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateCost = async () => {
    if (!selectedCost) return;

    try {
      setActionLoading("update");
      
      const payload = {
        costName: formData.costName,
        description: formData.description,
        amount: Number(formData.amount),
        currency: formData.currency,
        status: selectedCost.status,
        referenceNumber: formData.referenceNumber,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        paidDate: selectedCost.paidDate,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        isRecurring: formData.isRecurring,
        recurringIntervalDays: formData.isRecurring ? Number(formData.recurringIntervalDays) : null
      };

      await httpJson(`${getApiBase()}/api/cost/${selectedCost.id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      
      toast.success("Cập nhật chi phí thành công");
      setIsEditDialogOpen(false);
      setSelectedCost(null);
      resetForm();
      fetchCosts();
      fetchStatistics();
    } catch (error: any) {
      console.error("Error updating cost:", error);
      toast.error(error.message || "Không thể cập nhật chi phí");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCost = async (costId: string) => {
    try {
      setActionLoading(costId);
      await httpJson(`${getApiBase()}/api/cost/${costId}`, {
        method: "DELETE"
      });
      
      toast.success("Xóa chi phí thành công");
      fetchCosts();
      fetchStatistics();
    } catch (error: any) {
      console.error("Error deleting cost:", error);
      toast.error(error.message || "Không thể xóa chi phí");
    } finally {
      setActionLoading(null);
    }
  };

  const resetForm = () => {
    setFormData({
      costCode: "",
      costName: "",
      description: "",
      amount: 0,
      currency: "VND",
      type: "",
      payerId: "",
      recipientId: "",
      relatedEntityId: "",
      relatedEntityType: "",
      referenceNumber: "",
      dueDate: "",
      paymentMethod: "",
      notes: "",
      isRecurring: false,
      recurringIntervalDays: 0
    });
  };

  const openEditDialog = (cost: Cost) => {
    setSelectedCost(cost);
    setFormData({
      costCode: cost.costCode,
      costName: cost.costName,
      description: cost.description,
      amount: cost.amount,
      currency: cost.currency,
      type: cost.type,
      payerId: cost.payerId,
      recipientId: cost.recipientId,
      relatedEntityId: cost.relatedEntityId || "",
      relatedEntityType: cost.relatedEntityType || "",
      referenceNumber: cost.referenceNumber || "",
      dueDate: cost.dueDate ? new Date(cost.dueDate).toISOString().split('T')[0] : "",
      paymentMethod: cost.paymentMethod || "",
      notes: cost.notes || "",
      isRecurring: cost.isRecurring,
      recurringIntervalDays: cost.recurringIntervalDays || 0
    });
    setIsEditDialogOpen(true);
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý chi phí</h1>
            <p className="text-gray-600">Quản lý các khoản chi phí và thanh toán</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Tổng cộng: {totalCount} chi phí
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo chi phí
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Tạo chi phí mới</DialogTitle>
                  <DialogDescription>
                    Thêm chi phí mới vào hệ thống
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="costCode">Mã chi phí *</Label>
                      <Input
                        id="costCode"
                        value={formData.costCode}
                        onChange={(e) => setFormData({...formData, costCode: e.target.value})}
                        placeholder="VD: COST_001"
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Loại chi phí *</Label>
                      <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại chi phí" />
                        </SelectTrigger>
                        <SelectContent>
                          {costTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="costName">Tên chi phí *</Label>
                    <Input
                      id="costName"
                      value={formData.costName}
                      onChange={(e) => setFormData({...formData, costName: e.target.value})}
                      placeholder="VD: Thanh toán tour guide tháng 12"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Mô tả *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Mô tả chi tiết về chi phí này"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="amount">Số tiền *</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency">Đơn vị tiền tệ *</Label>
                      <Select value={formData.currency} onValueChange={(value) => setFormData({...formData, currency: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn đơn vị" />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map(currency => (
                            <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="dueDate">Ngày đến hạn</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="paymentMethod">Phương thức thanh toán</Label>
                    <Input
                      id="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                      placeholder="VD: Chuyển khoản, Tiền mặt"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Ghi chú</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Ghi chú thêm về chi phí"
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isRecurring"
                      checked={formData.isRecurring}
                      onCheckedChange={(checked) => setFormData({...formData, isRecurring: checked})}
                    />
                    <Label htmlFor="isRecurring">Chi phí định kỳ</Label>
                  </div>

                  {formData.isRecurring && (
                    <div>
                      <Label htmlFor="recurringIntervalDays">Số ngày lặp lại</Label>
                      <Input
                        id="recurringIntervalDays"
                        type="number"
                        value={formData.recurringIntervalDays}
                        onChange={(e) => setFormData({...formData, recurringIntervalDays: Number(e.target.value)})}
                        placeholder="30"
                        min="1"
                      />
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button 
                    onClick={handleCreateCost}
                    disabled={actionLoading === "create"}
                  >
                    {actionLoading === "create" ? "Đang tạo..." : "Tạo chi phí"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng chi phí</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    statistics.totalPendingAmount + statistics.totalPaidAmount + statistics.totalOverdueAmount, 
                    "VND"
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tất cả chi phí
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
                    <TableHead>Người nhận</TableHead>
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
                      <TableCell>{cost.recipientName}</TableCell>
                      <TableCell>
                        {cost.dueDate ? formatDate(cost.dueDate) : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(cost)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xóa chi phí?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Hành động này không thể hoàn tác. Chi phí sẽ bị xóa vĩnh viễn.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteCost(cost.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Xóa
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
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
                    : "Chưa có chi phí nào trong hệ thống"
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

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa chi phí</DialogTitle>
              <DialogDescription>
                Cập nhật thông tin chi phí
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-costName">Tên chi phí *</Label>
                <Input
                  id="edit-costName"
                  value={formData.costName}
                  onChange={(e) => setFormData({...formData, costName: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="edit-description">Mô tả *</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-amount">Số tiền *</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-currency">Đơn vị tiền tệ *</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({...formData, currency: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn đơn vị" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map(currency => (
                        <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-dueDate">Ngày đến hạn</Label>
                <Input
                  id="edit-dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="edit-paymentMethod">Phương thức thanh toán</Label>
                <Input
                  id="edit-paymentMethod"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="edit-notes">Ghi chú</Label>
                <Textarea
                  id="edit-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isRecurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) => setFormData({...formData, isRecurring: checked})}
                />
                <Label htmlFor="edit-isRecurring">Chi phí định kỳ</Label>
              </div>

              {formData.isRecurring && (
                <div>
                  <Label htmlFor="edit-recurringIntervalDays">Số ngày lặp lại</Label>
                  <Input
                    id="edit-recurringIntervalDays"
                    type="number"
                    value={formData.recurringIntervalDays}
                    onChange={(e) => setFormData({...formData, recurringIntervalDays: Number(e.target.value)})}
                    min="1"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Hủy
              </Button>
              <Button 
                onClick={handleUpdateCost}
                disabled={actionLoading === "update"}
              >
                {actionLoading === "update" ? "Đang cập nhật..." : "Cập nhật"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

