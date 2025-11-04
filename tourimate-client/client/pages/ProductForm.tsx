import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Package, DollarSign, Tag, Image, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { httpJson, getApiBase, httpUpload } from "@/src/lib/http";
import AdminLayout from "@/components/AdminLayout";
import CKEditor from "@/components/ui/CKEditor";
import { useAuth } from "@/src/hooks/useAuth";

interface Tour {
  id: string;
  title: string;
  status: string;
}

interface ProductCategoryOption { id: string; name: string; }

interface ProductFormData {
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  currency: string;
  images: string;
  tourId: string;
  category: string;
  brand: string;
  unit: string;
  weight: number;
  dimensions: string;
  specifications: string;
  features: string;
  usageInstructions: string;
  careInstructions: string;
  warranty: string;
  returnPolicy: string;
  shippingInfo: string;
  stockQuantity: number;
  minOrderQuantity: number;
  maxOrderQuantity: number;
  isDigital: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isOnSale: boolean;
  salePrice: number;
  saleStartDate: string;
  saleEndDate: string;
  tags: string;
  seoKeywords: string;
  seoDescription: string;
  notes: string;
  variantsJson?: string;
  status?: string; // Added for status display
}

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [tours, setTours] = useState<Tour[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategoryOption[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const unitOptions = [
    "cái", "hộp", "gói", "thùng", "kg", "g", "gram", "lít", "ml", "bịch", "chai", "lọ"
  ];
  const netUnitOptions = [
    "gram", "kg", "ml", "l", "gói", "cái", "hộp", "thùng", "chai", "lon", "túi", "bó", "set", "combo", "miếng", "hũ", "bình", "vỉ"
  ];
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    shortDescription: "",
    price: 0,
    currency: "VND",
    images: "",
    tourId: "",
    category: "",
    brand: "",
    unit: "",
    weight: 0,
    dimensions: "",
    specifications: "",
    features: "",
    usageInstructions: "",
    careInstructions: "",
    warranty: "",
    returnPolicy: "",
    shippingInfo: "",
    stockQuantity: 0,
    minOrderQuantity: 1,
    maxOrderQuantity: 100,
    isDigital: false,
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: false,
    isOnSale: false,
    salePrice: 0,
    saleStartDate: "",
    saleEndDate: "",
    tags: "",
    seoKeywords: "",
    seoDescription: "",
    notes: "",
    variantsJson: "",
    status: "draft" // Default status
  });

  type VariantRow = {
    unit: string;
    price: number;
    stockQuantity: number;
    netAmount?: number;
    netUnit?: string;
    priceInput?: string;
    isOnSale?: boolean;
    salePrice?: number;
    salePriceInput?: string;
    saleStartDate?: string | null;
    saleEndDate?: string | null;
  };
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const formatNumber = (v: number) => (Number(v || 0)).toLocaleString('vi-VN');

  useEffect(() => {
    loadTours();
    loadProductCategories();
    if (isEdit) {
      loadProduct();
    }
  }, [id]);

  const loadTours = async () => {
    try {
      // Ensure token attached; httpJson already handles auth typically. Fallback to public endpoint if needed.
      const response = await httpJson<any[]>(`${getApiBase()}/api/tour/my-tours`);
      const mapped = (response || []).map((t: any) => ({
        id: t.id ?? t.Id,
        title: t.title ?? t.Title,
        status: t.status ?? t.Status,
      }));
      setTours(mapped.filter((tour: any) => {
        const s = String(tour.status || '').toLowerCase();
        return s === 'approved' || s === 'active' || s === '2';
      }));
    } catch (error) {
      console.error("Error loading tours:", error);
      toast.error("Không thể tải danh sách tour");
    }
  };

  const loadProductCategories = async () => {
    try {
      const data = await httpJson<any[]>(`${getApiBase()}/api/product-categories`);
      const options = (data || []).map(c => ({ id: c.id ?? c.Id, name: c.name ?? c.Name }));
      setProductCategories(options);
    } catch (error) {
      // If API not available yet, leave empty; admin can add later
      console.warn("Product categories API not available", error);
      setProductCategories([]);
    }
  };

  const loadProduct = async () => {
    try {
      const response = await httpJson<any>(`${getApiBase()}/api/product/${id}`);
      let parsedUrls: string[] = [];
      try {
        if (response.images) parsedUrls = JSON.parse(response.images);
      } catch {}
      setImageUrls(parsedUrls);
      try {
        if (response.variantsJson) {
          const v = JSON.parse(response.variantsJson);
          if (Array.isArray(v)) setVariants(v.map((x: any) => ({
            unit: String(x.unit || ''),
            price: Number(x.price || 0),
            stockQuantity: Number(x.stockQuantity || 0),
            netAmount: x.netAmount !== undefined ? Number(x.netAmount) : undefined,
            netUnit: x.netUnit || undefined,
            isOnSale: x.isOnSale || false,
            salePrice: x.salePrice || 0,
            salePriceInput: x.salePriceInput || undefined,
            saleStartDate: x.saleStartDate || null,
            saleEndDate: x.saleEndDate || null
          })));
        }
      } catch {}
      setFormData({
        name: response.name || "",
        description: response.description || "",
        shortDescription: response.shortDescription || "",
        price: response.price || 0,
        currency: response.currency || "VND",
        images: response.images || (parsedUrls.length ? JSON.stringify(parsedUrls) : ""),
        tourId: response.tourId || "",
        category: response.category || "",
        brand: response.brand || "",
        unit: response.unit || "",
        weight: response.weight || 0,
        dimensions: response.dimensions || "",
        specifications: response.specifications || "",
        features: response.features || "",
        usageInstructions: response.usageInstructions || "",
        careInstructions: response.careInstructions || "",
        warranty: response.warranty || "",
        returnPolicy: response.returnPolicy || "",
        shippingInfo: response.shippingInfo || "",
        stockQuantity: response.stockQuantity || 0,
        minOrderQuantity: response.minOrderQuantity || 1,
        maxOrderQuantity: response.maxOrderQuantity || 100,
        isDigital: response.isDigital || false,
        isFeatured: response.isFeatured || false,
        isBestSeller: response.isBestSeller || false,
        isNewArrival: response.isNewArrival || false,
        isOnSale: response.isOnSale || false,
        salePrice: response.salePrice || 0,
        saleStartDate: response.saleStartDate || "",
        saleEndDate: response.saleEndDate || "",
        tags: response.tags || "",
        seoKeywords: response.seoKeywords || "",
        seoDescription: response.seoDescription || "",
        notes: response.notes || "",
        variantsJson: response.variantsJson || "",
        status: response.status || "draft" // status already in response
      });
    } catch (error) {
      console.error("Error loading product:", error);
      toast.error("Không thể tải thông tin sản phẩm");
    }
  };

  const onFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    if (files.length > 0) {
      // Upload immediately with the current files to avoid stale state issues
      uploadImages(files);
    }
    // Allow selecting the same file again later
    e.currentTarget.value = "";
  };

  const uploadImages = async (filesArg?: File[]) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Bạn cần đăng nhập");
      return;
    }
    const filesToUse = (filesArg && filesArg.length ? filesArg : selectedFiles) || [];
    if (filesToUse.length === 0) {
      toast.error("Vui lòng chọn ít nhất một ảnh");
      return;
    }
    const form = new FormData();
    filesToUse.forEach(f => form.append("files", f));
    try {
      setUploading(true);
      const data = await httpUpload<{ urls: string[] }>(`${getApiBase()}/api/media/uploads`, form);
      const urls: string[] = data.urls || [];
      const next = [...imageUrls, ...urls];
      setImageUrls(next);
      setFormData(prev => ({ ...prev, images: JSON.stringify(next) }));
      toast.success("Tải ảnh lên thành công");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Không thể tải ảnh");
    } finally {
      setUploading(false);
      setSelectedFiles([]);
    }
  };

  const save = async (action: 'draft' | 'send') => {
    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên sản phẩm");
      return;
    }
    if (!formData.tourId) {
      toast.error("Vui lòng chọn tour");
      return;
    }
    try {
      setLoading(true);
      if ((variants || []).length === 0 || variants.every(v => !v.price || v.price <= 0)) {
        toast.error("Vui lòng nhập giá hợp lệ cho ít nhất một biến thể");
        return;
      }
      const payloadToSend = { ...formData, variantsJson: JSON.stringify(variants || []) } as any;
      if (!payloadToSend.isOnSale) {
        payloadToSend.salePrice = null;
        payloadToSend.saleStartDate = null;
        payloadToSend.saleEndDate = null;
      } else {
        payloadToSend.saleStartDate = payloadToSend.saleStartDate ? payloadToSend.saleStartDate : null;
        payloadToSend.saleEndDate = payloadToSend.saleEndDate ? payloadToSend.saleEndDate : null;
      }
      if ((variants || []).length > 0) {
        delete payloadToSend.unit;
        const minPrice = variants.reduce((m, v) => Math.min(m, Number(v.price || 0)), Number.MAX_VALUE);
        const totalStock = variants.reduce((s, v) => s + (Number(v.stockQuantity || 0)), 0);
        if (isFinite(minPrice) && minPrice !== Number.MAX_VALUE) payloadToSend.price = minPrice;
        payloadToSend.stockQuantity = totalStock;
        payloadToSend.currency = "VND";
      }
      if (isEdit) {
        await httpJson(`${getApiBase()}/api/product/${id}`, { method: "PUT", body: JSON.stringify(payloadToSend) });
        if (action === 'send' && id) {
          await httpJson(`${getApiBase()}/api/product/${id}/request-approval`, { method: 'POST' });
        }
        toast.success(action === 'send' ? "Đã cập nhật và gửi duyệt" : "Cập nhật sản phẩm thành công");
      } else {
        const created: any = await httpJson(`${getApiBase()}/api/product`, { method: "POST", body: JSON.stringify(payloadToSend) });
        const newId = created?.id || created?.Id;
        if (action === 'send' && newId) {
          await httpJson(`${getApiBase()}/api/product/${newId}/request-approval`, { method: 'POST' });
        }
        toast.success(action === 'send' ? "Đã tạo và gửi duyệt" : "Tạo sản phẩm thành công");
      }
      navigate("/admin/products");
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(isEdit ? "Không thể lưu sản phẩm" : "Không thể tạo sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!user || user.role !== 'TourGuide') {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4">
            Chỉ Hướng dẫn viên mới có thể tạo/chỉnh sửa sản phẩm. Vui lòng đăng nhập bằng tài khoản Hướng dẫn viên.
          </div>
          <div className="mt-4">
            <Button variant="outline" onClick={() => navigate("/admin/products")}>Về danh sách sản phẩm</Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" onClick={() => navigate("/admin/products")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? "Chỉnh sửa sản phẩm" : "Tạo sản phẩm mới"}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEdit ? "Cập nhật thông tin sản phẩm" : "Tạo sản phẩm mới cho tour của bạn"}
          </p>
          {isEdit && (
            <div className="flex items-center gap-2 ml-4">
              <span className="text-sm text-gray-600">
                Trạng thái: <strong>{(() => {
                  const raw = String(formData.status || '').trim().toLowerCase();
                  if (!raw || raw === 'draft') return 'Nháp';
                  if (raw === 'pendingapproval') return 'Chờ duyệt';
                  if (raw === 'approved') return 'Đã duyệt';
                  if (raw === 'rejected') return 'Bị từ chối';
                  if (raw === 'discontinued') return 'Ngừng bán';
                  return formData.status;
                })()}</strong>
              </span>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  try {
                    await httpJson(`${getApiBase()}/api/product/${id}/request-approval`, { method: "POST" });
                    toast.success("Đã gửi yêu cầu duyệt");
                    // refresh status
                    await loadProduct();
                  } catch (e) {
                    console.error(e);
                    toast.error("Không thể gửi yêu cầu duyệt");
                  }
                }}
              >
                Gửi duyệt
              </Button>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Thông tin cơ bản
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Tên sản phẩm *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Nhập tên sản phẩm..."
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tourId">Tour *</Label>
                    <Select
                      key={formData.tourId}
                      value={formData.tourId || undefined}
                      onValueChange={(value) => handleInputChange("tourId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn tour..." />
                      </SelectTrigger>
                      <SelectContent>
                        {tours.map((tour) => (
                          <SelectItem key={tour.id} value={tour.id}>
                            {tour.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="shortDescription">Mô tả ngắn</Label>
                  <CKEditor
                    data={formData.shortDescription}
                    onChange={(val) => handleInputChange("shortDescription", val)}
                    placeholder="Mô tả ngắn về sản phẩm..."
                    baseApiUrl={getApiBase()}
                    authToken={localStorage.getItem('accessToken') || ''}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Mô tả chi tiết</Label>
                  <CKEditor
                    data={formData.description}
                    onChange={(val) => handleInputChange("description", val)}
                    placeholder="Mô tả chi tiết về sản phẩm..."
                    baseApiUrl={getApiBase()}
                    authToken={localStorage.getItem('accessToken') || ''}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Variants */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Biến thể & Giá
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Variants */}
                <div className="border rounded-md p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="font-semibold">Biến thể (đơn vị & giá)</Label>
                    <Button type="button" variant="outline" onClick={() => setVariants(prev => [...prev, { unit: "", price: 0, stockQuantity: 0, netAmount: undefined, netUnit: netUnitOptions[0], priceInput: "", isOnSale: false, salePrice: 0, salePriceInput: "", saleStartDate: null, saleEndDate: null }])}>Thêm biến thể</Button>
                  </div>
                  {variants.length === 0 ? (
                    <p className="text-sm text-gray-500">Chưa có biến thể. Thêm các lựa chọn như 250ml, 500ml, 1 lít với mức giá riêng.</p>
                  ) : (
                    <div className="space-y-2">
                      {variants.map((v, idx) => (
                        <>
                        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
                          <div className="md:col-span-2">
                            <Label>Khối lượng tịnh</Label>
                            <Input type="number" min="0" step="0.01" value={v.netAmount ?? ''}
                              onChange={(e) => setVariants(prev => prev.map((row, i) => i === idx ? { ...row, netAmount: e.target.value === '' ? undefined : parseFloat(e.target.value) } : row))} />
                          </div>
                          <div className="md:col-span-1">
                            <Label>Đơn vị</Label>
                            <Select value={v.netUnit || netUnitOptions[0]} onValueChange={(val) => setVariants(prev => prev.map((row, i) => i === idx ? { ...row, netUnit: val } : row))}>
                              <SelectTrigger>
                                <SelectValue placeholder="đơn vị" />
                              </SelectTrigger>
                              <SelectContent>
                                {netUnitOptions.map(u => (
                                  <SelectItem key={u} value={u}>{u}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="md:col-span-2">
                            <Label>Giá</Label>
                            <div className="relative">
                              <Input
                                type="text"
                                value={v.priceInput !== undefined ? v.priceInput : formatNumber(v.price)}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  if (raw === "") {
                                    setVariants(prev => prev.map((row, i) => i === idx ? { ...row, priceInput: "", price: 0 } : row));
                                    return;
                                  }
                                  const digits = raw.replace(/\D/g, '');
                                  setVariants(prev => prev.map((row, i) => i === idx ? { ...row, priceInput: raw, price: Number(digits || 0) } : row));
                                }}
                                onBlur={() => {
                                  setVariants(prev => prev.map((row, i) => i === idx ? { ...row, priceInput: undefined } : row));
                                }}
                                className="pr-8"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">₫</span>
                            </div>
                          </div>
                          <div className="md:col-span-1">
                            <Label>Tồn kho</Label>
                            <Input type="number" min="0" value={v.stockQuantity}
                              onChange={(e) => setVariants(prev => prev.map((row, i) => i === idx ? { ...row, stockQuantity: parseInt(e.target.value) || 0 } : row))} />
                          </div>
                          <div className="md:col-span-1">
                            <Button type="button" variant="ghost" onClick={() => setVariants(prev => prev.filter((_, i) => i !== idx))}>Xóa</Button>
                          </div>
                        </div>

                        {/* Per-variant sale config */}
                        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
                          <div className="md:col-span-1 flex items-center gap-2">
                            <Checkbox
                              id={`v-onsale-${idx}`}
                              checked={!!v.isOnSale}
                              onCheckedChange={(checked) => setVariants(prev => prev.map((row, i) => i === idx ? { ...row, isOnSale: !!checked } : row))}
                            />
                            <Label htmlFor={`v-onsale-${idx}`}>Đang giảm giá</Label>
                          </div>
                          <div className="md:col-span-2">
                            <Label>Giá sale</Label>
                            <div className="relative">
                              <Input
                                type="text"
                                disabled={!v.isOnSale}
                                value={v.salePriceInput !== undefined ? v.salePriceInput : formatNumber(v.salePrice || 0)}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  if (raw === "") {
                                    setVariants(prev => prev.map((row, i) => i === idx ? { ...row, salePriceInput: "", salePrice: 0 } : row));
                                    return;
                                  }
                                  const digits = raw.replace(/\D/g, '');
                                  setVariants(prev => prev.map((row, i) => i === idx ? { ...row, salePriceInput: raw, salePrice: Number(digits || 0) } : row));
                                }}
                                onBlur={() => setVariants(prev => prev.map((row, i) => i === idx ? { ...row, salePriceInput: undefined } : row))}
                                className="pr-8"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500">₫</span>
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <Label>Ngày bắt đầu</Label>
                            <Input
                              type="date"
                              placeholder="dd/mm/yyyy"
                              disabled={!v.isOnSale}
                              value={v.saleStartDate || ''}
                              onChange={(e) => setVariants(prev => prev.map((row, i) => i === idx ? { ...row, saleStartDate: e.target.value || null } : row))}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label>Ngày kết thúc</Label>
                            <Input
                              type="date"
                              placeholder="dd/mm/yyyy"
                              disabled={!v.isOnSale}
                              value={v.saleEndDate || ''}
                              onChange={(e) => setVariants(prev => prev.map((row, i) => i === idx ? { ...row, saleEndDate: e.target.value || null } : row))}
                            />
                          </div>
                        </div>
                        </>
                      ))}
                    </div>
                  )}
                </div>

                {formData.isOnSale && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="salePrice">Giá sale</Label>
                      <Input
                        id="salePrice"
                        type="number"
                        value={formData.salePrice}
                        onChange={(e) => handleInputChange("salePrice", parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="saleStartDate">Ngày bắt đầu</Label>
                      <Input
                        id="saleStartDate"
                        type="date"
                        value={formData.saleStartDate}
                        onChange={(e) => handleInputChange("saleStartDate", e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="saleEndDate">Ngày kết thúc</Label>
                      <Input
                        id="saleEndDate"
                        type="date"
                        value={formData.saleEndDate}
                        onChange={(e) => handleInputChange("saleEndDate", e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status & Features */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Trạng thái & Tính năng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isFeatured"
                      checked={formData.isFeatured}
                      onCheckedChange={(checked) => handleInputChange("isFeatured", checked)}
                    />
                    <Label htmlFor="isFeatured">Sản phẩm nổi bật</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isBestSeller"
                      checked={formData.isBestSeller}
                      onCheckedChange={(checked) => handleInputChange("isBestSeller", checked)}
                    />
                    <Label htmlFor="isBestSeller">Bán chạy</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isNewArrival"
                      checked={formData.isNewArrival}
                      onCheckedChange={(checked) => handleInputChange("isNewArrival", checked)}
                    />
                    <Label htmlFor="isNewArrival">Hàng mới</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isOnSale"
                      checked={formData.isOnSale}
                      onCheckedChange={(checked) => handleInputChange("isOnSale", checked)}
                    />
                    <Label htmlFor="isOnSale">Đang giảm giá</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category & Brand */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Phân loại
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="category">Danh mục</Label>
                  <Select
                    key={formData.category}
                    value={formData.category || undefined}
                    onValueChange={(value) => handleInputChange("category", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {productCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
 
                {/* Net Weight */}
                

                <div>
                  <Label htmlFor="brand">Thương hiệu</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => handleInputChange("brand", e.target.value)}
                    placeholder="Thương hiệu..."
                  />
                </div>
                
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  Hình ảnh
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Chọn ảnh để tải lên</Label>
                    <Input type="file" accept="image/*" multiple onChange={onFilesSelected} />
                    {uploading && <div className="text-sm text-gray-500 mt-2">Đang tải ảnh...</div>}
                  </div>
                  {imageUrls.length > 0 && (
                    <div>
                      <Label>Ảnh đã tải</Label>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {imageUrls.map((url, idx) => (
                          <div key={idx} className="relative group">
                            <img src={url} alt={`uploaded-${idx}`} className="w-full h-28 object-cover rounded" />
                            <button
                              type="button"
                              className="absolute top-1 right-1 bg-white/90 hover:bg-white text-red-600 border rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow"
                              onClick={() => {
                                const next = imageUrls.filter((_, i) => i !== idx);
                                setImageUrls(next);
                                setFormData(prev => ({ ...prev, images: JSON.stringify(next) }));
                              }}
                              aria-label="Xóa ảnh"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={loading} onClick={() => save('draft')}>
            {loading ? "Đang lưu..." : (isEdit ? "Lưu" : "Lưu nháp")}
          </Button>
          <Button type="button" disabled={loading} onClick={() => save('send')}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Đang gửi..." : (isEdit ? "Lưu và gửi duyệt" : "Gửi duyệt")}
          </Button>
        </div>
      </form>
    </div>
    </AdminLayout>
  );
}
