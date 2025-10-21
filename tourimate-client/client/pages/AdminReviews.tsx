import React, { useState, useEffect } from "react";
import { 
  Star, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Check, 
  X, 
  Trash2,
  Calendar,
  User,
  MessageSquare,
  ThumbsUp,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaginatedSelect, PaginatedSelectOption, usePaginatedSelect } from "@/components/ui/paginated-select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { httpJson, getApiBase } from "@/src/lib/http";
import { toast } from "sonner";
import { useAuth } from "@/src/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";

interface ReviewUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ReviewTour {
  id: string;
  title: string;
}

interface Review {
  id: string;
  rating: number;
  title?: string;
  content: string;
  images?: string;
  helpfulVotes: number;
  reportCount: number;
  status: number;
  createdAt: string;
  updatedAt: string;
  user: ReviewUser;
  tour?: ReviewTour;
  bookingNumber?: string;
}

interface ReviewReport {
  id: string;
  reason: string;
  description?: string;
  status: string;
  reportedAt: string;
  reportedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  reviewedAt?: string;
  resolution?: string;
}

interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export default function AdminReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tourFilter, setTourFilter] = useState<string>("");
  // Use paginated select for tours
  const toursPaginated = usePaginatedSelect<PaginatedSelectOption>(
    async ({ search, page, pageSize }) => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        isActive: "true",
        status: "Approved"
      });
      
      if (search) {
        params.append("searchTerm", search);
      }

      const response = await httpJson<{ tours: Array<{ id: string; title: string }> }>(
        `${getApiBase()}/api/tour?${params.toString()}`
      );
      
      return {
        data: response.tours.map(tour => ({
          value: tour.id,
          label: tour.title
        })),
        totalCount: response.tours.length,
        hasMore: response.tours.length === pageSize
      };
    },
    20
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);


  useEffect(() => {
    fetchReviews();
  }, [currentPage, statusFilter, tourFilter, searchTerm]);


  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: "20"
      });
      
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      if (tourFilter) {
        params.append("tourId", tourFilter);
      }
      
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      const response = await httpJson<ReviewsResponse>(
        `${getApiBase()}/api/reviews/admin?${params.toString()}`
      );
      
      setReviews(response.reviews);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.totalCount);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Không thể tải danh sách đánh giá");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reviewId: string, newStatus: string) => {
    try {
      setActionLoading(reviewId);
      
      // Convert string status to number
      const statusMap: { [key: string]: number } = {
        "Approved": 2,
        "Pending": 1,
        "Rejected": 3
      };
      
      const statusNumber = statusMap[newStatus];
      if (statusNumber === undefined) {
        throw new Error("Trạng thái không hợp lệ");
      }
      
      await httpJson(`${getApiBase()}/api/reviews/${reviewId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: statusNumber })
      });
      
      toast.success("Cập nhật trạng thái thành công");
      fetchReviews(); // Refresh the list
    } catch (error: any) {
      console.error("Error updating review status:", error);
      toast.error(error.message || "Không thể cập nhật trạng thái");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      setActionLoading(reviewId);
      await httpJson(`${getApiBase()}/api/reviews/${reviewId}/admin`, {
        method: "DELETE"
      });
      
      toast.success("Xóa đánh giá thành công");
      fetchReviews();
    } catch (error: any) {
      console.error("Error deleting review:", error);
      toast.error(error.message || "Không thể xóa đánh giá");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 2: // Approved
        return <Badge className="bg-green-100 text-green-800">Đã duyệt</Badge>;
      case 1: // Pending
        return <Badge className="bg-yellow-100 text-yellow-800">Chờ duyệt</Badge>;
      case 3: // Rejected
        return <Badge className="bg-red-100 text-red-800">Từ chối</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
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

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (!user || user.role !== "Admin") {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý đánh giá</h1>
            <p className="text-gray-600">Quản lý và kiểm duyệt đánh giá tour</p>
          </div>
          <div className="text-sm text-gray-500">
            Tổng cộng: {totalCount} đánh giá
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Tìm kiếm theo nội dung, tên người dùng, tour..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="approved">Đã duyệt</SelectItem>
                    <SelectItem value="pending">Chờ duyệt</SelectItem>
                    <SelectItem value="rejected">Từ chối</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <PaginatedSelect
                  options={[
                    { value: "", label: "Tất cả Tour" },
                    ...toursPaginated.options
                  ]}
                  value={tourFilter}
                  onValueChange={setTourFilter}
                  onSearch={toursPaginated.search}
                  onLoadMore={toursPaginated.loadMore}
                  placeholder="Lọc theo Tour"
                  emptyMessage="Không tìm thấy tour nào"
                  loading={toursPaginated.loading}
                  hasMore={toursPaginated.hasMore}
                  searchPlaceholder="Tìm kiếm tour..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reviews Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách đánh giá</CardTitle>
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
            ) : reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div 
                    key={review.id} 
                    className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
                      review.reportCount > 0 ? 'border-red-500 bg-red-50' : ''
                    }`}
                  >
                    {/* Red notice for reported reviews */}
                    {review.reportCount > 0 && (
                      <div className="mb-3 flex items-center gap-2 p-2 bg-red-100 border border-red-300 rounded">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span className="text-red-700 font-semibold">
                          ⚠️ Đánh giá này đã bị báo cáo {review.reportCount} lần
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            {renderStars(review.rating)}
                          </div>
                          {getStatusBadge(review.status)}
                          <span className="text-sm text-gray-500">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>

                        {/* User and Tour Info */}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{review.user.firstName} {review.user.lastName}</span>
                          </div>
                          {review.tour && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              <span>{review.tour.title}</span>
                            </div>
                          )}
                          {review.bookingNumber && (
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {review.bookingNumber}
                            </span>
                          )}
                        </div>

                        {/* Review Content */}
                        <div className="space-y-2">
                          {review.title && (
                            <h4 className="font-medium text-gray-900">{review.title}</h4>
                          )}
                          <p className="text-gray-700 text-sm">
                            {truncateText(review.content)}
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="w-4 h-4" />
                            <span>{review.helpfulVotes} hữu ích</span>
                          </div>
                          {review.reportCount > 0 && (
                            <div className="flex items-center gap-1 text-red-500">
                              <AlertTriangle className="w-4 h-4" />
                              <span>{review.reportCount} báo cáo</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedReview(review);
                            setShowReviewDialog(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" disabled={actionLoading === review.id}>
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {review.status !== 2 && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(review.id, "Approved")}
                                disabled={actionLoading === review.id}
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Duyệt
                              </DropdownMenuItem>
                            )}
                            {review.status !== 3 && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(review.id, "Rejected")}
                                disabled={actionLoading === review.id}
                              >
                                <X className="w-4 h-4 mr-2" />
                                Từ chối
                              </DropdownMenuItem>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Xóa
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Xác nhận xóa đánh giá</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteReview(review.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Xóa
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Không có đánh giá nào
                </h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== "all" 
                    ? "Không tìm thấy đánh giá phù hợp với bộ lọc"
                    : "Chưa có đánh giá nào trong hệ thống"
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

      {/* Review Detail Dialog */}
      {selectedReview && (
        <ReviewDetailDialog
          review={selectedReview}
          open={showReviewDialog}
          onOpenChange={setShowReviewDialog}
          onStatusChange={handleStatusChange}
          onDelete={handleDeleteReview}
          actionLoading={actionLoading}
        />
      )}
    </AdminLayout>
  );
}

// Review Detail Dialog Component
interface ReviewDetailDialogProps {
  review: Review;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (reviewId: string, status: string) => void;
  onDelete: (reviewId: string) => void;
  actionLoading: string | null;
}

function ReviewDetailDialog({ 
  review, 
  open, 
  onOpenChange, 
  onStatusChange, 
  onDelete, 
  actionLoading 
}: ReviewDetailDialogProps) {
  const [reports, setReports] = useState<ReviewReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  const fetchReports = async () => {
    if (review.reportCount === 0) return;
    
    try {
      setLoadingReports(true);
      const response = await httpJson<ReviewReport[]>(
        `${getApiBase()}/api/reviews/${review.id}/reports`
      );
      setReports(response);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    if (open && review.reportCount > 0) {
      fetchReports();
    }
  }, [open, review.id, review.reportCount]);
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-5 h-5 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReportReasonText = (reason: string) => {
    const reasonMap: { [key: string]: string } = {
      'Inappropriate content': 'Nội dung không phù hợp',
      'Spam': 'Spam',
      'Fake review': 'Đánh giá giả mạo',
      'Offensive language': 'Ngôn ngữ xúc phạm',
      'Harassment': 'Quấy rối',
      'Other': 'Khác'
    };
    return reasonMap[reason] || reason;
  };

  const getReportStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'Chờ xử lý',
      'investigating': 'Đang điều tra',
      'resolved': 'Đã giải quyết',
      'dismissed': 'Đã bỏ qua'
    };
    return statusMap[status] || status;
  };

  const reviewImages = review.images ? JSON.parse(review.images) : [];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Chi tiết đánh giá</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-6">
          {/* Rating and Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {renderStars(review.rating)}
              <span className="text-lg font-medium">{review.rating}/5</span>
            </div>
            <Badge className={
              review.status === 2 ? "bg-green-100 text-green-800" :
              review.status === 1 ? "bg-yellow-100 text-yellow-800" :
              "bg-red-100 text-red-800"
            }>
              {review.status === 2 ? "Đã duyệt" :
               review.status === 1 ? "Chờ duyệt" : "Từ chối"}
            </Badge>
          </div>

          {/* User Info */}
          <div className="space-y-2">
            <h4 className="font-semibold">Thông tin người đánh giá</h4>
            <div className="bg-gray-50 p-3 rounded-lg space-y-1">
              <p><strong>Tên:</strong> {review.user.firstName} {review.user.lastName}</p>
              <p><strong>Email:</strong> {review.user.email}</p>
              {review.bookingNumber && (
                <p><strong>Mã đặt tour:</strong> {review.bookingNumber}</p>
              )}
              <p><strong>Ngày đánh giá:</strong> {formatDate(review.createdAt)}</p>
            </div>
          </div>

          {/* Tour Info */}
          {review.tour && (
            <div className="space-y-2">
              <h4 className="font-semibold">Tour được đánh giá</h4>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p><strong>Tên tour:</strong> {review.tour.title}</p>
              </div>
            </div>
          )}

          {/* Review Content */}
          <div className="space-y-2">
            <h4 className="font-semibold">Nội dung đánh giá</h4>
            {review.title && (
              <h5 className="font-medium text-lg">{review.title}</h5>
            )}
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="whitespace-pre-wrap">{review.content}</p>
            </div>
          </div>

          {/* Images */}
          {reviewImages.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Hình ảnh đính kèm</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {reviewImages.map((image: string, index: number) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Review image ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="space-y-2">
            <h4 className="font-semibold">Thống kê</h4>
            <div className="bg-gray-50 p-3 rounded-lg space-y-1">
              <p><strong>Số lượt hữu ích:</strong> {review.helpfulVotes}</p>
              <p><strong>Số lượt báo cáo:</strong> {review.reportCount}</p>
              <p><strong>Cập nhật lần cuối:</strong> {formatDate(review.updatedAt)}</p>
            </div>
          </div>

          {/* Reports */}
          {review.reportCount > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-red-600">Lý do báo cáo ({review.reportCount})</h4>
              {loadingReports ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Đang tải thông tin báo cáo...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div key={report.id} className="bg-red-50 border border-red-200 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="text-xs">
                            {getReportReasonText(report.reason)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getReportStatusText(report.status)}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(report.reportedAt)}
                        </span>
                      </div>
                      {report.description && (
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>Mô tả:</strong> {report.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-600">
                        <strong>Báo cáo bởi:</strong> {report.reportedBy.firstName} {report.reportedBy.lastName} ({report.reportedBy.email})
                      </p>
                      {report.resolution && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                          <p className="text-xs text-green-700">
                            <strong>Giải quyết:</strong> {report.resolution}
                          </p>
                          {report.reviewedAt && (
                            <p className="text-xs text-green-600 mt-1">
                              Giải quyết lúc: {formatDate(report.reviewedAt)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <AlertDialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Đóng
          </Button>
          {review.status !== 2 && (
            <Button
              onClick={() => onStatusChange(review.id, "Approved")}
              disabled={actionLoading === review.id}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="w-4 h-4 mr-2" />
              Duyệt
            </Button>
          )}
          {review.status !== 3 && (
            <Button
              onClick={() => onStatusChange(review.id, "Rejected")}
              disabled={actionLoading === review.id}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-2" />
              Từ chối
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
