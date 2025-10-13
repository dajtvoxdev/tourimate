import React from "react";
import Header from "./Header";
import AdminLayout from "./AdminLayout";
import { httpWithRefresh, getApiBase } from "@/src/lib/http";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Eye, Pencil, Plus, Undo2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SearchableSelect } from "@/components/ui/select";
import { toast } from "sonner";

export default function AdminGuides() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const pageSize = 10;
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState<any | null>(null);
  const [candidateUsers, setCandidateUsers] = React.useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = React.useState<string>("");

  const loadGuides = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(currentPage), pageSize: String(pageSize) });
      if (searchTerm) params.append("search", searchTerm);
      const res = await httpWithRefresh(`${getApiBase()}/api/auth/guides?${params.toString()}`);
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

  const handleSearch = () => { setCurrentPage(1); loadGuides(); };
  const handlePageChange = (p: number) => { setCurrentPage(p); loadGuides(); };
  React.useEffect(() => { loadGuides(); }, [currentPage]);

  const loadCandidates = async (q = "") => {
    const params = new URLSearchParams({ page: "1", pageSize: "50", role: "Customer" });
    if (q) params.set("search", q);
    const res = await httpWithRefresh(`${getApiBase()}/api/auth/users?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setCandidateUsers(data.items || []);
    }
  };

  const promoteToGuide = async () => {
    if (!selectedUserId) { toast.error("Chọn người dùng"); return; }
    const body = { role: "TourGuide" } as any;
    const res = await httpWithRefresh(`${getApiBase()}/api/auth/users/${selectedUserId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) {
      toast.success("Đã tạo hướng dẫn viên");
      setCreateOpen(false);
      setSelectedUserId("");
      loadGuides();
    } else {
      toast.error(await res.text());
    }
  };

  const revokeGuide = async (id: string) => {
    const res = await httpWithRefresh(`${getApiBase()}/api/auth/guides/${id}/revoke`, { method: 'POST' });
    if (res.ok) { toast.success("Đã thu hồi quyền hướng dẫn viên"); loadGuides(); }
    else toast.error(await res.text());
  };

  const saveGuide = async () => {
    if (!editOpen) return;
    const body: any = { firstName: editOpen.firstName, lastName: editOpen.lastName, phoneNumber: editOpen.phoneNumber };
    const res = await httpWithRefresh(`${getApiBase()}/api/auth/users/${editOpen.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) { toast.success("Cập nhật thành công"); setEditOpen(null); loadGuides(); }
    else toast.error(await res.text());
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý hướng dẫn viên</h1>
            <p className="text-gray-600 mt-2">Danh sách hướng dẫn viên đã được phê duyệt</p>
          </div>
          <Button onClick={() => { setCreateOpen(true); loadCandidates(); }}>
            <Plus className="w-4 h-4 mr-2" /> Thêm hướng dẫn viên
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle>Bộ lọc</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label>Tìm kiếm</Label>
                <div className="flex gap-2">
                  <Input placeholder="Tìm theo tên, email, sđt..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} />
                  <Button onClick={handleSearch} variant="outline"><Search className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Danh sách hướng dẫn viên ({totalCount})</CardTitle></CardHeader>
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
                        <TableHead>Số điện thoại</TableHead>
                        <TableHead>Ngày tham gia</TableHead>
                        <TableHead>Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>{`${u.firstName} ${u.lastName}`.trim()}</TableCell>
                          <TableCell>{u.phoneNumber || '-'}</TableCell>
                          <TableCell>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '-'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" title="Sửa" onClick={() => setEditOpen(u)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Thu hồi" onClick={() => revokeGuide(u.id)}>
                                <Undo2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {items.length === 0 && (
                        <TableRow><TableCell colSpan={4} className="text-center text-gray-500">Không có dữ liệu</TableCell></TableRow>
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
      {/* Create guide from existing user */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Thêm hướng dẫn viên</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Chọn người dùng</Label>
            <SearchableSelect
              value={selectedUserId}
              onValueChange={(v) => setSelectedUserId(v)}
              placeholder="Chọn người dùng"
              searchPlaceholder="Tìm người dùng..."
              options={candidateUsers.map((u) => ({ value: u.id, label: `${u.email} - ${u.firstName} ${u.lastName}` }))}
              className="w-full"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Hủy</Button>
              <Button onClick={promoteToGuide}>Thêm</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit guide basic info */}
      <Dialog open={!!editOpen} onOpenChange={(o)=>!o && setEditOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Chỉnh sửa hướng dẫn viên</DialogTitle></DialogHeader>
          {editOpen && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Họ</Label><Input value={editOpen.firstName || ''} onChange={(e)=>setEditOpen({ ...editOpen, firstName: e.target.value })} /></div>
                <div><Label>Tên</Label><Input value={editOpen.lastName || ''} onChange={(e)=>setEditOpen({ ...editOpen, lastName: e.target.value })} /></div>
                <div className="col-span-2"><Label>Số điện thoại</Label><Input value={editOpen.phoneNumber || ''} onChange={(e)=>setEditOpen({ ...editOpen, phoneNumber: e.target.value })} /></div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={()=>setEditOpen(null)}>Hủy</Button>
                <Button onClick={saveGuide}>Lưu</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}


