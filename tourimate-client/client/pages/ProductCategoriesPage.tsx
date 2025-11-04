import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getApiBase, httpJson } from "@/src/lib/http";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProductCategoryDto {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProductCategoriesPage() {
  const [categories, setCategories] = useState<ProductCategoryDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductCategoryDto | null>(null);
  const [form, setForm] = useState({ name: "", description: "", icon: "", parentId: "", sortOrder: 0 });

  const load = async () => {
    try {
      setLoading(true);
      const data = await httpJson<ProductCategoryDto[]>(`${getApiBase()}/api/product-categories`);
      setCategories(data);
    } catch (e) {
      console.error(e);
      toast.error("Không thể tải danh mục sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    try {
      if (!form.name.trim()) {
        toast.error("Vui lòng nhập tên danh mục");
        return;
      }
      if (editing) {
        await httpJson(`${getApiBase()}/api/product-categories/${editing.id}`, { method: "PUT", body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          icon: form.icon || null,
          parentId: form.parentId || null,
          sortOrder: Number(form.sortOrder) || 0,
          isActive: true
        }) });
        toast.success("Cập nhật danh mục thành công");
      } else {
        await httpJson(`${getApiBase()}/api/product-categories`, { method: "POST", body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          icon: form.icon || null,
          parentId: form.parentId || null,
          sortOrder: Number(form.sortOrder) || 0
        }) });
        toast.success("Tạo danh mục thành công");
      }
      setOpen(false);
      setEditing(null);
      setForm({ name: "", description: "", icon: "", parentId: "", sortOrder: 0 });
      load();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Lỗi lưu danh mục");
    }
  };

  const onEdit = (c: ProductCategoryDto) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description || "", icon: c.icon || "", parentId: c.parentId || "", sortOrder: c.sortOrder || 0 });
    setOpen(true);
  };

  const onDelete = async (c: ProductCategoryDto) => {
    try {
      await httpJson(`${getApiBase()}/api/product-categories/${c.id}`, { method: "DELETE" });
      toast.success("Đã xóa danh mục");
      load();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Không thể xóa danh mục");
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Danh mục sản phẩm</h1>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setForm({ name: "", description: "", icon: "", parentId: "", sortOrder: 0 }); } }}>
            <DialogTrigger asChild>
              <Button>Tạo danh mục</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Chỉnh sửa danh mục" : "Tạo danh mục"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Tên</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label>Mô tả</Label>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div>
                  <Label>Icon (tùy chọn)</Label>
                  <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Danh mục cha</Label>
                    <Select
                      value={form.parentId ? form.parentId : "none"}
                      onValueChange={(value) => setForm({ ...form, parentId: value === "none" ? "" : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Không có" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Không có</SelectItem>
                        {categories
                          .filter(c => !editing || c.id !== editing.id)
                          .map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Thứ tự</Label>
                    <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={save}>{editing ? "Cập nhật" : "Lưu"}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách ({categories.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Thứ tự</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5}>Đang tải...</TableCell></TableRow>
                ) : categories.length === 0 ? (
                  <TableRow><TableCell colSpan={5}>Chưa có danh mục</TableCell></TableRow>
                ) : (
                  categories.map(c => (
                    <TableRow key={c.id}>
                      <TableCell>{c.name}</TableCell>
                      <TableCell className="max-w-[400px] truncate">{c.description}</TableCell>
                      <TableCell>{c.sortOrder}</TableCell>
                      <TableCell>{c.isActive ? "Hoạt động" : "Ẩn"}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => onEdit(c)}>Sửa</Button>
                        <Button variant="outline" size="sm" onClick={() => onDelete(c)}>Xóa</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
