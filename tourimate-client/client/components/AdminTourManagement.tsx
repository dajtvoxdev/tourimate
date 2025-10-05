import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminLayout from "./AdminLayout";
import { tourApi } from "../src/lib/tourApi";
import { TourListDto, TourSearchRequest, CreateTourRequest, UpdateTourRequest } from "../src/lib/types/tour";
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
  Users
} from "lucide-react";
import { toast } from "sonner";

const AdminTourManagement = () => {
  const [loading, setLoading] = useState(true);
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
    difficulty: "Easy",
    images: "",
    itinerary: "",
    includes: "",
    excludes: "",
    terms: "",
    isFeatured: false
  });

  useEffect(() => {
    loadTours();
  }, [searchParams]);

  const loadTours = async () => {
    try {
      setLoading(true);
      const response = await tourApi.getTours(searchParams);
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
      await tourApi.createTour(formData);
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
      const updateData: UpdateTourRequest = {
        title: formData.title,
        description: formData.description,
        shortDescription: formData.shortDescription,
        location: formData.location,
        duration: formData.duration,
        maxParticipants: formData.maxParticipants,
        price: formData.price,
        currency: formData.currency,
        category: formData.category,
        difficulty: formData.difficulty,
        isFeatured: formData.isFeatured
      };
      
      await tourApi.updateTour(selectedTour.id, updateData);
      toast.success("Cập nhật tour thành công");
      setIsEditDialogOpen(false);
      resetForm();
      loadTours();
    } catch (error) {
      console.error("Error updating tour:", error);
      toast.error("Không thể cập nhật tour");
    }
  };

  const handleDeleteTour = async (tourId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tour này?")) return;
    
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
      difficulty: "Easy",
      images: "",
      itinerary: "",
      includes: "",
      excludes: "",
      terms: "",
      isFeatured: false
    });
    setSelectedTour(null);
  };

  const openEditDialog = (tour: TourListDto) => {
    setSelectedTour(tour);
    setFormData({
      title: tour.title,
      description: "",
      shortDescription: tour.shortDescription,
      location: tour.location,
      duration: tour.duration,
      maxParticipants: 10,
      price: tour.price,
      currency: tour.currency,
      category: tour.category,
      difficulty: tour.difficulty,
      images: tour.images || "",
      itinerary: "",
      includes: "",
      excludes: "",
      terms: "",
      isFeatured: tour.isFeatured
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (tour: TourListDto) => {
    setSelectedTour(tour);
    setIsViewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <Badge variant="default">Đã duyệt</Badge>;
      case 'pendingapproval':
        return <Badge variant="secondary">Chờ duyệt</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Từ chối</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
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
                <Select onValueChange={(value) => handleFilterChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="adventure">Phiêu lưu</SelectItem>
                    <SelectItem value="cultural">Văn hóa</SelectItem>
                    <SelectItem value="nature">Thiên nhiên</SelectItem>
                    <SelectItem value="food">Ẩm thực</SelectItem>
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
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Tạo Tour
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Tạo Tour Mới</DialogTitle>
                      <DialogDescription>
                        Điền thông tin để tạo tour mới
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Tabs defaultValue="basic" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
                        <TabsTrigger value="details">Chi tiết</TabsTrigger>
                        <TabsTrigger value="content">Nội dung</TabsTrigger>
                        <TabsTrigger value="settings">Cài đặt</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="basic" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <Label htmlFor="title">Tên Tour *</Label>
                            <Input
                              id="title"
                              value={formData.title}
                              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="Nhập tên tour"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label htmlFor="shortDescription">Mô tả ngắn *</Label>
                            <Textarea
                              id="shortDescription"
                              value={formData.shortDescription}
                              onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                              placeholder="Mô tả ngắn gọn về tour"
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label htmlFor="location">Địa điểm *</Label>
                            <Input
                              id="location"
                              value={formData.location}
                              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                              placeholder="Ví dụ: Hà Nội, Việt Nam"
                            />
                          </div>
                          <div>
                            <Label htmlFor="category">Danh mục *</Label>
                            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn danh mục" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="adventure">Phiêu lưu</SelectItem>
                                <SelectItem value="cultural">Văn hóa</SelectItem>
                                <SelectItem value="nature">Thiên nhiên</SelectItem>
                                <SelectItem value="food">Ẩm thực</SelectItem>
                                <SelectItem value="historical">Lịch sử</SelectItem>
                                <SelectItem value="religious">Tôn giáo</SelectItem>
                                <SelectItem value="beach">Biển</SelectItem>
                                <SelectItem value="mountain">Núi</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="duration">Thời gian (ngày) *</Label>
                            <Input
                              id="duration"
                              type="number"
                              min="1"
                              value={formData.duration}
                              onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 1 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="maxParticipants">Số người tối đa *</Label>
                            <Input
                              id="maxParticipants"
                              type="number"
                              min="1"
                              value={formData.maxParticipants}
                              onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) || 1 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="price">Giá *</Label>
                            <Input
                              id="price"
                              type="number"
                              min="0"
                              step="1000"
                              value={formData.price}
                              onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="currency">Tiền tệ</Label>
                            <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="VND">VND</SelectItem>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="difficulty">Độ khó *</Label>
                            <Select value={formData.difficulty} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Easy">Dễ</SelectItem>
                                <SelectItem value="Moderate">Trung bình</SelectItem>
                                <SelectItem value="Challenging">Khó</SelectItem>
                                <SelectItem value="Expert">Chuyên gia</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="details" className="space-y-4">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="images">Hình ảnh (JSON)</Label>
                            <Textarea
                              id="images"
                              value={formData.images}
                              onChange={(e) => setFormData(prev => ({ ...prev, images: e.target.value }))}
                              placeholder='["url1.jpg", "url2.jpg"]'
                              rows={3}
                            />
                            <p className="text-sm text-gray-500 mt-1">Nhập danh sách URL hình ảnh dưới dạng JSON array</p>
                          </div>
                          <div>
                            <Label htmlFor="itinerary">Lịch trình (JSON)</Label>
                            <Textarea
                              id="itinerary"
                              value={formData.itinerary}
                              onChange={(e) => setFormData(prev => ({ ...prev, itinerary: e.target.value }))}
                              placeholder='[{"day": 1, "title": "Ngày 1", "description": "..."}]'
                              rows={5}
                            />
                            <p className="text-sm text-gray-500 mt-1">Nhập lịch trình chi tiết dưới dạng JSON array</p>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="content" className="space-y-4">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="description">Mô tả chi tiết *</Label>
                            <Textarea
                              id="description"
                              value={formData.description}
                              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Mô tả chi tiết về tour"
                              rows={6}
                            />
                          </div>
                          <div>
                            <Label htmlFor="includes">Bao gồm (JSON)</Label>
                            <Textarea
                              id="includes"
                              value={formData.includes}
                              onChange={(e) => setFormData(prev => ({ ...prev, includes: e.target.value }))}
                              placeholder='["Vé tham quan", "Ăn trưa", "Hướng dẫn viên"]'
                              rows={4}
                            />
                            <p className="text-sm text-gray-500 mt-1">Nhập danh sách dịch vụ bao gồm dưới dạng JSON array</p>
                          </div>
                          <div>
                            <Label htmlFor="excludes">Không bao gồm (JSON)</Label>
                            <Textarea
                              id="excludes"
                              value={formData.excludes}
                              onChange={(e) => setFormData(prev => ({ ...prev, excludes: e.target.value }))}
                              placeholder='["Vé máy bay", "Khách sạn", "Chi phí cá nhân"]'
                              rows={4}
                            />
                            <p className="text-sm text-gray-500 mt-1">Nhập danh sách dịch vụ không bao gồm dưới dạng JSON array</p>
                          </div>
                          <div>
                            <Label htmlFor="terms">Điều khoản</Label>
                            <Textarea
                              id="terms"
                              value={formData.terms}
                              onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                              placeholder="Điều khoản và điều kiện của tour"
                              rows={4}
                            />
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="settings" className="space-y-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label htmlFor="isFeatured">Tour nổi bật</Label>
                              <p className="text-sm text-gray-500">Hiển thị tour này ở vị trí nổi bật</p>
                            </div>
                            <Switch
                              id="isFeatured"
                              checked={formData.isFeatured}
                              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked }))}
                            />
                          </div>
                          <Separator />
                          <div className="text-sm text-gray-500">
                            <p><strong>Lưu ý:</strong></p>
                            <ul className="list-disc list-inside space-y-1 mt-2">
                              <li>Các trường có dấu * là bắt buộc</li>
                              <li>Tour sẽ được tạo với trạng thái "Chờ duyệt"</li>
                              <li>Hướng dẫn viên sẽ được gán tự động dựa trên tài khoản đăng nhập</li>
                            </ul>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                    
                    <div className="flex justify-end space-x-2 mt-6">
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Hủy
                      </Button>
                      <Button onClick={handleCreateTour}>
                        Tạo Tour
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
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
                  <TableHead>Đặt tour</TableHead>
                  <TableHead>Đánh giá</TableHead>
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
                      <TableCell>{tour.location}</TableCell>
                      <TableCell>{tour.price.toLocaleString('vi-VN')} {tour.currency}</TableCell>
                      <TableCell>{tour.totalBookings}</TableCell>
                      <TableCell className="flex items-center">
                        <span className="text-yellow-500 mr-1">★</span>
                        {tour.averageRating.toFixed(1)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(tour.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => openViewDialog(tour)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(tour)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleDeleteTour(tour.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa Tour</DialogTitle>
              <DialogDescription>
                Cập nhật thông tin tour
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
                <TabsTrigger value="details">Chi tiết</TabsTrigger>
                <TabsTrigger value="content">Nội dung</TabsTrigger>
                <TabsTrigger value="settings">Cài đặt</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="edit-title">Tên Tour *</Label>
                    <Input
                      id="edit-title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Nhập tên tour"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="edit-shortDescription">Mô tả ngắn *</Label>
                    <Textarea
                      id="edit-shortDescription"
                      value={formData.shortDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                      placeholder="Mô tả ngắn gọn về tour"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-location">Địa điểm *</Label>
                    <Input
                      id="edit-location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Ví dụ: Hà Nội, Việt Nam"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-category">Danh mục *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="adventure">Phiêu lưu</SelectItem>
                        <SelectItem value="cultural">Văn hóa</SelectItem>
                        <SelectItem value="nature">Thiên nhiên</SelectItem>
                        <SelectItem value="food">Ẩm thực</SelectItem>
                        <SelectItem value="historical">Lịch sử</SelectItem>
                        <SelectItem value="religious">Tôn giáo</SelectItem>
                        <SelectItem value="beach">Biển</SelectItem>
                        <SelectItem value="mountain">Núi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-duration">Thời gian (ngày) *</Label>
                    <Input
                      id="edit-duration"
                      type="number"
                      min="1"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-maxParticipants">Số người tối đa *</Label>
                    <Input
                      id="edit-maxParticipants"
                      type="number"
                      min="1"
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-price">Giá *</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-currency">Tiền tệ</Label>
                    <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VND">VND</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-difficulty">Độ khó *</Label>
                    <Select value={formData.difficulty} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Easy">Dễ</SelectItem>
                        <SelectItem value="Moderate">Trung bình</SelectItem>
                        <SelectItem value="Challenging">Khó</SelectItem>
                        <SelectItem value="Expert">Chuyên gia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="details" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-images">Hình ảnh (JSON)</Label>
                    <Textarea
                      id="edit-images"
                      value={formData.images}
                      onChange={(e) => setFormData(prev => ({ ...prev, images: e.target.value }))}
                      placeholder='["url1.jpg", "url2.jpg"]'
                      rows={3}
                    />
                    <p className="text-sm text-gray-500 mt-1">Nhập danh sách URL hình ảnh dưới dạng JSON array</p>
                  </div>
                  <div>
                    <Label htmlFor="edit-itinerary">Lịch trình (JSON)</Label>
                    <Textarea
                      id="edit-itinerary"
                      value={formData.itinerary}
                      onChange={(e) => setFormData(prev => ({ ...prev, itinerary: e.target.value }))}
                      placeholder='[{"day": 1, "title": "Ngày 1", "description": "..."}]'
                      rows={5}
                    />
                    <p className="text-sm text-gray-500 mt-1">Nhập lịch trình chi tiết dưới dạng JSON array</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="content" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-description">Mô tả chi tiết *</Label>
                    <Textarea
                      id="edit-description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Mô tả chi tiết về tour"
                      rows={6}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-includes">Bao gồm (JSON)</Label>
                    <Textarea
                      id="edit-includes"
                      value={formData.includes}
                      onChange={(e) => setFormData(prev => ({ ...prev, includes: e.target.value }))}
                      placeholder='["Vé tham quan", "Ăn trưa", "Hướng dẫn viên"]'
                      rows={4}
                    />
                    <p className="text-sm text-gray-500 mt-1">Nhập danh sách dịch vụ bao gồm dưới dạng JSON array</p>
                  </div>
                  <div>
                    <Label htmlFor="edit-excludes">Không bao gồm (JSON)</Label>
                    <Textarea
                      id="edit-excludes"
                      value={formData.excludes}
                      onChange={(e) => setFormData(prev => ({ ...prev, excludes: e.target.value }))}
                      placeholder='["Vé máy bay", "Khách sạn", "Chi phí cá nhân"]'
                      rows={4}
                    />
                    <p className="text-sm text-gray-500 mt-1">Nhập danh sách dịch vụ không bao gồm dưới dạng JSON array</p>
                  </div>
                  <div>
                    <Label htmlFor="edit-terms">Điều khoản</Label>
                    <Textarea
                      id="edit-terms"
                      value={formData.terms}
                      onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                      placeholder="Điều khoản và điều kiện của tour"
                      rows={4}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="edit-isFeatured">Tour nổi bật</Label>
                      <p className="text-sm text-gray-500">Hiển thị tour này ở vị trí nổi bật</p>
                    </div>
                    <Switch
                      id="edit-isFeatured"
                      checked={formData.isFeatured}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked }))}
                    />
                  </div>
                  <Separator />
                  <div className="text-sm text-gray-500">
                    <p><strong>Lưu ý:</strong></p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>Các trường có dấu * là bắt buộc</li>
                      <li>Thay đổi sẽ được lưu ngay lập tức</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleUpdateTour}>
                Cập nhật Tour
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Tour Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chi tiết Tour</DialogTitle>
              <DialogDescription>
                Thông tin chi tiết về tour
              </DialogDescription>
            </DialogHeader>
            
            {selectedTour && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Tên Tour</Label>
                    <p className="text-lg font-semibold">{selectedTour.title}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Hướng dẫn viên</Label>
                    <p className="text-lg">{selectedTour.tourGuideName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Địa điểm</Label>
                    <p className="text-lg">{selectedTour.location}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Danh mục</Label>
                    <p className="text-lg">{selectedTour.category}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Thời gian</Label>
                    <p className="text-lg">{selectedTour.duration} ngày</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Độ khó</Label>
                    <p className="text-lg">{selectedTour.difficulty}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Giá</Label>
                    <p className="text-lg font-semibold text-green-600">
                      {selectedTour.price.toLocaleString('vi-VN')} {selectedTour.currency}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Trạng thái</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedTour.status)}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <Label className="text-sm font-medium text-gray-500">Mô tả ngắn</Label>
                  <p className="text-lg mt-1">{selectedTour.shortDescription}</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{selectedTour.totalBookings}</p>
                    <p className="text-sm text-gray-500">Đặt tour</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">{selectedTour.averageRating.toFixed(1)}</p>
                    <p className="text-sm text-gray-500">Đánh giá</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{selectedTour.viewCount}</p>
                    <p className="text-sm text-gray-500">Lượt xem</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Đóng
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminTourManagement;
