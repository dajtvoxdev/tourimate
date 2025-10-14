import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { httpJson, getApiBase } from "@/src/lib/http";

interface TourCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateCategoryRequest {
  name: string;
  code: string;
  description?: string;
  icon?: string;
  sortOrder: number;
}

interface UpdateCategoryRequest {
  name?: string;
  code?: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}

const TourCategoriesManagement = () => {
  const [categories, setCategories] = useState<TourCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TourCategory | null>(null);
  const [formData, setFormData] = useState<CreateCategoryRequest>({
    name: "",
    code: "",
    description: "",
    icon: "",
    sortOrder: 0,
  });

  // Load categories
  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await httpJson<TourCategory[]>(`${getApiBase()}/api/tourcategories`);
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories:", error);
      toast.error("Không thể tải danh mục tour");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Create category
  const handleCreate = async () => {
    try {
      const response = await httpJson<TourCategory>(`${getApiBase()}/api/tourcategories`, {
        method: "POST",
        body: JSON.stringify(formData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      setCategories(prev => [...prev, response]);
      setIsCreateDialogOpen(false);
      setFormData({ name: "", code: "", description: "", icon: "", sortOrder: 0 });
      toast.success("Tạo danh mục thành công");
    } catch (error) {
      console.error("Failed to create category:", error);
      toast.error("Không thể tạo danh mục");
    }
  };

  // Update category
  const handleUpdate = async () => {
    if (!selectedCategory) return;

    try {
      const updateData: UpdateCategoryRequest = {
        name: formData.name,
        code: formData.code,
        description: formData.description,
        icon: formData.icon,
        sortOrder: formData.sortOrder,
      };

      const response = await httpJson<TourCategory>(`${getApiBase()}/api/tourcategories/${selectedCategory.id}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      setCategories(prev => prev.map(cat => cat.id === selectedCategory.id ? response : cat));
      setIsEditDialogOpen(false);
      setSelectedCategory(null);
      setFormData({ name: "", code: "", description: "", icon: "", sortOrder: 0 });
      toast.success("Cập nhật danh mục thành công");
    } catch (error) {
      console.error("Failed to update category:", error);
      toast.error("Không thể cập nhật danh mục");
    }
  };

  // Delete category
  const handleDelete = async (categoryId: string) => {
    try {
      await httpJson(`${getApiBase()}/api/tourcategories/${categoryId}`, {
        method: "DELETE",
      });

      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      toast.success("Xóa danh mục thành công");
    } catch (error) {
      console.error("Failed to delete category:", error);
      toast.error("Không thể xóa danh mục");
    }
  };

  // Toggle active status
  const handleToggleActive = async (category: TourCategory) => {
    try {
      const response = await httpJson<TourCategory>(`${getApiBase()}/api/tourcategories/${category.id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !category.isActive }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      setCategories(prev => prev.map(cat => cat.id === category.id ? response : cat));
      toast.success(`Đã ${category.isActive ? 'vô hiệu hóa' : 'kích hoạt'} danh mục`);
    } catch (error) {
      console.error("Failed to toggle category status:", error);
      toast.error("Không thể thay đổi trạng thái danh mục");
    }
  };

  // Open edit dialog
  const openEditDialog = (category: TourCategory) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      code: category.code,
      description: category.description || "",
      icon: category.icon || "",
      sortOrder: category.sortOrder,
    });
    setIsEditDialogOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({ name: "", code: "", description: "", icon: "", sortOrder: 0 });
    setSelectedCategory(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Danh mục Tour</h1>
          <p className="text-gray-600">Quản lý các danh mục tour trong hệ thống</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm danh mục
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Tạo danh mục mới</DialogTitle>
              <DialogDescription>
                Điền thông tin để tạo danh mục tour mới
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Tên danh mục *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ví dụ: Phiêu lưu"
                />
              </div>
              <div>
                <Label htmlFor="code">Mã danh mục *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toLowerCase() }))}
                  placeholder="Ví dụ: adventure"
                />
              </div>
              <div>
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả về danh mục tour"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="icon">Icon</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="Ví dụ: compass"
                />
              </div>
              <div>
                <Label htmlFor="sortOrder">Thứ tự sắp xếp</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleCreate}>
                  Tạo danh mục
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách danh mục</CardTitle>
          <CardDescription>
            Tổng cộng {categories.length} danh mục
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-2">Đang tải...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>Mã</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Thứ tự</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{category.code}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {category.description || "-"}
                    </TableCell>
                    <TableCell>{category.sortOrder}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={category.isActive}
                          onCheckedChange={() => handleToggleActive(category)}
                        />
                        <span className="text-sm">
                          {category.isActive ? "Hoạt động" : "Tạm dừng"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(category.createdAt).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn có chắc chắn muốn xóa danh mục "{category.name}"? 
                                Hành động này không thể hoàn tác.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(category.id)}
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
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa danh mục</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin danh mục tour
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Tên danh mục *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ví dụ: Phiêu lưu"
              />
            </div>
            <div>
              <Label htmlFor="edit-code">Mã danh mục *</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toLowerCase() }))}
                placeholder="Ví dụ: adventure"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Mô tả</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả về danh mục tour"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-icon">Icon</Label>
              <Input
                id="edit-icon"
                value={formData.icon}
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                placeholder="Ví dụ: compass"
              />
            </div>
            <div>
              <Label htmlFor="edit-sortOrder">Thứ tự sắp xếp</Label>
              <Input
                id="edit-sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleUpdate}>
                Cập nhật
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TourCategoriesManagement;
