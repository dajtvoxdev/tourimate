import React, { useEffect, useMemo, useState } from "react";
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { tourApi } from "../src/lib/tourApi";
import { TourDto, TourListDto } from "../src/lib/types/tour";
import { Loader2, Check, X, RotateCcw } from "lucide-react";
import { useAuth } from "@/src/hooks/useAuth";

interface Props {
  tour?: TourListDto | null;
  tourId?: string;
  onClose: () => void;
}

const formatPrice = (price: number, currency: string) => `${price.toLocaleString('vi-VN')} ${currency}`;

export const TourDetailDialog: React.FC<Props> = ({ tour, tourId, onClose }) => {
  const [detail, setDetail] = useState<TourDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [provinceName, setProvinceName] = useState<string | undefined>(undefined);
  const id = tourId || tour?.id;
  const baseApiUrl = ((import.meta as any).env?.VITE_API_BASE_URL || "https://localhost:7181");
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const d = await tourApi.getTour(id);
        if (isMounted) setDetail(d);
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [id]);

  const images: string[] = useMemo(() => {
    try {
      if (detail?.images) return JSON.parse(detail.images) as string[];
    } catch {}
    return [];
  }, [detail]);

  // Resolve province/ward names from codes for display
  useEffect(() => {
    const loadNames = async () => {
      try {
        const pCode = (detail as any)?.provinceCode as number | undefined;
        if (!pCode) return;
        // Load provinces only - departure point doesn't need wards
        try {
          const res = await fetch(`${baseApiUrl}/api/divisions/provinces`);
          if (res.ok) {
            const provinces = await res.json();
            const p = provinces.find((d: any) => (d.code ?? d.Code) === pCode);
            if (p) setProvinceName(p.name ?? p.Name);
          }
        } catch (error) {
          console.error("Error loading provinces:", error);
        }
      } catch {}
    };
    loadNames();
  }, [detail, baseApiUrl]);

  const categoryLabel = useMemo(() => {
    const map: Record<string, string> = {
      adventure: 'Phiêu lưu',
      cultural: 'Văn hóa',
      nature: 'Thiên nhiên',
      food: 'Ẩm thực',
      historical: 'Lịch sử',
      religious: 'Tôn giáo',
      beach: 'Biển',
      mountain: 'Núi',
    };
    const key = (detail?.category || '').toLowerCase();
    return map[key] || detail?.category || '-';
  }, [detail]);

  return (
    <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Chi tiết Tour</DialogTitle>
        <DialogDescription>Thông tin chi tiết về tour</DialogDescription>
      </DialogHeader>

      {loading && (
        <div className="flex items-center justify-center text-gray-500 py-10">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Đang tải chi tiết tour...
        </div>
      )}

      {!loading && detail && (
        <div className="space-y-6">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Tên Tour</Label>
              <p className="text-lg font-semibold">{detail.title}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Hướng dẫn viên</Label>
              <p className="text-lg">{detail.tourGuideName}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Địa điểm</Label>
              <p className="text-lg">{detail.location}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Danh mục</Label>
              <p className="text-lg">{categoryLabel}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Thời gian</Label>
              <p className="text-lg">{detail.duration} ngày</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Giá</Label>
              <p className="text-lg font-semibold text-green-600">{formatPrice(detail.price, detail.currency)}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Tỉnh/Thành phố</Label>
              <p className="text-lg">{provinceName || '-'}</p>
            </div>
          </div>

          {/* Images gallery */}
          {images.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-gray-500">Hình ảnh</Label>
              <div className="mt-2 flex flex-wrap gap-3">
                {images.map((url) => (
                  <img key={url} src={url} alt="tour" className="w-24 h-24 object-cover rounded-lg border" />
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Short description (HTML) */}
          <div>
            <Label className="text-sm font-medium text-gray-500">Mô tả ngắn</Label>
            <div className="prose prose-sm mt-1 max-w-none" dangerouslySetInnerHTML={{ __html: detail.shortDescription || "" }} />
          </div>

          {/* Full description (HTML) */}
          {detail.description && (
            <div>
              <Label className="text-sm font-medium text-gray-500">Mô tả chi tiết</Label>
              <div className="prose mt-1 max-w-none" dangerouslySetInnerHTML={{ __html: detail.description }} />
            </div>
          )}

          {/* Itinerary */}
          {detail.itinerary && (() => {
            try {
              const items = JSON.parse(detail.itinerary);
              if (Array.isArray(items) && items.length > 0) {
                return (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Lịch trình</Label>
                    <div className="mt-2 space-y-4">
                      {items.map((it: any, idx: number) => (
                        <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                          <p className="font-semibold mb-2">Ngày {it.day || idx + 1}: {it.title || ''}</p>
                          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: String(it.description || '') }} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
            } catch {}
            return null;
          })()}

          {/* Includes / Excludes */}
          <div className="grid grid-cols-2 gap-6">
            {detail.includes && (() => {
              try {
                const arr = JSON.parse(detail.includes);
                if (Array.isArray(arr) && arr.length > 0) {
                  return (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Bao gồm</Label>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        {arr.map((x: any, i: number) => <li key={i}>{String(x)}</li>)}
                      </ul>
                    </div>
                  );
                }
              } catch {}
              return null;
            })()}
            {detail.excludes && (() => {
              try {
                const arr = JSON.parse(detail.excludes);
                if (Array.isArray(arr) && arr.length > 0) {
                  return (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Không bao gồm</Label>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        {arr.map((x: any, i: number) => <li key={i}>{String(x)}</li>)}
                      </ul>
                    </div>
                  );
                }
              } catch {}
              return null;
            })()}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{detail.totalBookings}</p>
              <p className="text-sm text-gray-500">Đặt tour</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{detail.averageRating.toFixed(1)}</p>
              <p className="text-sm text-gray-500">Đánh giá</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{detail.viewCount}</p>
              <p className="text-sm text-gray-500">Lượt xem</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            {/* Left-side admin actions for status */}
            {isAdmin && detail && (() => {
              const s: any = detail.status;
              const v = typeof s === 'number' ? s : String(s || '').toLowerCase();
              const isPending = (typeof v === 'number' ? v === 1 : (v === 'pendingapproval' || v === 'pending_approval' || v === 'pending'));
              const isRejected = (typeof v === 'number' ? v === 3 : v === 'rejected');
              const isApproved = (typeof v === 'number' ? v === 2 : v === 'approved');
              if (!isPending && !isRejected && !isApproved) return null;
              const approve = async () => {
                try { await tourApi.updateTourStatus(detail.id, 'approved'); onClose(); } catch {}
              };
              const reject = async () => {
                try { await tourApi.updateTourStatus(detail.id, 'rejected'); onClose(); } catch {}
              };
              const unapprove = async () => {
                try { await tourApi.updateTourStatus(detail.id, 'pendingapproval'); onClose(); } catch {}
              };
              return (
                <div className="flex gap-2">
                  {isPending && (
                    <>
                      <Button variant="outline" size="sm" title="Duyệt" aria-label="Duyệt" onClick={approve}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" title="Từ chối" aria-label="Từ chối" onClick={reject}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {isRejected && (
                    <Button variant="outline" size="sm" title="Duyệt" aria-label="Duyệt" onClick={approve}>
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  {isApproved && (
                    <Button variant="outline" size="sm" title="Huỷ duyệt" aria-label="Huỷ duyệt" onClick={unapprove}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })()}

            <Button variant="outline" onClick={onClose}>Đóng</Button>
          </div>
        </div>
      )}
    </DialogContent>
  );
};

export default TourDetailDialog;


