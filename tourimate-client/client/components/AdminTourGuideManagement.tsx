import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import AdminLayout from "./AdminLayout";
import { httpWithRefresh, httpJson, getApiBase } from "@/src/lib/http";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import FilePreview from "./FilePreview";
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Search,
  Filter,
  Calendar,
  User,
  Mail,
  Phone,
  FileText,
  Image as ImageIcon,
  Download
} from "lucide-react";

interface TourGuideApplication {
  id: string;
  userId: string;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  userPhone: string;
  status: string;
  createdAt: string;
  reviewedAt?: string;
  feedback?: string;
}

interface ApplicationDetail extends TourGuideApplication {
  applicationData: string;
  documents?: string;
  reviewerName?: string;
}

interface ApplicationsResponse {
  applications: TourGuideApplication[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const AdminTourGuideManagement = () => {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<TourGuideApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationDetail | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Review form state
  const [reviewStatus, setReviewStatus] = useState("approved");
  const [reviewFeedback, setReviewFeedback] = useState("");

  const pageSize = 10;

  const statusConfig = {
    pending_review: { label: "Chờ xem xét", color: "bg-yellow-100 text-yellow-800" },
    approved: { label: "Đã phê duyệt", color: "bg-green-100 text-green-800" },
    rejected: { label: "Bị từ chối", color: "bg-red-100 text-red-800" },
    allow_edit: { label: "Cho phép chỉnh sửa", color: "bg-blue-100 text-blue-800" }
  };

  const loadApplications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });
      
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      
      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await httpWithRefresh(`${getApiBase()}/api/auth/tour-guide-applications?${params}`);
      if (response.ok) {
        const data: ApplicationsResponse = await response.json();
        setApplications(data.applications);
        setTotalPages(data.totalPages);
        setTotalCount(data.totalCount);
      } else {
        toast.error("Không thể tải danh sách đơn đăng ký");
      }
    } catch (error) {
      console.error("Error loading applications:", error);
      toast.error("Không thể tải danh sách đơn đăng ký");
    } finally {
      setLoading(false);
    }
  };

  const loadApplicationDetail = async (id: string) => {
    try {
      const response = await httpWithRefresh(`${getApiBase()}/api/auth/tour-guide-applications/${id}`);
      if (response.ok) {
        const data: ApplicationDetail = await response.json();
        setSelectedApplication(data);
        setReviewFeedback(data.feedback || "");
        setIsReviewDialogOpen(true);
      } else {
        toast.error("Không thể tải chi tiết đơn đăng ký");
      }
    } catch (error) {
      console.error("Error loading application detail:", error);
      toast.error("Không thể tải chi tiết đơn đăng ký");
    }
  };

  const handleReview = async () => {
    if (!selectedApplication) return;
    
    try {
      setReviewLoading(true);
      const response = await httpWithRefresh(`${getApiBase()}/api/auth/tour-guide-applications/${selectedApplication.id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: reviewStatus,
          feedback: reviewFeedback
        }),
      });

      if (response.ok) {
        toast.success("Đánh giá đơn đăng ký thành công");
        setIsReviewDialogOpen(false);
        setSelectedApplication(null);
        loadApplications();
      } else {
        const errorText = await response.text();
        toast.error(errorText || "Không thể đánh giá đơn đăng ký");
      }
    } catch (error) {
      console.error("Error reviewing application:", error);
      toast.error("Không thể đánh giá đơn đăng ký");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadApplications();
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
    loadApplications();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadApplications();
  };

  useEffect(() => {
    loadApplications();
  }, [currentPage, statusFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const renderApplicationData = () => {
    if (!selectedApplication) return null;

    try {
      const applicationData = JSON.parse(selectedApplication.applicationData);
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Họ và tên</Label>
              <p className="text-sm">{applicationData.fullName}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Email</Label>
              <p className="text-sm">{applicationData.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Số điện thoại</Label>
              <p className="text-sm">{applicationData.phone}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Ngày sinh</Label>
              <p className="text-sm">{applicationData.birthDate}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">CCCD/CMND</Label>
              <p className="text-sm">{applicationData.idNumber}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Địa chỉ</Label>
              <p className="text-sm">{applicationData.address}</p>
            </div>
          </div>

          {/* Avatar and ID Card Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {applicationData.avatar && (
              <div>
                <FilePreview files={[applicationData.avatar]} title="Ảnh đại diện" />
              </div>
            )}
            {applicationData.idCard && (
              <div>
                <FilePreview files={[applicationData.idCard]} title="Ảnh CCCD/CMND" />
              </div>
            )}
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-600">Kinh nghiệm</Label>
            <p className="text-sm whitespace-pre-wrap">{applicationData.experience}</p>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-600">Ngôn ngữ</Label>
            <div className="flex flex-wrap gap-2">
              {applicationData.languages?.map((lang: string, index: number) => (
                <Badge key={index} variant="secondary">{lang}</Badge>
              ))}
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-600">Chuyên môn</Label>
            <div className="flex flex-wrap gap-2">
              {applicationData.specializations?.map((spec: string, index: number) => (
                <Badge key={index} variant="secondary">{spec}</Badge>
              ))}
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-600">Giới thiệu bản thân</Label>
            <p className="text-sm whitespace-pre-wrap">{applicationData.introduction}</p>
          </div>
        </div>
      );
    } catch (error) {
      return <p className="text-sm text-gray-500">Không thể hiển thị dữ liệu</p>;
    }
  };

  const renderDocuments = () => {
    if (!selectedApplication?.documents) return null;

    try {
      const documents = JSON.parse(selectedApplication.documents);
      if (!Array.isArray(documents) || documents.length === 0) return null;

      return (
        <FilePreview files={documents} title="Tài liệu đính kèm" />
      );
    } catch (error) {
      return null;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý đơn đăng ký hướng dẫn viên</h1>
            <p className="text-gray-600 mt-2">Quản lý và đánh giá các đơn đăng ký trở thành hướng dẫn viên</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Bộ lọc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Tìm kiếm</Label>
                <div className="flex gap-2">
                  <Input
                    id="search"
                    placeholder="Tìm theo tên hoặc email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch} variant="outline">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="w-full md:w-48">
                <Label htmlFor="status">Trạng thái</Label>
                <Select value={statusFilter} onValueChange={handleStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="pending_review">Chờ xem xét</SelectItem>
                    <SelectItem value="approved">Đã phê duyệt</SelectItem>
                    <SelectItem value="rejected">Bị từ chối</SelectItem>
                    <SelectItem value="allow_edit">Cho phép chỉnh sửa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách đơn đăng ký ({totalCount})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Người đăng ký</TableHead>
                        <TableHead>Liên hệ</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Ngày tạo</TableHead>
                        <TableHead>Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.map((application) => (
                        <TableRow key={application.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <div>
                                <p className="font-medium">{application.userFirstName} {application.userLastName}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Mail className="w-3 h-3 text-gray-500" />
                                <span className="text-sm">{application.userEmail}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-3 h-3 text-gray-500" />
                                <span className="text-sm">{application.userPhone}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusConfig[application.status as keyof typeof statusConfig]?.color || "bg-gray-100 text-gray-800"}>
                              {statusConfig[application.status as keyof typeof statusConfig]?.label || application.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">{formatDate(application.createdAt)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loadApplicationDetail(application.id)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Xem
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Trước
                      </Button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={page === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      ))}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Sau
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Review Dialog */}
        <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Đánh giá đơn đăng ký</DialogTitle>
              <DialogDescription>
                Xem xét và đánh giá đơn đăng ký hướng dẫn viên
              </DialogDescription>
            </DialogHeader>

            {selectedApplication && (
              <div className="space-y-6">
                {/* Application Data */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Thông tin đơn đăng ký
                  </h3>
                  {renderApplicationData()}
                </div>

                {/* Documents */}
                {renderDocuments()}

                {/* Review Form */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-4">Đánh giá</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="review-status">Quyết định</Label>
                      <Select value={reviewStatus} onValueChange={setReviewStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn quyết định" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approved">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              Phê duyệt
                            </div>
                          </SelectItem>
                          <SelectItem value="rejected">
                            <div className="flex items-center gap-2">
                              <XCircle className="w-4 h-4 text-red-600" />
                              Từ chối
                            </div>
                          </SelectItem>
                          <SelectItem value="allow_edit">
                            <div className="flex items-center gap-2">
                              <Edit className="w-4 h-4 text-blue-600" />
                              Cho phép chỉnh sửa
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="review-feedback">Phản hồi (tùy chọn)</Label>
                      <Textarea
                        id="review-feedback"
                        placeholder="Nhập phản hồi cho ứng viên..."
                        value={reviewFeedback}
                        onChange={(e) => setReviewFeedback(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
                        Hủy
                      </Button>
                      <Button onClick={handleReview} disabled={reviewLoading}>
                        {reviewLoading ? <Spinner size="sm" className="mr-2" /> : null}
                        Gửi đánh giá
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminTourGuideManagement;
