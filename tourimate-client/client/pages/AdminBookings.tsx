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
  MapPin,
  Users,
  DollarSign,
  Phone,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { httpJson, getApiBase } from "@/src/lib/http";
import { toast } from "sonner";
import { useAuth } from "@/src/hooks/useAuth";
import { useSearchParams } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";

interface Booking {
  id: string;
  bookingNumber: string;
  status: number;
  paymentStatus: number;
  totalAmount: number;
  participants: number;
  contactInfo: string;
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
  tour: {
    id: string;
    title: string;
    tourGuideId: string;
  };
  tourAvailability: {
    id: string;
    date: string;
    adultPrice: number;
    maxParticipants: number;
    bookedParticipants: number;
  };
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface BookingsResponse {
  bookings: Booking[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export default function AdminBookings() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Check if this is "mine" view for tour guide
  const isMineView = searchParams.get('mine') === '1';

  useEffect(() => {
    fetchBookings();
  }, [currentPage, statusFilter, searchTerm]);

  const fetchBookings = async () => {
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

      // Use different API endpoint based on user role and view
      let apiEndpoint = `${getApiBase()}/api/bookings/admin`;
      if (isMineView && user?.role === "TourGuide") {
        apiEndpoint = `${getApiBase()}/api/bookings/tour-guide`;
      }

      const response = await httpJson<BookingsResponse>(
        `${apiEndpoint}?${params.toString()}`
      );
      
      setBookings(response.bookings);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.totalCount);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Không thể tải danh sách đặt tour");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      setActionLoading(bookingId);
      await httpJson(`${getApiBase()}/api/bookings/${bookingId}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus })
      });
      
      toast.success("Cập nhật trạng thái thành công");
      fetchBookings();
    } catch (error: any) {
      console.error("Error updating booking status:", error);
      toast.error(error.message || "Không thể cập nhật trạng thái");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1: // PendingPayment
        return <Badge className="bg-yellow-100 text-yellow-800">Chờ thanh toán</Badge>;
      case 2: // Confirmed
        return <Badge className="bg-blue-100 text-blue-800">Đã xác nhận</Badge>;
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

  const getPaymentStatusBadge = (status: number) => {
    switch (status) {
      case 1: // Pending
        return <Badge className="bg-yellow-100 text-yellow-800">Chờ thanh toán</Badge>;
      case 2: // Paid
        return <Badge className="bg-green-100 text-green-800">Đã thanh toán</Badge>;
      case 3: // Failed
        return <Badge className="bg-red-100 text-red-800">Thanh toán thất bại</Badge>;
      case 4: // Refunded
        return <Badge className="bg-purple-100 text-purple-800">Đã hoàn tiền</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
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

  const parseContactInfo = (contactInfo: string) => {
    try {
      return JSON.parse(contactInfo);
    } catch {
      return null;
    }
  };

  if (!user || (user.role !== "Admin" && !(user.role === "TourGuide" && isMineView))) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600">
            {!user ? "Bạn cần đăng nhập để truy cập trang này." : 
             user.role !== "Admin" && !isMineView ? "Bạn cần quyền quản trị để truy cập trang này." :
             "Bạn chỉ có thể xem đặt tour của chính mình."}
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
              {isMineView ? "Đặt tour của tôi" : "Quản lý đặt tour"}
            </h1>
            <p className="text-gray-600">
              {isMineView ? "Xem các tour đã được đặt từ tour của bạn" : "Quản lý tất cả đặt tour của khách hàng"}
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Tổng cộng: {totalCount} đặt tour
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
                    placeholder="Tìm kiếm theo mã đặt tour, tên khách hàng, tour..."
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
                    <SelectItem value="pendingpayment">Chờ thanh toán</SelectItem>
                    <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                    <SelectItem value="cancelled">Đã hủy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bookings List */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách đặt tour</CardTitle>
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
            ) : bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((booking) => {
                  const contactInfo = parseContactInfo(booking.contactInfo);
                  return (
                    <div key={booking.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          {/* Header */}
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              {getStatusBadge(booking.status)}
                              {getPaymentStatusBadge(booking.paymentStatus)}
                            </div>
                            <span className="text-sm text-gray-500">
                              {formatDate(booking.createdAt)}
                            </span>
                          </div>

                          {/* Booking Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                <span className="font-medium">{booking.tour.title}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(booking.tourAvailability.date).toLocaleDateString('vi-VN')}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Users className="w-4 h-4" />
                                <span>{booking.participants} người</span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <User className="w-4 h-4 text-gray-500" />
                                <span>{booking.customer.firstName} {booking.customer.lastName}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail className="w-4 h-4" />
                                <span>{booking.customer.email}</span>
                              </div>
                              {contactInfo?.phone && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Phone className="w-4 h-4" />
                                  <span>{contactInfo.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Amount and Booking Number */}
                          <div className="flex items-center justify-between">
                            <div className="text-lg font-semibold text-green-600">
                              {formatCurrency(booking.totalAmount)}
                            </div>
                            <span className="text-sm text-gray-500 font-mono">
                              {booking.bookingNumber}
                            </span>
                          </div>

                          {/* Special Requests */}
                          {booking.specialRequests && (
                            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                              <strong>Yêu cầu đặc biệt:</strong> {booking.specialRequests}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowBookingDialog(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" disabled={actionLoading === booking.id}>
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {booking.status !== 3 && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(booking.id, "Completed")}
                                  disabled={actionLoading === booking.id}
                                >
                                  <Check className="w-4 h-4 mr-2" />
                                  Hoàn thành
                                </DropdownMenuItem>
                              )}
                              {booking.status !== 2 && booking.status !== 3 && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(booking.id, "Confirmed")}
                                  disabled={actionLoading === booking.id}
                                >
                                  <Check className="w-4 h-4 mr-2" />
                                  Xác nhận
                                </DropdownMenuItem>
                              )}
                              {booking.status !== 4 && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(booking.id, "Cancelled")}
                                  disabled={actionLoading === booking.id}
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
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Không có đặt tour nào
                </h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== "all"
                    ? "Không tìm thấy đặt tour phù hợp với bộ lọc"
                    : "Chưa có đặt tour nào trong hệ thống"
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

      {/* Booking Detail Dialog */}
      {selectedBooking && (
        <AlertDialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <AlertDialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle>Chi tiết đặt tour</AlertDialogTitle>
            </AlertDialogHeader>

            <div className="space-y-6">
              {/* Status and Payment */}
              <div className="flex items-center gap-4">
                {getStatusBadge(selectedBooking.status)}
                {getPaymentStatusBadge(selectedBooking.paymentStatus)}
                <span className="text-lg font-semibold text-green-600">
                  {formatCurrency(selectedBooking.totalAmount)}
                </span>
              </div>

              {/* Booking Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Mã đặt tour</label>
                    <p className="text-lg font-mono">{selectedBooking.bookingNumber}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tour</label>
                    <p className="text-lg font-semibold">{selectedBooking.tour.title}</p>
                    <p className="text-sm text-gray-600">
                      Ngày: {new Date(selectedBooking.tourAvailability.date).toLocaleDateString('vi-VN')}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Số người tham gia</label>
                    <p className="text-lg">{selectedBooking.participants} người</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Khách hàng</label>
                    <p className="text-lg">{selectedBooking.customer.firstName} {selectedBooking.customer.lastName}</p>
                    <p className="text-sm text-gray-600">{selectedBooking.customer.email}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Thông tin liên hệ</label>
                    {(() => {
                      const contactInfo = parseContactInfo(selectedBooking.contactInfo);
                      return contactInfo ? (
                        <div className="space-y-1">
                          <p className="text-sm">Tên: {contactInfo.name}</p>
                          <p className="text-sm">Email: {contactInfo.email}</p>
                          <p className="text-sm">Điện thoại: {contactInfo.phone}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Không có thông tin</p>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {selectedBooking.specialRequests && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Yêu cầu đặc biệt</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">{selectedBooking.specialRequests}</p>
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Ngày tạo</label>
                  <p className="text-sm">{formatDate(selectedBooking.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Cập nhật cuối</label>
                  <p className="text-sm">{formatDate(selectedBooking.updatedAt)}</p>
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
