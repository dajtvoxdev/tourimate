import React, { useState, useEffect } from "react";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Settings,
  DollarSign,
  Percent,
  Calendar,
  AlertCircle
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

interface PricingConfig {
  id: string;
  configKey: string;
  configName: string;
  description: string;
  value: number;
  unit: string;
  category: string;
  isActive: boolean;
  effectiveDate?: string;
  expiryDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdByName?: string;
  updatedByName?: string;
}

interface PricingConfigsResponse {
  configs: PricingConfig[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export default function AdminPricingConfig() {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<PricingConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<PricingConfig | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    configKey: "",
    configName: "",
    description: "",
    value: 0,
    unit: "VND",
    category: "",
    isActive: true,
    effectiveDate: "",
    expiryDate: "",
    notes: ""
  });

  const categories = ["TourPush", "TourCommission", "ProductCommission"];
  const units = ["VND", "USD", "EUR", "%"];

  useEffect(() => {
    fetchConfigs();
  }, [currentPage, categoryFilter, statusFilter, searchTerm]);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: "20"
      });
      
      if (categoryFilter !== "all") {
        params.append("category", categoryFilter);
      }
      
      if (statusFilter !== "all") {
        params.append("isActive", statusFilter === "active" ? "true" : "false");
      }
      
      if (searchTerm.trim()) {
        params.append("searchTerm", searchTerm.trim());
      }

      const response = await httpJson<PricingConfigsResponse>(
        `${getApiBase()}/api/pricingconfig?${params.toString()}`
      );
      
      setConfigs(response.configs);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.totalCount);
    } catch (error) {
      console.error("Error fetching pricing configs:", error);
      toast.error("Không thể tải danh sách cấu hình giá");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConfig = async () => {
    try {
      setActionLoading("create");
      
      const payload = {
        ...formData,
        value: Number(formData.value),
        effectiveDate: formData.effectiveDate ? new Date(formData.effectiveDate).toISOString() : null,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : null,
        notes: formData.notes || null
      };

      await httpJson(`${getApiBase()}/api/pricingconfig`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      
      toast.success("Tạo cấu hình giá thành công");
      setIsCreateDialogOpen(false);
      resetForm();
      fetchConfigs();
    } catch (error: any) {
      console.error("Error creating pricing config:", error);
      toast.error(error.message || "Không thể tạo cấu hình giá");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateConfig = async () => {
    if (!selectedConfig) return;

    try {
      setActionLoading("update");
      
      const payload = {
        configName: formData.configName,
        description: formData.description,
        value: Number(formData.value),
        unit: formData.unit,
        isActive: formData.isActive,
        effectiveDate: formData.effectiveDate ? new Date(formData.effectiveDate).toISOString() : null,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : null,
        notes: formData.notes || null
      };

      await httpJson(`${getApiBase()}/api/pricingconfig/${selectedConfig.id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      
      toast.success("Cập nhật cấu hình giá thành công");
      setIsEditDialogOpen(false);
      setSelectedConfig(null);
      resetForm();
      fetchConfigs();
    } catch (error: any) {
      console.error("Error updating pricing config:", error);
      toast.error(error.message || "Không thể cập nhật cấu hình giá");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteConfig = async (configId: string) => {
    try {
      setActionLoading(configId);
      await httpJson(`${getApiBase()}/api/pricingconfig/${configId}`, {
        method: "DELETE"
      });
      
      toast.success("Xóa cấu hình giá thành công");
      fetchConfigs();
    } catch (error: any) {
      console.error("Error deleting pricing config:", error);
      toast.error(error.message || "Không thể xóa cấu hình giá");
    } finally {
      setActionLoading(null);
    }
  };

  const resetForm = () => {
    setFormData({
      configKey: "",
      configName: "",
      description: "",
      value: 0,
      unit: "VND",
      category: "",
      isActive: true,
      effectiveDate: "",
      expiryDate: "",
      notes: ""
    });
  };

  const openEditDialog = (config: PricingConfig) => {
    setSelectedConfig(config);
    setFormData({
      configKey: config.configKey,
      configName: config.configName,
      description: config.description,
      value: config.value,
      unit: config.unit,
      category: config.category,
      isActive: config.isActive,
      effectiveDate: config.effectiveDate ? new Date(config.effectiveDate).toISOString().split('T')[0] : "",
      expiryDate: config.expiryDate ? new Date(config.expiryDate).toISOString().split('T')[0] : "",
      notes: config.notes || ""
    });
    setIsEditDialogOpen(true);
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "TourPush":
        return <Badge className="bg-blue-100 text-blue-800">Push Tour</Badge>;
      case "TourCommission":
        return <Badge className="bg-green-100 text-green-800">Hoa hồng Tour</Badge>;
      case "ProductCommission":
        return <Badge className="bg-purple-100 text-purple-800">Hoa hồng Sản phẩm</Badge>;
      default:
        return <Badge variant="outline">{category}</Badge>;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? <Badge className="bg-green-100 text-green-800">Hoạt động</Badge>
      : <Badge className="bg-red-100 text-red-800">Tạm dừng</Badge>;
  };

  const formatCurrency = (value: number, unit: string) => {
    if (unit === "%") {
      return `${value}%`;
    }
    
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: unit === 'VND' ? 'VND' : unit === 'USD' ? 'USD' : 'EUR'
    }).format(value);
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
            <h1 className="text-2xl font-bold text-gray-900">Cấu hình giá</h1>
            <p className="text-gray-600">Quản lý đơn giá push tour và phần trăm hoa hồng</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Tổng cộng: {totalCount} cấu hình
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo cấu hình
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Tạo cấu hình giá mới</DialogTitle>
                  <DialogDescription>
                    Thêm cấu hình giá cho push tour hoặc phần trăm hoa hồng
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="configKey">Mã cấu hình *</Label>
                      <Input
                        id="configKey"
                        value={formData.configKey}
                        onChange={(e) => setFormData({...formData, configKey: e.target.value})}
                        placeholder="VD: TOUR_PUSH_BASIC"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Danh mục *</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn danh mục" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>
                              {category === "TourPush" ? "Push Tour" : 
                               category === "TourCommission" ? "Hoa hồng Tour" : 
                               "Hoa hồng Sản phẩm"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="configName">Tên cấu hình *</Label>
                    <Input
                      id="configName"
                      value={formData.configName}
                      onChange={(e) => setFormData({...formData, configName: e.target.value})}
                      placeholder="VD: Gói Push Tour Cơ Bản"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Mô tả *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Mô tả chi tiết về cấu hình này"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="value">Giá trị *</Label>
                      <Input
                        id="value"
                        type="number"
                        value={formData.value}
                        onChange={(e) => setFormData({...formData, value: Number(e.target.value)})}
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label htmlFor="unit">Đơn vị *</Label>
                      <Select value={formData.unit} onValueChange={(value) => setFormData({...formData, unit: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn đơn vị" />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map(unit => (
                            <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="effectiveDate">Ngày hiệu lực</Label>
                      <Input
                        id="effectiveDate"
                        type="date"
                        value={formData.effectiveDate}
                        onChange={(e) => setFormData({...formData, effectiveDate: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="expiryDate">Ngày hết hạn</Label>
                      <Input
                        id="expiryDate"
                        type="date"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Ghi chú</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Ghi chú thêm về cấu hình"
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                    />
                    <Label htmlFor="isActive">Kích hoạt cấu hình</Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button 
                    onClick={handleCreateConfig}
                    disabled={actionLoading === "create"}
                  >
                    {actionLoading === "create" ? "Đang tạo..." : "Tạo cấu hình"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                    placeholder="Tìm kiếm theo tên, mã cấu hình..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="TourPush">Push Tour</SelectItem>
                    <SelectItem value="TourCommission">Hoa hồng Tour</SelectItem>
                    <SelectItem value="ProductCommission">Hoa hồng Sản phẩm</SelectItem>
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
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Tạm dừng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách cấu hình giá</CardTitle>
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
            ) : configs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên cấu hình</TableHead>
                    <TableHead>Danh mục</TableHead>
                    <TableHead>Giá trị</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{config.configName}</div>
                          <div className="text-sm text-gray-500">{config.configKey}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getCategoryBadge(config.category)}</TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(config.value, config.unit)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(config.isActive)}</TableCell>
                      <TableCell>{formatDate(config.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(config)}
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
                                <AlertDialogTitle>Xóa cấu hình?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Hành động này không thể hoàn tác. Cấu hình sẽ bị xóa vĩnh viễn.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteConfig(config.id)}
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
                <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Không có cấu hình nào
                </h3>
                <p className="text-gray-600">
                  {searchTerm || categoryFilter !== "all" || statusFilter !== "all"
                    ? "Không tìm thấy cấu hình phù hợp với bộ lọc"
                    : "Chưa có cấu hình giá nào trong hệ thống"
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
              <DialogTitle>Chỉnh sửa cấu hình giá</DialogTitle>
              <DialogDescription>
                Cập nhật thông tin cấu hình giá
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-configName">Tên cấu hình *</Label>
                <Input
                  id="edit-configName"
                  value={formData.configName}
                  onChange={(e) => setFormData({...formData, configName: e.target.value})}
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
                  <Label htmlFor="edit-value">Giá trị *</Label>
                  <Input
                    id="edit-value"
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({...formData, value: Number(e.target.value)})}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-unit">Đơn vị *</Label>
                  <Select value={formData.unit} onValueChange={(value) => setFormData({...formData, unit: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn đơn vị" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map(unit => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-effectiveDate">Ngày hiệu lực</Label>
                  <Input
                    id="edit-effectiveDate"
                    type="date"
                    value={formData.effectiveDate}
                    onChange={(e) => setFormData({...formData, effectiveDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-expiryDate">Ngày hết hạn</Label>
                  <Input
                    id="edit-expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                  />
                </div>
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
                  id="edit-isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                />
                <Label htmlFor="edit-isActive">Kích hoạt cấu hình</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Hủy
              </Button>
              <Button 
                onClick={handleUpdateConfig}
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

