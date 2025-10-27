import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Package, DollarSign, Tag, Image, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { httpJson, getApiBase } from "@/src/lib/http";

interface Tour {
  id: string;
  title: string;
  status: string;
}

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
}

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [tours, setTours] = useState<Tour[]>([]);
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
    notes: ""
  });

  useEffect(() => {
    loadTours();
    if (isEdit) {
      loadProduct();
    }
  }, [id]);

  const loadTours = async () => {
    try {
      const response = await httpJson<any[]>(`${getApiBase()}/api/tour/my-tours`);
      setTours(response.filter(tour => tour.status === "Approved" || tour.status === "Active"));
    } catch (error) {
      console.error("Error loading tours:", error);
      toast.error("Không thể tải danh sách tour");
    }
  };

  const loadProduct = async () => {
    try {
      const response = await httpJson<any>(`${getApiBase()}/api/product/${id}`);
      setFormData({
        name: response.name || "",
        description: response.description || "",
        shortDescription: response.shortDescription || "",
        price: response.price || 0,
        currency: response.currency || "VND",
        images: response.images || "",
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
        notes: response.notes || ""
      });
    } catch (error) {
      console.error("Error loading product:", error);
      toast.error("Không thể tải thông tin sản phẩm");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên sản phẩm");
      return;
    }
    
    if (!formData.tourId) {
      toast.error("Vui lòng chọn tour");
      return;
    }
    
    if (formData.price <= 0) {
      toast.error("Vui lòng nhập giá hợp lệ");
      return;
    }

    try {
      setLoading(true);
      
      if (isEdit) {
        await httpJson(`${getApiBase()}/api/product/${id}`, {
          method: "PUT",
          body: JSON.stringify(formData)
        });
        toast.success("Cập nhật sản phẩm thành công");
      } else {
        await httpJson(`${getApiBase()}/api/product`, {
          method: "POST",
          body: JSON.stringify(formData)
        });
        toast.success("Tạo sản phẩm thành công");
      }
      
      navigate("/admin/products");
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(isEdit ? "Không thể cập nhật sản phẩm" : "Không thể tạo sản phẩm");
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" onClick={() => navigate("/admin/products")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? "Chỉnh sửa sản phẩm" : "Tạo sản phẩm mới"}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEdit ? "Cập nhật thông tin sản phẩm" : "Tạo sản phẩm mới cho tour của bạn"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
                      value={formData.tourId}
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
                  <Textarea
                    id="shortDescription"
                    value={formData.shortDescription}
                    onChange={(e) => handleInputChange("shortDescription", e.target.value)}
                    placeholder="Mô tả ngắn về sản phẩm..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Mô tả chi tiết</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Mô tả chi tiết về sản phẩm..."
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Giá cả
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="price">Giá *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="currency">Tiền tệ</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => handleInputChange("currency", value)}
                    >
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
                    <Label htmlFor="stockQuantity">Tồn kho</Label>
                    <Input
                      id="stockQuantity"
                      type="number"
                      value={formData.stockQuantity}
                      onChange={(e) => handleInputChange("stockQuantity", parseInt(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isOnSale"
                    checked={formData.isOnSale}
                    onCheckedChange={(checked) => handleInputChange("isOnSale", checked)}
                  />
                  <Label htmlFor="isOnSale">Đang giảm giá</Label>
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
                      id="isDigital"
                      checked={formData.isDigital}
                      onCheckedChange={(checked) => handleInputChange("isDigital", checked)}
                    />
                    <Label htmlFor="isDigital">Sản phẩm số</Label>
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
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange("category", e.target.value)}
                    placeholder="Danh mục sản phẩm..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="brand">Thương hiệu</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => handleInputChange("brand", e.target.value)}
                    placeholder="Thương hiệu..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="unit">Đơn vị</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => handleInputChange("unit", e.target.value)}
                    placeholder="Cái, kg, lít..."
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
                <div>
                  <Label htmlFor="images">URL hình ảnh</Label>
                  <Textarea
                    id="images"
                    value={formData.images}
                    onChange={(e) => handleInputChange("images", e.target.value)}
                    placeholder="Nhập URL hình ảnh (mỗi URL một dòng)..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Đang lưu..." : (isEdit ? "Cập nhật" : "Tạo sản phẩm")}
          </Button>
        </div>
      </form>
    </div>
  );
}
