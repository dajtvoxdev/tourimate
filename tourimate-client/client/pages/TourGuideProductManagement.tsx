import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Eye, Package, DollarSign, Star, TrendingUp, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { httpJson, getApiBase } from "@/src/lib/http";
import { useAuth } from "@/src/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";

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
  approvalStatus?: string;
  rejectionReason?: string;
  approvedAt?: string;
  notes?: string;
  variantsJson?: string;
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
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [categories, setCategories] = useState<Record<string, string>>({});

  useEffect(() => {
    loadProducts();
    loadStatistics();
  }, [searchParams]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await httpJson<any[]>(`${getApiBase()}/api/product-categories`);
      const categoryMap: Record<string, string> = {};
      response.forEach((cat: any) => {
        categoryMap[cat.id] = cat.name;
      });
      setCategories(categoryMap);
      console.log('Categories loaded:', categoryMap);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value.toString());
        }
      });

      // Use different endpoint based on user role
      const endpoint = user?.role === 'Admin' 
        ? `${getApiBase()}/api/product/pending-approval?${queryParams.toString()}`
        : `${getApiBase()}/api/product/my-products?${queryParams.toString()}`;
      
      const response = await httpJson<ProductSearchResponse>(endpoint);
      setProducts(response.products as any);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Không thể tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    // Only load statistics for tour guides, not admins
    if (user?.role === 'Admin') {
      return;
    }
    
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

  const handleClearFilters = () => {
    setSearchParams({
      page: 1,
      pageSize: 10
    });
  };

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({
      ...prev,
      page
    }));
  };

  const getStatusBadge = (status: string) => {
    const map = (s: string) => {
      const key = (s || '').toLowerCase();
      if (key === 'draft') return { label: 'Nháp', variant: 'outline' as const };
      if (key === 'pendingapproval') return { label: 'Chờ duyệt', variant: 'secondary' as const };
      if (key === 'approved') return { label: 'Đã duyệt', variant: 'default' as const };
      if (key === 'rejected') return { label: 'Bị từ chối', variant: 'destructive' as const };
      if (key === 'discontinued') return { label: 'Ngừng bán', variant: 'destructive' as const };
      return { label: s, variant: 'outline' as const };
    };
    const info = map(status);
    return <Badge variant={info.variant}>{info.label}</Badge>;
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
    <AdminLayout>
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.role === 'Admin' ? 'Duyệt sản phẩm' : 'Quản lý sản phẩm'}
          </h1>
          <p className="text-gray-600 mt-2">
            {user?.role === 'Admin' ? 'Xem và duyệt sản phẩm từ hướng dẫn viên' : 'Quản lý sản phẩm của bạn'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { loadProducts(); loadStatistics(); }} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          {user?.role !== 'Admin' && (
            <Button onClick={() => navigate("/admin/product/create")}>
              <Plus className="w-4 h-4 mr-2" />
              Tạo sản phẩm
            </Button>
          )}
        </div>
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
              <CardTitle className="text-sm font-medium">Lượt mua</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalPurchases}</div>
              <p className="text-xs text-muted-foreground">
                Tổng lượt mua sản phẩm
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Bộ lọc</CardTitle>
          <Button variant="outline" size="sm" onClick={handleClearFilters}>
            <X className="w-4 h-4 mr-2" />
            Xóa lọc
          </Button>
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
                value={searchParams.status ? String(searchParams.status) : "all"}
                onValueChange={(value) => handleSearch("status", value === "all" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="Draft">Nháp</SelectItem>
                  <SelectItem value="PendingApproval">Chờ duyệt</SelectItem>
                  <SelectItem value="Approved">Đã duyệt</SelectItem>
                  <SelectItem value="Rejected">Bị từ chối</SelectItem>
                  <SelectItem value="Discontinued">Ngừng bán</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Danh mục</label>
              <Select
                value={searchParams.category || "all"}
                onValueChange={(value) => handleSearch("category", value === "all" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  {Object.entries(categories).map(([id, name]) => (
                    <SelectItem key={id} value={id}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Sắp xếp</label>
              <Select
                value={searchParams.sortBy ? String(searchParams.sortBy) : "createdAt"}
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
              {user?.role !== 'Admin' && (
              <Button onClick={() => navigate("/admin/product/create")}>
                <Plus className="w-4 h-4 mr-2" />
                Tạo sản phẩm
              </Button>
              )}
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
                        <p><strong>Lượt mua:</strong> {product.purchaseCount}</p>
                        {product.rating && (
                          <p><strong>Đánh giá:</strong> {product.rating.toFixed(1)} ({product.reviewCount} đánh giá)</p>
                        )}
                        {product.rejectionReason && (
                          <p><strong>Lý do từ chối:</strong> {product.rejectionReason}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowDetailDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {user?.role === 'Admin' ? (
                        <>
                          {String(product.status || '').toLowerCase() !== 'approved' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await httpJson(`${getApiBase()}/api/product/${product.id}/approve`, { method: 'POST' });
                                  toast.success('Đã duyệt sản phẩm');
                                  loadProducts();
                                } catch (e) {
                                  console.error(e);
                                  toast.error('Không thể duyệt sản phẩm');
                                }
                              }}
                            >
                              Duyệt
                            </Button>
                          )}
                          {String(product.status || '').toLowerCase() !== 'rejected' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={async () => {
                                const reason = window.prompt('Nhập lý do từ chối (tuỳ chọn):') || '';
                                try {
                                  await httpJson(`${getApiBase()}/api/product/${product.id}/reject`, { method: 'POST', body: JSON.stringify({ rejectionReason: reason }) });
                                  toast.success('Đã từ chối sản phẩm');
                                  loadProducts();
                                } catch (e) {
                                  console.error(e);
                                  toast.error('Không thể từ chối sản phẩm');
                                }
                              }}
                            >
                              Từ chối
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          {(String(product.status || '').toLowerCase() === 'draft' || String(product.status || '').toLowerCase() === 'rejected') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await httpJson(`${getApiBase()}/api/product/${product.id}/request-approval`, { method: 'POST' });
                                  toast.success('Đã gửi yêu cầu duyệt');
                                  loadProducts();
                                } catch (e) {
                                  console.error(e);
                                  toast.error('Không thể gửi yêu cầu duyệt');
                                }
                              }}
                            >
                              Gửi duyệt
                            </Button>
                          )}
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
                        </>
                      )}
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

      {/* Product Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
            <DialogDescription>
              Chi tiết sản phẩm
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {getStatusBadge(selectedProduct.status)}
                {selectedProduct.isFeatured && <Badge variant="secondary">Nổi bật</Badge>}
                {selectedProduct.isBestSeller && <Badge variant="secondary">Bán chạy</Badge>}
                {selectedProduct.isNewArrival && <Badge variant="secondary">Mới</Badge>}
                {selectedProduct.isOnSale && <Badge variant="destructive">Giảm giá</Badge>}
              </div>

              {selectedProduct.images && (
                <div className="grid grid-cols-2 gap-2">
                  {JSON.parse(selectedProduct.images).map((img: string, idx: number) => (
                    <img key={idx} src={img} alt={`Product ${idx + 1}`} className="w-full h-48 object-cover rounded" />
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Tour</p>
                  <p className="font-medium">{selectedProduct.tourTitle}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Hướng dẫn viên</p>
                  <p className="font-medium">{selectedProduct.tourGuideName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Giá</p>
                  <p className="font-medium">{formatPrice(selectedProduct.price, selectedProduct.currency)}</p>
                </div>
                {selectedProduct.salePrice && (
                  <div>
                    <p className="text-sm text-gray-600">Giá sale</p>
                    <p className="font-medium text-red-600">{formatPrice(selectedProduct.salePrice, selectedProduct.currency)}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Tồn kho</p>
                  <p className="font-medium">{selectedProduct.stockQuantity}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Lượt mua</p>
                  <p className="font-medium">{selectedProduct.purchaseCount}</p>
                </div>
                {selectedProduct.category && (
                  <div>
                    <p className="text-sm text-gray-600">Danh mục</p>
                    <p className="font-medium">{categories[selectedProduct.category] || selectedProduct.category}</p>
                  </div>
                )}
                {selectedProduct.brand && (
                  <div>
                    <p className="text-sm text-gray-600">Thương hiệu</p>
                    <p className="font-medium">{selectedProduct.brand}</p>
                  </div>
                )}
                {selectedProduct.rating && (
                  <div>
                    <p className="text-sm text-gray-600">Đánh giá</p>
                    <p className="font-medium">{selectedProduct.rating.toFixed(1)} ({selectedProduct.reviewCount} đánh giá)</p>
                  </div>
                )}
              </div>

              {selectedProduct.shortDescription && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Mô tả ngắn</p>
                  <div className="text-sm" dangerouslySetInnerHTML={{ __html: selectedProduct.shortDescription }} />
                </div>
              )}

              {selectedProduct.description && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Mô tả chi tiết</p>
                  <div className="text-sm" dangerouslySetInnerHTML={{ __html: selectedProduct.description }} />
                </div>
              )}

              {selectedProduct.variantsJson && (() => {
                try {
                  const variants = JSON.parse(selectedProduct.variantsJson);
                  if (variants && variants.length > 0) {
                    return (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Biến thể sản phẩm</p>
                        <div className="space-y-2">
                          {variants.map((variant: any, idx: number) => (
                            <div key={idx} className="border rounded p-3 bg-gray-50">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-gray-600">Khối lượng:</span>
                                  <span className="font-medium ml-2">{variant.netAmount} {variant.netUnit}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Giá:</span>
                                  <span className="font-medium ml-2">{formatPrice(variant.price, 'VND')}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Tồn kho:</span>
                                  <span className="font-medium ml-2">{variant.stockQuantity}</span>
                                </div>
                                {variant.isOnSale && variant.salePrice && (
                                  <div>
                                    <span className="text-gray-600">Giá sale:</span>
                                    <span className="font-medium ml-2 text-red-600">{formatPrice(variant.salePrice, 'VND')}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                } catch (e) {
                  console.error('Error parsing variants:', e);
                }
                return null;
              })()}

              {selectedProduct.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm text-red-600 font-medium mb-1">Lý do từ chối</p>
                  <p className="text-sm text-red-700">{selectedProduct.rejectionReason}</p>
                </div>
              )}

              <div className="text-xs text-gray-500 pt-4 border-t">
                <p>Tạo lúc: {new Date(selectedProduct.createdAt).toLocaleString('vi-VN')}</p>
                <p>Cập nhật: {new Date(selectedProduct.updatedAt).toLocaleString('vi-VN')}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </AdminLayout>
  );
}
