import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Star, ShoppingBag, Package, ArrowLeft, ChevronLeft, ChevronRight, Plus, Minus, ShoppingCart } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { httpJson, getApiBase } from "../src/lib/http";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
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
  minOrderQuantity: number;
  maxOrderQuantity: number;
  purchaseCount: number;
  viewCount: number;
  rating?: number;
  reviewCount: number;
  variantsJson?: string;
}

interface ProductVariant {
  netAmount: number;
  netUnit: string;
  price: number;
  stockQuantity: number;
  isOnSale: boolean;
  salePrice?: number;
  saleStartDate?: string;
  saleEndDate?: string;
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductDto[]>([]);
  const [similarProducts, setSimilarProducts] = useState<ProductDto[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchRelatedProducts();
    }
  }, [id]);

  useEffect(() => {
    if (product && product.category) {
      fetchSimilarProducts();
    }
  }, [product?.category]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await httpJson<ProductDto>(`${getApiBase()}/api/product/${id}`);
      setProduct(response);
      
      // Parse variants
      if (response.variantsJson) {
        try {
          const parsedVariants = JSON.parse(response.variantsJson);
          setVariants(parsedVariants);
          if (parsedVariants.length > 0) {
            setSelectedVariant(parsedVariants[0]);
          }
        } catch (error) {
          console.error("Error parsing variants:", error);
        }
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async () => {
    try {
      const response = await httpJson<ProductDto[]>(`${getApiBase()}/api/product/${id}/related`);
      setRelatedProducts(response);
    } catch (error) {
      console.error("Error fetching related products:", error);
    }
  };

  const fetchSimilarProducts = async () => {
    try {
      if (!product?.category) return;
      const response = await httpJson<any>(`${getApiBase()}/api/product?category=${product.category}&status=Approved&pageSize=4&sortBy=purchaseCount&sortDirection=desc`);
      // Filter out current product
      const filtered = (response.products || []).filter((p: ProductDto) => p.id !== id);
      setSimilarProducts(filtered.slice(0, 4));
    } catch (error) {
      console.error("Error fetching similar products:", error);
    }
  };

  const formatPrice = (price: number, currency: string = "VND") => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency === 'VND' ? 'VND' : currency,
    }).format(price);
  };

  const addToCart = async () => {
    try {
      // Check if user is logged in
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login?redirect=/products/' + id);
        return;
      }

      // If product has variants, user must select one
      if (variants.length > 0 && !selectedVariant) {
        toast({
          variant: "destructive",
          title: "Vui lòng chọn quy cách",
          description: "Bạn cần chọn quy cách sản phẩm trước khi thêm vào giỏ hàng",
        });
        return;
      }

      // Check stock before adding
      // If product has variants but none selected, we can't add to cart
      if (variants.length > 0 && !selectedVariant) {
        // This should be caught earlier, but double check
        toast({
          variant: "destructive",
          title: "Vui lòng chọn quy cách",
          description: "Bạn cần chọn quy cách sản phẩm trước khi thêm vào giỏ hàng",
        });
        return;
      }

      const currentStock = selectedVariant ? selectedVariant.stockQuantity : (product?.stockQuantity || 0);
      
      // Debug: log stock info
      console.log('Stock check:', {
        hasVariants: variants.length > 0,
        selectedVariant: selectedVariant,
        currentStock,
        quantity,
        productStockQuantity: product?.stockQuantity
      });

      if (currentStock < quantity) {
        toast({
          variant: "destructive",
          title: "Không đủ hàng",
          description: `Hiện chỉ còn ${currentStock} sản phẩm trong kho`,
        });
        return;
      }

      setAddingToCart(true);

      const requestBody: any = {
        productId: id,
        quantity: quantity,
      };

      // Include selected variant if exists
      if (selectedVariant) {
        requestBody.selectedVariant = JSON.stringify(selectedVariant);
      }

      // Debug log
      console.log('Adding to cart:', {
        productId: id,
        quantity,
        hasSelectedVariant: !!selectedVariant,
        selectedVariant: selectedVariant,
        productStockQuantity: product?.stockQuantity,
        variantStockQuantity: selectedVariant?.stockQuantity,
        currentStock: selectedVariant ? selectedVariant.stockQuantity : (product?.stockQuantity || 0)
      });

      await httpJson(`${getApiBase()}/api/shoppingcart`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      toast({
        title: "Thêm vào giỏ hàng thành công",
        description: `Đã thêm ${quantity} sản phẩm vào giỏ hàng`,
      });
      
      // Reset quantity after adding
      setQuantity(1);
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      if (error.message?.includes('401')) {
        navigate('/login?redirect=/products/' + id);
      } else {
        // Parse error message from backend
        let errorMessage = 'Không thể thêm vào giỏ hàng';
        if (error.message) {
          // Backend sends error like "Insufficient stock. Only 0 items available"
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
      setAddingToCart(false);
    }
  };

  const getProductImages = (): string[] => {
    if (!product?.images) return [];
    try {
      return JSON.parse(product.images);
    } catch {
      return [];
    }
  };

  const images = getProductImages();

  const nextImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tour-blue"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-gray-600 text-lg">Không tìm thấy sản phẩm</p>
          <Button onClick={() => navigate("/products")} className="mt-4">
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/products")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại danh sách
          </Button>
        </div>

        {/* Product Detail */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Image Gallery */}
              <div>
                <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-4" style={{ paddingBottom: "100%" }}>
                  {images.length > 0 ? (
                    <>
                      <img
                        src={images[currentImageIndex]}
                        alt={product.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      {images.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                          >
                            <ChevronLeft className="w-6 h-6" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                          >
                            <ChevronRight className="w-6 h-6" />
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Thumbnail Gallery */}
                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`relative bg-gray-100 rounded-lg overflow-hidden border-2 transition-all ${
                          index === currentImageIndex ? "border-tour-blue" : "border-transparent"
                        }`}
                        style={{ paddingBottom: "100%" }}
                      >
                        <img
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                  {product.brand && (
                    <p className="text-gray-600">Thương hiệu: {product.brand}</p>
                  )}
                </div>

                {/* Rating & Sales */}
                <div className="flex items-center gap-6">
                  {product.rating && product.reviewCount > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 text-yellow-500 fill-current" />
                        <span className="font-bold text-lg">{product.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-gray-500">({product.reviewCount} đánh giá)</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">{product.purchaseCount} đã mua</span>
                  </div>
                </div>

                {/* Price */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Giá bán</p>
                  <p className="text-4xl font-bold text-tour-blue">
                    {selectedVariant ? formatPrice(selectedVariant.price, product.currency) : formatPrice(product.price, product.currency)}
                  </p>
                </div>

                {/* Variants */}
                {variants.length > 0 && (
                  <div>
                    <p className="font-semibold mb-3">Chọn định lượng:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {variants.map((variant, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedVariant(variant)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            selectedVariant === variant
                              ? "border-tour-blue bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <p className="font-semibold">{variant.netAmount}{variant.netUnit}</p>
                          <p className="text-sm text-gray-600">{formatPrice(variant.price, product.currency)}</p>
                          <p className="text-xs text-gray-500">
                            {variant.stockQuantity > 0 ? `Còn ${variant.stockQuantity} sản phẩm` : "Hết hàng"}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stock Status */}
                <div>
                  {(() => {
                    const currentStock = selectedVariant ? selectedVariant.stockQuantity : product.stockQuantity;
                    return currentStock > 0 ? (
                      <p className="text-green-600 font-semibold">✓ Còn hàng ({currentStock} sản phẩm)</p>
                    ) : (
                      <p className="text-red-600 font-semibold">✗ Hết hàng</p>
                    );
                  })()}
                </div>

                {/* Quantity Selector and Add to Cart */}
                {(() => {
                  const currentStock = selectedVariant ? selectedVariant.stockQuantity : product.stockQuantity;
                  const isOutOfStock = currentStock === 0;
                  
                  return (
                    <div className="space-y-4">
                      {/* Quantity Selector */}
                      <div>
                        <p className="font-semibold mb-2">Số lượng:</p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center border rounded-lg">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setQuantity(Math.max(1, quantity - 1))}
                              disabled={quantity <= 1 || isOutOfStock}
                              className="h-10 w-10 p-0"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Input
                              type="number"
                              value={quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (val > 0 && val <= currentStock) {
                                  setQuantity(val);
                                }
                              }}
                              className="w-20 h-10 text-center border-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              disabled={isOutOfStock}
                              min={1}
                              max={currentStock}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                              disabled={quantity >= currentStock || isOutOfStock}
                              className="h-10 w-10 p-0"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <span className="text-sm text-gray-500">
                            {isOutOfStock ? "Hết hàng" : `Còn ${currentStock} sản phẩm`}
                          </span>
                        </div>
                      </div>

                      {/* Add to Cart Button */}
                      <div className="flex gap-3">
                        <Button
                          size="lg"
                          className="flex-1"
                          onClick={addToCart}
                          disabled={isOutOfStock || addingToCart}
                        >
                          <ShoppingCart className="w-5 h-5 mr-2" />
                          {addingToCart ? "Đang thêm..." : "Thêm vào giỏ hàng"}
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          onClick={() => navigate("/cart")}
                        >
                          Xem giỏ hàng
                        </Button>
                      </div>
                    </div>
                  );
                })()}

                {/* Short Description */}
                {product.shortDescription && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Mô tả ngắn</h3>
                    <div 
                      className="text-gray-600 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: product.shortDescription }}
                    />
                  </div>
                )}

                {/* Tour Guide */}
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600">Hướng dẫn viên</p>
                  <p className="font-semibold">{product.tourGuideName}</p>
                </div>
              </div>
            </div>

            {/* Full Description */}
            {product.description && (
              <div className="mt-8 border-t pt-8">
                <h2 className="text-2xl font-bold mb-4">Mô tả chi tiết</h2>
                <div 
                  className="prose max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Related Products from Same Tour */}
        {relatedProducts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Sản phẩm cùng tour</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => {
                const relatedImages = relatedProduct.images ? JSON.parse(relatedProduct.images) : [];
                return (
                  <div
                    key={relatedProduct.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                    onClick={() => navigate(`/products/${relatedProduct.id}`)}
                  >
                    <div className="relative h-48">
                      <img
                        src={relatedImages.length > 0 ? relatedImages[0] : '/placeholder-product.jpg'}
                        alt={relatedProduct.name}
                        className="w-full h-full object-cover"
                      />
                      {relatedProduct.stockQuantity <= 0 && (
                        <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-lg font-semibold text-sm">
                          Hết hàng
                        </div>
                      )}
                      <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1">
                        <span className="font-bold text-lg text-gray-900">
                          {formatPrice(relatedProduct.price, relatedProduct.currency)}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-2 min-h-[3rem]">
                        {relatedProduct.name}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        {relatedProduct.rating && relatedProduct.reviewCount > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span>{relatedProduct.rating.toFixed(1)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <ShoppingBag className="w-4 h-4" />
                          <span>{relatedProduct.purchaseCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Similar Products by Category */}
        {similarProducts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Sản phẩm tương tự</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProducts.map((similarProduct) => {
                const similarImages = similarProduct.images ? JSON.parse(similarProduct.images) : [];
                return (
                  <div
                    key={similarProduct.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                    onClick={() => navigate(`/products/${similarProduct.id}`)}
                  >
                    <div className="relative h-48">
                      <img
                        src={similarImages.length > 0 ? similarImages[0] : '/placeholder-product.jpg'}
                        alt={similarProduct.name}
                        className="w-full h-full object-cover"
                      />
                      {similarProduct.stockQuantity <= 0 && (
                        <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-lg font-semibold text-sm">
                          Hết hàng
                        </div>
                      )}
                      <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1">
                        <span className="font-bold text-lg text-gray-900">
                          {formatPrice(similarProduct.price, similarProduct.currency)}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-2 min-h-[3rem]">
                        {similarProduct.name}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        {similarProduct.rating && similarProduct.reviewCount > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span>{similarProduct.rating.toFixed(1)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <ShoppingBag className="w-4 h-4" />
                          <span>{similarProduct.purchaseCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

