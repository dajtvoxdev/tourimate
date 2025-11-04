import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Star, ShoppingBag, Filter, X, ShoppingCart } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { httpJson, getApiBase } from "../src/lib/http";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useToast } from "../hooks/use-toast";

interface ProductDto {
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
  stockQuantity: number;
  purchaseCount: number;
  rating?: number;
  reviewCount: number;
  variantsJson?: string;
}

interface Division {
  code: number;
  name: string;
  provinceCode?: number;
}

export default function Products() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [provinces, setProvinces] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    fetchProvinces();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchParams]);

  const fetchProvinces = async () => {
    try {
      const response = await httpJson<Division[]>(`${getApiBase()}/api/divisions/provinces`);
      // Filter only provinces (divisions without parent)
      const provincesList = response.filter((d: Division) => !d.provinceCode);
      setProvinces(provincesList);
    } catch (error) {
      console.error("Error fetching provinces:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", searchParams.get("page") || "1");
      params.append("pageSize", pageSize.toString());
      params.append("status", "Approved");
      
      const searchTerm = searchParams.get("search");
      if (searchTerm) params.append("search", searchTerm);
      
      const provinceCode = searchParams.get("provinceCode");
      if (provinceCode) params.append("provinceCode", provinceCode);
      
      const category = searchParams.get("category");
      if (category) params.append("category", category);

      const sortBy = searchParams.get("sortBy") || "createdAt";
      const sortDirection = searchParams.get("sortDirection") || "desc";
      params.append("sortBy", sortBy);
      params.append("sortDirection", sortDirection);

      const response = await httpJson<any>(`${getApiBase()}/api/product?${params.toString()}`);
      setProducts(response.products || []);
      setTotalCount(response.totalCount || 0);
      setCurrentPage(parseInt(searchParams.get("page") || "1"));
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (key: string, value: string | undefined) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set("page", "1"); // Reset to first page
    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    setSearchParams(new URLSearchParams({
      page: "1",
      pageSize: pageSize.toString()
    }));
  };

  const formatPrice = (price: number, currency: string = "VND") => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency === 'VND' ? 'VND' : currency,
    }).format(price);
  };

  const quickAddToCart = async (e: React.MouseEvent, product: ProductDto) => {
    e.stopPropagation(); // Prevent navigation to detail page
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate(`/login?redirect=/products`);
        return;
      }

      // If product has variants, redirect to detail page
      if (product.variantsJson) {
        try {
          const variants = JSON.parse(product.variantsJson);
          if (variants && variants.length > 0) {
            navigate(`/products/${product.id}`);
            return;
          }
        } catch (err) {
          console.error('Error parsing variants:', err);
        }
      }

      // Check stock
      if (product.stockQuantity <= 0) {
        toast({
          variant: "destructive",
          title: "Hết hàng",
          description: "Sản phẩm hiện đã hết hàng",
        });
        return;
      }

      setAddingToCart(product.id);

      await httpJson(`${getApiBase()}/api/shoppingcart`, {
        method: 'POST',
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
        }),
      });

      toast({
        title: "Thêm vào giỏ hàng thành công",
        description: `Đã thêm "${product.name}" vào giỏ hàng`,
      });
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      if (error.message?.includes('401')) {
        navigate(`/login?redirect=/products`);
      } else {
        // Parse error message
        let errorMessage = 'Không thể thêm vào giỏ hàng';
        if (error.message) {
          if (error.message.includes('Insufficient stock')) {
            const match = error.message.match(/Only (\d+) items available/);
            if (match) {
              errorMessage = `Không đủ hàng. Hiện chỉ còn ${match[1]} sản phẩm`;
            } else {
              errorMessage = 'Sản phẩm đã hết hàng';
            }
          } else {
            errorMessage = error.message;
          }
        }
        
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: errorMessage,
        });
      }
    } finally {
      setAddingToCart(null);
    }
  };

  const getProductImages = (product: ProductDto): string[] => {
    if (!product.images) return [];
    try {
      return JSON.parse(product.images);
    } catch {
      return [];
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sản phẩm đặc sản</h1>
          <p className="text-gray-600 mt-2">Khám phá các sản phẩm đặc sản từ các tour du lịch</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tìm kiếm
                </label>
                <Input
                  type="text"
                  placeholder="Tên sản phẩm..."
                  value={searchParams.get("search") || ""}
                  onChange={(e) => handleSearch("search", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tỉnh thành
                </label>
                <Select
                  value={searchParams.get("provinceCode") || "all"}
                  onValueChange={(value) => handleSearch("provinceCode", value === "all" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả tỉnh thành" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả tỉnh thành</SelectItem>
                    {provinces.map((province) => (
                      <SelectItem key={province.code} value={province.code.toString()}>
                        {province.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sắp xếp
                </label>
                <Select
                  value={searchParams.get("sortBy") || "createdAt"}
                  onValueChange={(value) => handleSearch("sortBy", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Mới nhất</SelectItem>
                    <SelectItem value="price">Giá</SelectItem>
                    <SelectItem value="purchaseCount">Bán chạy</SelectItem>
                    <SelectItem value="rating">Đánh giá</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thứ tự
                </label>
                <Select
                  value={searchParams.get("sortDirection") || "desc"}
                  onValueChange={(value) => handleSearch("sortDirection", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Giảm dần</SelectItem>
                    <SelectItem value="asc">Tăng dần</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(searchParams.get("search") || searchParams.get("provinceCode") || searchParams.get("category")) && (
              <div className="mt-4 flex justify-end">
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Xóa bộ lọc
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results count */}
        <div className="mb-4 text-gray-600">
          Tìm thấy {totalCount} sản phẩm
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tour-blue"></div>
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => {
                const images = getProductImages(product);
                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    <div className="relative h-48">
                      <img
                        src={images.length > 0 ? images[0] : '/placeholder-product.jpg'}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      {product.stockQuantity <= 0 && (
                        <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-lg font-semibold text-sm">
                          Hết hàng
                        </div>
                      )}
                      <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1">
                        <span className="font-bold text-lg text-gray-900">
                          {formatPrice(product.price, product.currency)}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                        {product.name}
                      </h3>
                      {product.shortDescription && (
                        <div 
                          className="text-sm text-gray-600 line-clamp-2 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: product.shortDescription }}
                        />
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {product.rating && product.reviewCount > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span>{product.rating.toFixed(1)} ({product.reviewCount})</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <ShoppingBag className="w-4 h-4" />
                          <span>{product.purchaseCount} đã mua</span>
                        </div>
                      </div>

                      {/* Quick Add to Cart Button */}
                      <Button
                        className="w-full"
                        size="sm"
                        onClick={(e) => quickAddToCart(e, product)}
                        disabled={product.stockQuantity <= 0 || addingToCart === product.id}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {addingToCart === product.id ? 'Đang thêm...' : 'Thêm vào giỏ'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleSearch("page", Math.max(1, currentPage - 1).toString())}
                  disabled={currentPage === 1}
                >
                  Trước
                </Button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => 
                      page === 1 || 
                      page === totalPages || 
                      Math.abs(page - currentPage) <= 2
                    )
                    .map((page, index, array) => (
                      <>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span key={`ellipsis-${page}`} className="px-2">...</span>
                        )}
                        <Button
                          key={page}
                          variant={page === currentPage ? "default" : "outline"}
                          onClick={() => handleSearch("page", page.toString())}
                        >
                          {page}
                        </Button>
                      </>
                    ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleSearch("page", Math.min(totalPages, currentPage + 1).toString())}
                  disabled={currentPage === totalPages}
                >
                  Sau
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="text-gray-400 mb-4">
              <ShoppingBag className="w-16 h-16 mx-auto" />
            </div>
            <p className="text-gray-600 text-lg">Không tìm thấy sản phẩm nào</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

