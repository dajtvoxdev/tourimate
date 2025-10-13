import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminLayout from "./AdminLayout";
import { httpWithRefresh, getApiBase } from "@/src/lib/http";
import { Spinner } from "@/components/ui/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Eye, Pencil, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const AdminUsers: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<any[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("all");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const pageSize = 10;
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<any | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [updating, setUpdating] = React.useState<any | null>(null);
  const [form, setForm] = React.useState({ email: "", password: "", firstName: "", lastName: "", phoneNumber: "", role: "Customer", isActive: true });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(currentPage),
        pageSize: String(pageSize),
      });
      if (searchTerm) params.append("search", searchTerm);
      if (roleFilter !== "all") params.append("role", roleFilter);

      const res = await httpWithRefresh(`${getApiBase()}/api/auth/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => { setCurrentPage(1); loadUsers(); };
  const handleRoleFilter = (val: string) => { setRoleFilter(val); setCurrentPage(1); loadUsers(); };
  const handlePageChange = (p: number) => { setCurrentPage(p); loadUsers(); };

  React.useEffect(() => { loadUsers(); }, [currentPage, roleFilter]);

  const openDetail = async (id: string) => {
    const res = await httpWithRefresh(`${getApiBase()}/api/auth/users/${id}`);
    if (res.ok) { const data = await res.json(); setDetail(data); setDetailOpen(true); }
  };

  const toggleActive = async (u: any, next: boolean) => {
    if (u.role === 'Admin') { toast.error('Không thể thay đổi trạng thái quản trị'); return; }
    // optimistic update
    setItems(prev => prev.map(it => it.id === u.id ? { ...it, isActive: next } : it));
    try {
      const res = await httpWithRefresh(`${getApiBase()}/api/auth/users/${u.id}/active`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: next }) });
      if (res.ok) {
        toast.success('Cập nhật trạng thái thành công');
        if (detail?.id === u.id) setDetail({ ...detail, isActive: next });
      } else {
        // revert on failure
        setItems(prev => prev.map(it => it.id === u.id ? { ...it, isActive: !next } : it));
        toast.error(await res.text());
      }
    } catch (e: any) {
      setItems(prev => prev.map(it => it.id === u.id ? { ...it, isActive: !next } : it));
      toast.error(e?.message || 'Lỗi cập nhật');
    }
  };

  const createUser = async () => {
    try {
      const res = await httpWithRefresh(`${getApiBase()}/api/auth/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const t = await res.text();
        toast.error(t || 'Tạo người dùng thất bại');
        return;
      }
      toast.success('Tạo người dùng thành công');
      setCreating(false);
      setForm({ email: "", password: "", firstName: "", lastName: "", phoneNumber: "", role: "Customer", isActive: true });
      loadUsers();
    } catch (e: any) {
      toast.error(e?.message || 'Tạo người dùng thất bại');
    }
  };

  const saveUpdate = async () => {
    if (!updating) return;
    if (updating.role === 'Admin') { toast.error('Không thể chỉnh sửa tài khoản quản trị'); return; }
    try {
      const body: any = {
        firstName: updating.firstName,
        lastName: updating.lastName,
        phoneNumber: updating.phoneNumber,
        avatar: updating.avatar,
        role: updating.role
      };
      const res = await httpWithRefresh(`${getApiBase()}/api/auth/users/${updating.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const t = await res.text();
        toast.error(t || 'Cập nhật thất bại');
        return;
      }
      toast.success('Cập nhật người dùng thành công');
      setUpdating(null);
      loadUsers();
      if (detail?.id === updating.id) setDetail({ ...detail, ...body });
    } catch (e: any) {
      toast.error(e?.message || 'Cập nhật thất bại');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý người dùng</h1>
            <p className="text-gray-600 mt-2">Xem và tìm kiếm người dùng hệ thống</p>
          </div>
          <Button onClick={() => setCreating(true)}>
            <Plus className="w-4 h-4 mr-2" /> Thêm người dùng
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bộ lọc</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label>Tìm kiếm</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Tìm theo tên, email, sđt..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch} variant="outline">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="w-full md:w-56">
                <Label>Vai trò</Label>
                <Select value={roleFilter} onValueChange={handleRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="Customer">Khách hàng</SelectItem>
                    <SelectItem value="TourGuide">Hướng dẫn viên</SelectItem>
                    <SelectItem value="Admin">Quản trị</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách người dùng ({totalCount})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Spinner size="lg" /></div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Tên</TableHead>
                        <TableHead>Vai trò</TableHead>
                        <TableHead>Số điện thoại</TableHead>
                        <TableHead>Đăng nhập cuối</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>{`${u.firstName} ${u.lastName}`.trim()}</TableCell>
                          <TableCell>{u.role}</TableCell>
                          <TableCell>{u.phoneNumber || '-'}</TableCell>
                          <TableCell>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('vi-VN') : '-'}</TableCell>
                          <TableCell><Switch checked={!!u.isActive} onCheckedChange={(v)=>toggleActive(u, !!v)} disabled={u.role==='Admin'} /></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openDetail(u.id)} title="Xem">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setUpdating(u)} title="Sửa" disabled={u.role==='Admin'}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {items.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center text-gray-500">Không có dữ liệu</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Trước</Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <Button key={p} variant={p === currentPage ? 'default' : 'outline'} size="sm" onClick={() => handlePageChange(p)}>{p}</Button>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Sau</Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Chi tiết người dùng</DialogTitle></DialogHeader>
          {detail && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <div className="text-sm">{detail.email}</div>
              </div>
              <div>
                <Label>Tên</Label>
                <div className="text-sm">{detail.firstName} {detail.lastName}</div>
              </div>
              <div>
                <Label>Vai trò</Label>
                <div className="text-sm">{detail.role}</div>
              </div>
              <div>
                <Label>Kích hoạt</Label>
                <div className="mt-1">
                  <Switch checked={!!detail.isActive} onCheckedChange={(v)=>toggleActive(detail, !!v)} disabled={detail.role==='Admin'} />
                </div>
              </div>
              <div className="col-span-2">
                <Label>Địa chỉ</Label>
                <div className="text-sm">{detail.address || '-'}</div>
              </div>
              <div className="col-span-2">
                <Label>Giới thiệu</Label>
                <div className="text-sm prose" dangerouslySetInnerHTML={{ __html: detail.bio || '-' }} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create User */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Tạo người dùng</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input value={form.email} onChange={(e)=>setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Mật khẩu</Label><Input type="password" value={form.password} onChange={(e)=>setForm({ ...form, password: e.target.value })} /></div>
              <div><Label>Họ</Label><Input value={form.firstName} onChange={(e)=>setForm({ ...form, firstName: e.target.value })} /></div>
              <div><Label>Tên</Label><Input value={form.lastName} onChange={(e)=>setForm({ ...form, lastName: e.target.value })} /></div>
              <div className="col-span-2"><Label>Số điện thoại</Label><Input value={form.phoneNumber} onChange={(e)=>setForm({ ...form, phoneNumber: e.target.value })} /></div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Kích hoạt</Label>
              <Switch checked={form.isActive} onCheckedChange={(v)=>setForm({ ...form, isActive: !!v })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={()=>setCreating(false)}>Hủy</Button>
              <Button onClick={createUser}>Tạo</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update User */}
      <Dialog open={!!updating} onOpenChange={(o)=>!o && setUpdating(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Cập nhật người dùng</DialogTitle></DialogHeader>
          {updating && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Họ</Label><Input value={updating.firstName || ''} onChange={(e)=>setUpdating({ ...updating, firstName: e.target.value })} /></div>
                <div><Label>Tên</Label><Input value={updating.lastName || ''} onChange={(e)=>setUpdating({ ...updating, lastName: e.target.value })} /></div>
                <div className="col-span-2"><Label>Số điện thoại</Label><Input value={updating.phoneNumber || ''} onChange={(e)=>setUpdating({ ...updating, phoneNumber: e.target.value })} /></div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={()=>setUpdating(null)}>Hủy</Button>
                <Button onClick={saveUpdate}>Lưu</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminUsers;


