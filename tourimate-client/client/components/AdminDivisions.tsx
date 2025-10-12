import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, MapPin } from "lucide-react";
import { toast } from "sonner";

type Division = { code: number; name: string; type?: string; codename?: string; nameEn?: string; parentCode?: number | null };

const AdminDivisions: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [filter, setFilter] = useState("");

  const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "https://localhost:7181";

  const loadDivisions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/divisions`);
      const data = await res.json();
      setDivisions((data || []).map((d: any) => ({
        code: d.code ?? d.Code,
        name: d.name ?? d.Name,
        type: d.type ?? d.Type,
        codename: d.codeName ?? d.CodeName,
        nameEn: d.nameEn ?? d.NameEn,
        parentCode: d.parentCode ?? d.ParentCode ?? null,
      })));
    } catch (e) {
      console.error(e);
      toast.error("Không thể tải danh sách đơn vị hành chính");
    } finally {
      setLoading(false);
    }
  };

  const [syncing, setSyncing] = useState(false);
  const syncDivisions = async () => {
    try {
      setSyncing(true);
      const res = await fetch(`${API_BASE}/api/divisions/sync`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Đồng bộ dữ liệu thành công");
      await loadDivisions();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Đồng bộ thất bại");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => { loadDivisions(); }, []);

  const filtered = divisions.filter(d => (d.parentCode == null) && (d.name.toLowerCase().includes(filter.toLowerCase()) || String(d.code).includes(filter)));
  const groupWards = (provinceCode: number) => divisions.filter(d => d.parentCode === provinceCode).sort((a,b)=>a.name.localeCompare(b.name));

  return (
    <AdminLayout>
      <div className="max-w-9xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Đơn vị hành chính</h1>
            <p className="text-gray-600 mt-2">Quản lý danh sách tỉnh/thành phố để gắn với Tour</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={loadDivisions}>
              <RefreshCw className="h-4 w-4 mr-2" /> Làm mới
            </Button>
            <Button onClick={syncDivisions} disabled={syncing}>
              {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MapPin className="h-4 w-4 mr-2" />} Đồng bộ từ API
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách Tỉnh/Thành</CardTitle>
            <CardDescription>Chọn để dùng trong tạo/sửa Tour</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <Input placeholder="Tìm theo tên hoặc mã" className="max-w-sm" value={filter} onChange={(e) => setFilter(e.target.value)} />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Tên</TableHead>
                  <TableHead>Số phường/xã</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">Không có dữ liệu</TableCell>
                  </TableRow>
                ) : (
                  filtered.map(d => (
                    <>
                      <TableRow key={d.code}>
                        <TableCell className="align-top">{d.code}</TableCell>
                        <TableCell className="align-top font-medium">{d.name}</TableCell>
                        <TableCell className="align-top">{groupWards(d.code).length}</TableCell>
                      </TableRow>
                      {groupWards(d.code).map(w => (
                        <TableRow key={`${d.code}-${w.code}`}>
                          <TableCell className="pl-8 text-gray-500">{w.code}</TableCell>
                          <TableCell className="pl-8 text-gray-600">↳ {w.name}</TableCell>
                          <TableCell className="text-gray-400">Phường/Xã</TableCell>
                        </TableRow>
                      ))}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDivisions;


