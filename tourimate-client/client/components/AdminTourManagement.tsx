import React, { useState, useEffect } from "react";
import { useAuth } from "@/src/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import TourDetailDialog from "./TourDetailDialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminLayout from "./AdminLayout";
import CreateTourForm from "./CreateTourForm";
import { tourApi } from "../src/lib/tourApi";
import { TourListDto, TourSearchRequest, CreateTourRequest, UpdateTourRequest, TourDto } from "../src/lib/types/tour";
import { httpWithRefresh, httpUpload, getApiBase, httpJson } from "@/src/lib/http";
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Loader2,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Check,
  X,
  RotateCcw,
  Clock
} from "lucide-react";
import { toast } from "sonner";

const AdminTourManagement = () => {
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const isTourGuide = user?.role === 'TourGuide';
  const isAdmin = user?.role === 'Admin';
  const [categories, setCategories] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [tours, setTours] = useState<TourListDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchParams, setSearchParams] = useState<TourSearchRequest>({
    page: 1,
    pageSize: 10,
    sortBy: "createdat",
    sortDirection: "desc"
  });
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState<TourListDto | null>(null);
  const [editDetail, setEditDetail] = useState<TourDto | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState<CreateTourRequest>({
    title: "",
    description: "",
    shortDescription: "",
    location: "",
    duration: 1,
    maxParticipants: 10,
    price: 0,
    currency: "VND",
    category: "",
    images: "",
    itinerary: "",
    includes: "",
    excludes: "",
    terms: "",
    isFeatured: false
  });

  // Image upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    loadTours();
  }, [searchParams]);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await httpJson<any[]>(`${getApiBase()}/api/tourcategories`, { skipAuth: true });
        setCategories(data);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };
    
    loadCategories();
  }, []);

  const loadTours = async () => {
    try {
      setLoading(true);
      // If TourGuide is in limited mode (mine=1 in URL), ensure only own tours are fetched
      const params = { ...searchParams } as any;
      const response = await tourApi.getTours(params);
      setTours(response.tours);
      setTotalCount(response.totalCount);
      setCurrentPage(response.page);
    } catch (error) {
      console.error("Error loading tours:", error);
      toast.error("Không thể tải danh sách tour");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchParams(prev => ({
      ...prev,
      searchTerm: value,
      page: 1
    }));
  };

  const handleFilterChange = (key: keyof TourSearchRequest, value: any) => {
    setSearchParams(prev => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
      page: 1
    }));
  };

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({
      ...prev,
      page
    }));
  };

  const handleCreateTour = async () => {
    try {
      const payload: any = { ...formData };
      const mine = new URLSearchParams(window.location.search).get('mine');
      if (mine === '1') {
        // TourGuide cannot mark featured directly
        payload.isFeatured = false;
      }
      if (imageUrls.length > 0) {
        payload.imageUrls = imageUrls;
      }
      // Do not send legacy JSON images when imageUrls present
      if (payload.imageUrls) delete payload.images;
      await tourApi.createTour(payload);
      toast.success("Tạo tour thành công");
      setIsCreateDialogOpen(false);
      resetForm();
      loadTours();
    } catch (error) {
      console.error("Error creating tour:", error);
      toast.error("Không thể tạo tour");
    }
  };

  const handleUpdateTour = async () => {
    if (!selectedTour) return;
    
    try {
      const updateData: any = {
        title: formData.title,
        description: formData.description,
        shortDescription: formData.shortDescription,
        location: formData.location,
        duration: formData.duration,
        maxParticipants: formData.maxParticipants,
        price: formData.price,
        currency: formData.currency,
        category: formData.category,
        isFeatured: (() => {
          const mine = new URLSearchParams(window.location.search).get('mine');
          return mine === '1' ? false : formData.isFeatured;
        })()
      };
      if (imageUrls.length > 0) {
        updateData.imageUrls = imageUrls;
      }
      
      await tourApi.updateTour(selectedTour.id, updateData);
      
      // Show different message for tour guide vs admin
      if (isTourGuide) {
        toast.success("Tour đã được cập nhật và gửi lại cho admin xác nhận", {
          description: "Tour của bạn sẽ được admin kiểm tra và phê duyệt trước khi hiển thị công khai.",
          duration: 5000
        });
      } else {
        toast.success("Cập nhật tour thành công");
      }
      
      setIsEditDialogOpen(false);
      resetForm();
      loadTours();
    } catch (error) {
      console.error("Error updating tour:", error);
      toast.error("Không thể cập nhật tour");
    }
  };

  const handleDeleteTour = async (tourId: string) => {
    try {
      await tourApi.deleteTour(tourId);
      toast.success("Xóa tour thành công");
      loadTours();
    } catch (error) {
      console.error("Error deleting tour:", error);
      toast.error("Không thể xóa tour");
    }
  };

  const handleUpdateStatus = async (tourId: string, status: string) => {
    try {
      await tourApi.updateTourStatus(tourId, status);
      toast.success("Cập nhật trạng thái thành công");
      loadTours();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      shortDescription: "",
      location: "",
      duration: 1,
      maxParticipants: 10,
      price: 0,
      currency: "VND",
      category: "",
      images: "",
      itinerary: "",
      includes: "",
      excludes: "",
      terms: "",
      isFeatured: false
    });
    setSelectedTour(null);
    setSelectedFiles([]);
    setImageUrls([]);
    setUploading(false);
  };

  const openEditDialog = async (tour: TourListDto) => {
    setSelectedTour(tour);
    setIsEditDialogOpen(true);
    setEditLoading(true);
    try {
      const detail = await tourApi.getTour(tour.id);
      setEditDetail(detail);
    } catch (e) {
      console.error("Failed to load tour detail", e);
      toast.error("Không thể tải chi tiết tour");
      setEditDetail(null);
    } finally {
      setEditLoading(false);
    }
  };
  const onFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const uploadImages = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Bạn cần đăng nhập");
      return;
    }
    if (selectedFiles.length === 0) {
      toast.error("Vui lòng chọn ít nhất một ảnh");
      return;
    }
    const form = new FormData();
    selectedFiles.forEach(f => form.append("files", f));
    try {
      setUploading(true);
      const data = await httpUpload<{ urls: string[] }>(`${getApiBase()}/api/media/uploads`, form);
      const urls: string[] = data.urls || [];
      setImageUrls(urls);
      toast.success("Tải ảnh lên thành công");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Không thể tải ảnh");
    } finally {
      setUploading(false);
    }
  };

  const openViewDialog = (tour: TourListDto) => {
    setSelectedTour(tour);
    setIsViewDialogOpen(true);
  };

  const getStatusBadge = (status: any) => {
    const map = (s: any): 'approved' | 'pendingapproval' | 'rejected' | 'other' => {
      if (typeof s === 'number') {
        // Backend enum: PendingApproval=1, Approved=2, Rejected=3
        if (s === 2) return 'approved';
        if (s === 1) return 'pendingapproval';
        if (s === 3) return 'rejected';
        return 'other';
      }
      if (typeof s === 'string') {
        const v = s.toLowerCase();
        if (v === 'approved') return 'approved';
        if (v === 'pendingapproval' || v === 'pending_approval' || v === 'pending') return 'pendingapproval';
        if (v === 'rejected') return 'rejected';
        return 'other';
      }
      return 'other';
    };
    const key = map(status);
    switch (key) {
      case 'approved':
        return <Badge variant="default">Đã duyệt</Badge>;
      case 'pendingapproval':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          {isTourGuide ? "Chờ admin xác nhận" : "Chờ duyệt"}
        </Badge>;
      case 'rejected':
        return <Badge variant="destructive">Từ chối</Badge>;
      default:
        return <Badge variant="secondary">Khác</Badge>;
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <AdminLayout>
      <div className="max-w-9xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Tour</h1>
          <p className="text-gray-600 mt-2">Quản lý tất cả tour trên nền tảng</p>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Bộ lọc và Tìm kiếm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Tìm kiếm</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Tìm kiếm tour..."
                    className="pl-10"
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="category">Danh mục</Label>
                <Select value={searchParams.category || "all"} onValueChange={(value) => handleFilterChange('category', value === "all" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.code}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="status">Trạng thái</Label>
                <Select onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="approved">Đã duyệt</SelectItem>
                    <SelectItem value="pendingapproval">Chờ duyệt</SelectItem>
                    <SelectItem value="rejected">Từ chối</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                {isTourGuide && (
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Tạo Tour
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="max-w-[1200px] w-[95vw] h-[90vh] flex flex-col">
                    <DialogHeader>
                      <DialogTitle>Tạo Tour Mới</DialogTitle>
                      <DialogDescription>
                        Điền thông tin để tạo tour mới
                      </DialogDescription>
                    </DialogHeader>
                    <CreateTourForm
                      submitLabel="Tạo Tour"
                      onCancel={() => setIsCreateDialogOpen(false)}
                      onUploadImages={async (files) => {
                        const token = localStorage.getItem("accessToken");
                        const form = new FormData();
                        files.forEach(f => form.append("files", f));
                        const data = await httpUpload<{ urls: string[] }>(`${getApiBase()}/api/media/uploads`, form);
                        return (data.urls || []) as string[];
                      }}
                      onSubmit={async (payload) => {
                        try {
                          const request: any = { ...payload };
                          if (request.imageUrls?.length) delete request.images;
                          await tourApi.createTour(request);
                          toast.success("Tạo tour thành công");
                          setIsCreateDialogOpen(false);
                          resetForm();
                          loadTours();
                        } catch (e) {
                          console.error(e);
                          toast.error("Không thể tạo tour");
                        }
                      }}
                    />
                  </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tours Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách Tour ({totalCount})</CardTitle>
            <CardDescription>
              Quản lý và theo dõi tất cả tour trên nền tảng
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên Tour</TableHead>
                  <TableHead>Hướng dẫn viên</TableHead>
                  <TableHead>Địa điểm</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Đặt tour & Lịch trình</TableHead>
                  <TableHead>Đánh giá & Số lượng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      <p className="mt-2 text-gray-500">Đang tải dữ liệu...</p>
                    </TableCell>
                  </TableRow>
                ) : tours.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Không có tour nào
                    </TableCell>
                  </TableRow>
                ) : (
                  tours.map((tour) => (
                    <TableRow key={tour.id}>
                      <TableCell className="font-medium">{tour.title}</TableCell>
                      <TableCell>{tour.tourGuideName}</TableCell>
                      <TableCell>
                        {tour.provinceName || tour.wardName || tour.location}
                        {tour.provinceName && tour.wardName && (
                          <span className="text-gray-500 text-sm ml-1">
                            ({tour.wardName})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {tour.recentAdultPrice ? (
                          <div>
                            <div className="font-medium">
                              {tour.recentAdultPrice.toLocaleString('vi-VN')} {tour.currency}
                            </div>
                            <div className="text-xs text-gray-500">
                              Từ {tour.price.toLocaleString('vi-VN')} {tour.currency}
                            </div>
                          </div>
                        ) : (
                          <span>{tour.price.toLocaleString('vi-VN')} {tour.currency}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{tour.totalBookings} đặt tour</div>
                          {tour.recentDate && (
                            <div className="text-xs text-gray-500">
                              Khởi hành: {new Date(tour.recentDate).toLocaleDateString('vi-VN')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="text-yellow-500 mr-1">★</span>
                          <span className="font-medium">{tour.averageRating.toFixed(1)}</span>
                          <span className="text-gray-500 text-sm ml-1">
                            ({tour.totalReviews} đánh giá)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {getStatusBadge(tour.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => openViewDialog(tour)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {isTourGuide && (
                            <Button size="sm" variant="outline" onClick={() => openEditDialog(tour)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              navigate(`/admin/tours/${tour.id}/availability`);
                            }}
                            title="Lịch trình"
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                          {isTourGuide && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xóa tour?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Hành động này không thể hoàn tác. Tour sẽ bị xóa vĩnh viễn.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteTour(tour.id)}>Xóa</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                            </AlertDialog>
                          )}
                          {isAdmin && (
                            <>
                              {(() => {
                                const key = ((): 'approved' | 'pendingapproval' | 'rejected' | 'other' => {
                                  const s: any = tour.status;
                                  if (typeof s === 'number') {
                                    if (s === 2) return 'approved';
                                    if (s === 1) return 'pendingapproval';
                                    if (s === 3) return 'rejected';
                                    return 'other';
                                  }
                                  const v = String(s || '').toLowerCase();
                                  if (v === 'approved') return 'approved';
                                  if (v === 'pendingapproval' || v === 'pending_approval' || v === 'pending') return 'pendingapproval';
                                  if (v === 'rejected') return 'rejected';
                                  return 'other';
                                })();
                                if (key === 'pendingapproval') {
                                  return (
                                    <>
                                      <Button size="sm" variant="outline" title="Duyệt" aria-label="Duyệt" onClick={() => handleUpdateStatus(tour.id, 'approved')}>
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button size="sm" variant="outline" title="Từ chối" aria-label="Từ chối" onClick={() => handleUpdateStatus(tour.id, 'rejected')}>
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </>
                                  );
                                }
                                if (key === 'rejected') {
                                  return (
                                    <Button size="sm" variant="outline" title="Duyệt" aria-label="Duyệt" onClick={() => handleUpdateStatus(tour.id, 'approved')}>
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  );
                                }
                                if (key === 'approved') {
                                  return (
                                    <Button size="sm" variant="outline" title="Huỷ duyệt" aria-label="Huỷ duyệt" onClick={() => handleUpdateStatus(tour.id, 'pendingapproval')}>
                                      <RotateCcw className="h-4 w-4" />
                                    </Button>
                                  );
                                }
                                return null;
                              })()}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Hiển thị {((currentPage - 1) * pageSize) + 1} đến {Math.min(currentPage * pageSize, totalCount)} trong tổng số {totalCount} tour
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Trước
                  </Button>
                  <span className="px-3 py-1 text-sm">
                    Trang {currentPage} / {totalPages}
                  </span>
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
          </CardContent>
        </Card>

        {/* Edit Tour Dialog */}
        {isTourGuide && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-[1200px] w-[95vw] h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa Tour</DialogTitle>
              <DialogDescription>
                Cập nhật thông tin tour
              </DialogDescription>
            </DialogHeader>
            {editLoading && (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Đang tải chi tiết tour...
                  </div>
            )}
            {!editLoading && selectedTour && (
              <CreateTourForm
                submitLabel="Cập nhật Tour"
                initial={{
                  title: editDetail?.title ?? selectedTour.title,
                  shortDescription: editDetail?.shortDescription ?? selectedTour.shortDescription,
                  description: editDetail?.description ?? "",
                  location: editDetail?.location ?? selectedTour.location,
                  duration: editDetail?.duration ?? selectedTour.duration,
                  maxParticipants: editDetail?.maxParticipants ?? 10,
                  price: editDetail?.price ?? selectedTour.price,
                  currency: editDetail?.currency ?? selectedTour.currency,
                  category: editDetail?.category ?? selectedTour.category,
                  imageUrls: (() => { try { return editDetail?.images ? JSON.parse(editDetail.images) : undefined; } catch { return undefined; } })(),
                  itinerary: editDetail?.itinerary ?? "",
                  includes: editDetail?.includes ?? "",
                  excludes: editDetail?.excludes ?? "",
                  terms: editDetail?.terms ?? "",
                  isFeatured: editDetail?.isFeatured ?? selectedTour.isFeatured,
                  provinceCode: (editDetail as any)?.provinceCode ?? (selectedTour as any)?.provinceCode,
                  wardCode: (editDetail as any)?.wardCode ?? (selectedTour as any)?.wardCode,
                }}
                onCancel={() => setIsEditDialogOpen(false)}
                onUploadImages={async (files) => {
                  const token = localStorage.getItem("accessToken");
                  const form = new FormData();
                  files.forEach(f => form.append("files", f));
                  const res = await fetch(((import.meta as any).env?.VITE_API_BASE_URL || "https://localhost:7181") + "/api/media/uploads", {
                    method: "POST",
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                    body: form,
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data || res.statusText);
                  return (data.urls || []) as string[];
                }}
                onSubmit={async (payload) => {
                  if (!selectedTour) return;
                  try {
                    const updateData: any = { ...payload };
                    delete updateData.images;
                    await tourApi.updateTour(selectedTour.id, updateData);
                    
                    // Show different message for tour guide vs admin
                    if (isTourGuide) {
                      toast.success("Tour đã được cập nhật và gửi lại cho admin xác nhận", {
                        description: "Tour của bạn sẽ được admin kiểm tra và phê duyệt trước khi hiển thị công khai.",
                        duration: 5000
                      });
                    } else {
                      toast.success("Cập nhật tour thành công");
                    }
                    
                    setIsEditDialogOpen(false);
                    setEditDetail(null);
                    loadTours();
                  } catch (e) {
                    console.error(e);
                    toast.error("Không thể cập nhật tour");
                  }
                }}
              />
            )}
          </DialogContent>
          </Dialog>
        )}

        {/* View Tour Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          {selectedTour && (
            <TourDetailDialog tour={selectedTour} onClose={() => setIsViewDialogOpen(false)} />
          )}
        </Dialog>

      </div>
    </AdminLayout>
  );
};

export default AdminTourManagement;
