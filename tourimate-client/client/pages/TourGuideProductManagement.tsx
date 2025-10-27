import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Eye, Package, DollarSign, Star, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { httpJson, getApiBase } from "@/src/lib/http";
import { useAuth } from "@/src/hooks/useAuth";

interface Product {
  id: string;
  name: string;
  description?: string;
  shortDescription?: string;
  price: number;
  currency: string;
  images?: string;
  tourId: string;
  tourTitle: string;
  tourGuideId: string;
  tourGuideName: string;
  status: string;
  category?: string;
  brand?: string;
  unit?: string;
  weight?: number;
  dimensions?: string;
  stockQuantity: number;
  minOrderQuantity: number;
  maxOrderQuantity: number;
  isDigital: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isOnSale: boolean;
  salePrice?: number;
  saleStartDate?: string;
  saleEndDate?: string;
  tags?: string;
  seoKeywords?: string;
  seoDescription?: string;
  viewCount: number;
  purchaseCount: number;
  rating?: number;
  reviewCount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductSearchRequest {
  searchTerm?: string;
  category?: string;
  brand?: string;
  status?: string;
  tourId?: string;
  tourGuideId?: string;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isOnSale?: boolean;
  isDigital?: boolean;
  sortBy?: string;
  sortOrder?: string;
  page: number;
  pageSize: number;
}

interface ProductSearchResponse {
  products: Product[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface ProductStatistics {
  totalProducts: number;
  activeProducts: number;
  draftProducts: number;
  inactiveProducts: number;
  featuredProducts: number;
  bestSellerProducts: number;
  newArrivalProducts: number;
  onSaleProducts: number;
  digitalProducts: number;
  totalValue: number;
  averagePrice: number;
  totalViews: number;
  totalPurchases: number;
  averageRating: number;
}

export default function TourGuideProductManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<ProductStatistics | null>(null);
  const [searchParams, setSearchParams] = useState<ProductSearchRequest>({
    page: 1,
    pageSize: 10
  });
  const [totalPages, setTotalPages] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
    loadStatistics();
  }, [searchParams]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value.toString());
        }
      });

      const response = await httpJson<ProductSearchResponse>(
        `${getApiBase()}/api/product/my-products?${queryParams.toString()}`
      );
      
      setProducts(response.products);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Không thể tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await httpJson<ProductStatistics>(
        `${getApiBase()}/api/product/statistics`
      );
      setStatistics(response);
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await httpJson(`${getApiBase()}/api/product/${productId}`, {
        method: "DELETE"
      });
      toast.success("Xóa sản phẩm thành công");
      loadProducts();
      loadStatistics();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Không thể xóa sản phẩm");
    }
  };

  const handleSearch = (field: keyof ProductSearchRequest, value: any) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value,
      page: 1
    }));
  };

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({
      ...prev,
      page
    }));
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      "Draft": { label: "Nháp", variant: "outline" },
      "Active": { label: "Hoạt động", variant: "default" },
      "Inactive": { label: "Không hoạt động", variant: "secondary" },
      "Discontinued": { label: "Ngừng bán", variant: "destructive" }
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý sản phẩm</h1>
          <p className="text-gray-600 mt-2">Quản lý sản phẩm của bạn</p>
        </div>
        <Button onClick={() => navigate("/admin/product/create")}>
          <Plus className="w-4 h-4 mr-2" />
          Tạo sản phẩm
        </Button>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng sản phẩm</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.activeProducts} hoạt động
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng giá trị</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(statistics.totalValue, "VND")}
              </div>
              <p className="text-xs text-muted-foreground">
                Trung bình {formatPrice(statistics.averagePrice, "VND")}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lượt xem</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalViews}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.totalPurchases} lượt mua
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đánh giá</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics.averageRating.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                Trung bình đánh giá
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Tìm kiếm</label>
              <Input
                placeholder="Tên sản phẩm..."
                value={searchParams.searchTerm || ""}
                onChange={(e) => handleSearch("searchTerm", e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Trạng thái</label>
              <Select
                value={searchParams.status || ""}
                onValueChange={(value) => handleSearch("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả trạng thái</SelectItem>
                  <SelectItem value="Draft">Nháp</SelectItem>
                  <SelectItem value="Active">Hoạt động</SelectItem>
                  <SelectItem value="Inactive">Không hoạt động</SelectItem>
                  <SelectItem value="Discontinued">Ngừng bán</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Danh mục</label>
              <Input
                placeholder="Danh mục..."
                value={searchParams.category || ""}
                onChange={(e) => handleSearch("category", e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Sắp xếp</label>
              <Select
                value={searchParams.sortBy || ""}
                onValueChange={(value) => handleSearch("sortBy", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sắp xếp theo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Ngày tạo</SelectItem>
                  <SelectItem value="name">Tên</SelectItem>
                  <SelectItem value="price">Giá</SelectItem>
                  <SelectItem value="viewCount">Lượt xem</SelectItem>
                  <SelectItem value="purchaseCount">Lượt mua</SelectItem>
                  <SelectItem value="rating">Đánh giá</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle>Sản phẩm ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có sản phẩm</h3>
              <p className="text-gray-600 mb-4">Bắt đầu tạo sản phẩm đầu tiên của bạn</p>
              <Button onClick={() => navigate("/admin/product/create")}>
                <Plus className="w-4 h-4 mr-2" />
                Tạo sản phẩm
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        {getStatusBadge(product.status)}
                        {product.isFeatured && <Badge variant="secondary">Nổi bật</Badge>}
                        {product.isBestSeller && <Badge variant="secondary">Bán chạy</Badge>}
                        {product.isNewArrival && <Badge variant="secondary">Mới</Badge>}
                        {product.isOnSale && <Badge variant="destructive">Giảm giá</Badge>}
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <p><strong>Tour:</strong> {product.tourTitle}</p>
                        <p><strong>Giá:</strong> {formatPrice(product.price, product.currency)}</p>
                        {product.salePrice && (
                          <p><strong>Giá sale:</strong> {formatPrice(product.salePrice, product.currency)}</p>
                        )}
                        <p><strong>Tồn kho:</strong> {product.stockQuantity}</p>
                        <p><strong>Lượt xem:</strong> {product.viewCount} | <strong>Lượt mua:</strong> {product.purchaseCount}</p>
                        {product.rating && (
                          <p><strong>Đánh giá:</strong> {product.rating.toFixed(1)} ({product.reviewCount} đánh giá)</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/product/${product.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/product/${product.id}/edit`)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn có chắc chắn muốn xóa sản phẩm "{product.name}"? Hành động này không thể hoàn tác.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteProduct(product.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === searchParams.page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
