import React, { useState, useEffect } from "react";
import { 
  Search, 
  Eye, 
  Package,
  Truck,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { httpJson, getApiBase } from "@/src/lib/http";
import { toast } from "sonner";
import { useAuth } from "@/src/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  subtotal: number;
  selectedVariant?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  currency: string;
  receiverName: string;
  receiverPhone: string;
  receiverEmail: string;
  shippingAddress: string;
  notes?: string;
  createdAt: string;
  items: OrderItem[];
}

interface OrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export default function AdminOrderManagement() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter, paymentStatusFilter, searchTerm]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: "20"
      });
      
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      
      if (paymentStatusFilter !== "all") {
        params.append("paymentStatus", paymentStatusFilter);
      }
      
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      const response = await httpJson<OrdersResponse>(
        `${getApiBase()}/api/orders/admin?${params.toString()}`
      );
      
      setOrders(response.orders);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.totalCount);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pendingpayment":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Chờ thanh toán</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Đang xử lý</Badge>;
      case "shipped":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Đã giao hàng</Badge>;
      case "delivered":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Đã nhận hàng</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Đã hủy</Badge>;
      case "returned":
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Đã trả hàng</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Chờ thanh toán</Badge>;
      case "paid":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Đã thanh toán</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Thanh toán thất bại</Badge>;
      case "refunded":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Đã hoàn tiền</Badge>;
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

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDialog(true);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPaymentStatusFilter("all");
    setCurrentPage(1);
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
            <h1 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h1>
            <p className="text-gray-600">Quản lý tất cả đơn hàng sản phẩm của khách hàng</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchOrders}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
            <div className="text-sm text-gray-500">
              Tổng cộng: {totalCount} đơn hàng
            </div>
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
                    placeholder="Tìm kiếm theo mã đơn hàng, tên người nhận, email, SĐT..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Trạng thái đơn hàng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="PendingPayment">Chờ thanh toán</SelectItem>
                    <SelectItem value="Processing">Đang xử lý</SelectItem>
                    <SelectItem value="Shipped">Đã giao hàng</SelectItem>
                    <SelectItem value="Delivered">Đã nhận hàng</SelectItem>
                    <SelectItem value="Cancelled">Đã hủy</SelectItem>
                    <SelectItem value="Returned">Đã trả hàng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-48">
                <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Trạng thái thanh toán" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="Pending">Chờ thanh toán</SelectItem>
                    <SelectItem value="Paid">Đã thanh toán</SelectItem>
                    <SelectItem value="Failed">Thanh toán thất bại</SelectItem>
                    <SelectItem value="Refunded">Đã hoàn tiền</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(searchTerm || statusFilter !== "all" || paymentStatusFilter !== "all") && (
                <Button variant="outline" onClick={clearFilters}>
                  Bỏ lọc
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách đơn hàng</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="h-20 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {getOrderStatusBadge(order.status)}
                            {getPaymentStatusBadge(order.paymentStatus)}
                          </div>
                          <span className="text-sm font-mono text-gray-600">{order.orderNumber}</span>
                          <span className="text-sm text-gray-500">
                            {formatDate(order.createdAt)}
                          </span>
                        </div>

                        {/* Order Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Package className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">{order.items.length} sản phẩm</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <DollarSign className="w-4 h-4" />
                              <span className="font-semibold">{formatCurrency(order.totalAmount)}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-gray-500" />
                              <span>{order.receiverName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-4 h-4" />
                              <span>{order.receiverEmail}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="w-4 h-4" />
                              <span className="truncate">{order.shippingAddress}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewOrder(order)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Xem chi tiết
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Không có đơn hàng nào</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
            >
              Trước
            </Button>
            <span className="text-sm text-gray-600">
              Trang {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
            >
              Sau
            </Button>
          </div>
        )}

        {/* Order Detail Dialog */}
        <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chi tiết đơn hàng</DialogTitle>
              <DialogDescription>
                Mã đơn hàng: {selectedOrder?.orderNumber}
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6 mt-4">
                {/* Status */}
                <div className="flex items-center gap-2">
                  {getOrderStatusBadge(selectedOrder.status)}
                  {getPaymentStatusBadge(selectedOrder.paymentStatus)}
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold mb-3">Sản phẩm</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => {
                      const variant = item.selectedVariant ? (() => {
                        try {
                          const v = JSON.parse(item.selectedVariant);
                          return `${v.netAmount}${v.netUnit}`;
                        } catch {
                          return null;
                        }
                      })() : null;

                      return (
                        <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                          <img
                            src={item.productImage || "/placeholder.svg"}
                            alt={item.productName}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <p className="font-semibold">{item.productName}</p>
                            {variant && (
                              <p className="text-sm text-gray-600">Phân loại: {variant}</p>
                            )}
                            <p className="text-sm text-gray-600">
                              Số lượng: {item.quantity} × {formatCurrency(item.price)}
                            </p>
                            <p className="font-semibold text-gray-900 mt-1">
                              {formatCurrency(item.subtotal)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Receiver Info */}
                <div>
                  <h3 className="font-semibold mb-3">Thông tin người nhận</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Họ tên:</span> {selectedOrder.receiverName}</p>
                    <p><span className="font-medium">Số điện thoại:</span> {selectedOrder.receiverPhone}</p>
                    <p><span className="font-medium">Email:</span> {selectedOrder.receiverEmail}</p>
                    <p><span className="font-medium">Địa chỉ:</span> {selectedOrder.shippingAddress}</p>
                    {selectedOrder.notes && (
                      <p><span className="font-medium">Ghi chú:</span> {selectedOrder.notes}</p>
                    )}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Tổng thanh toán</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatCurrency(selectedOrder.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Dates */}
                <div className="text-sm text-gray-600">
                  <p>Ngày tạo: {formatDate(selectedOrder.createdAt)}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

