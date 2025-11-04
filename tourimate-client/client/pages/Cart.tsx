import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { httpJson, getApiBase } from "../src/lib/http";
import { ShoppingCart, Trash2, Plus, Minus, Package, AlertCircle } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  currency: string;
  subtotal: number;
  selectedVariant?: string;
  isAvailable: boolean;
  availableStock: number;
  tourTitle?: string;
  tourId: string;
  tourGuideName?: string;
}

interface CartSummary {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  currency: string;
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

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const response = await httpJson<CartSummary>(`${getApiBase()}/api/shoppingcart`);
      setCart(response);
    } catch (error: any) {
      console.error("Error loading cart:", error);
      if (error.message?.includes("401")) {
        navigate("/login?redirect=/cart");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      setUpdatingItems(prev => new Set(prev).add(itemId));
      await httpJson(`${getApiBase()}/api/shoppingcart/${itemId}`, {
        method: "PUT",
        body: JSON.stringify({ quantity: newQuantity }),
      });
      await loadCart();
    } catch (error: any) {
      console.error("Error updating quantity:", error);
      alert(error.message || "Không thể cập nhật số lượng");
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const removeItem = async (itemId: string) => {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?")) return;

    try {
      await httpJson(`${getApiBase()}/api/shoppingcart/${itemId}`, {
        method: "DELETE",
      });
      await loadCart();
    } catch (error: any) {
      console.error("Error removing item:", error);
      alert("Không thể xóa sản phẩm");
    }
  };

  const clearCart = async () => {
    if (!confirm("Bạn có chắc muốn xóa tất cả sản phẩm trong giỏ hàng?")) return;

    try {
      await httpJson(`${getApiBase()}/api/shoppingcart/clear`, {
        method: "DELETE",
      });
      await loadCart();
    } catch (error: any) {
      console.error("Error clearing cart:", error);
      alert("Không thể xóa giỏ hàng");
    }
  };

  const formatPrice = (price: number, currency: string = "VND") => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency === 'VND' ? 'VND' : currency,
    }).format(price);
  };

  const parseVariant = (variantJson?: string): ProductVariant | null => {
    if (!variantJson) return null;
    try {
      return JSON.parse(variantJson);
    } catch {
      return null;
    }
  };

  const getVariantDisplay = (item: CartItem): string => {
    const variant = parseVariant(item.selectedVariant);
    if (!variant) return "";
    return `${variant.netAmount}${variant.netUnit}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tour-blue mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải giỏ hàng...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Giỏ hàng trống</h1>
            <p className="text-gray-600 mb-8">
              Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá các sản phẩm của chúng tôi!
            </p>
            <Button onClick={() => navigate("/products")} size="lg">
              Khám phá sản phẩm
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const availableItems = cart.items.filter(item => item.isAvailable);
  const unavailableItems = cart.items.filter(item => !item.isAvailable);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Giỏ hàng của bạn</h1>
          <p className="text-gray-600">{cart.totalItems} sản phẩm</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Available Items */}
            {availableItems.length > 0 && (
              <>
                {availableItems.map((item) => {
                  const variant = parseVariant(item.selectedVariant);
                  const isUpdating = updatingItems.has(item.id);

                  return (
                    <Card key={item.id}>
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {/* Product Image */}
                          <div
                            className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
                            onClick={() => navigate(`/products/${item.productId}`)}
                          >
                            {item.productImage ? (
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <h3
                              className="font-semibold text-gray-900 mb-1 cursor-pointer hover:text-tour-blue truncate"
                              onClick={() => navigate(`/products/${item.productId}`)}
                            >
                              {item.productName}
                            </h3>
                            {variant && (
                              <p className="text-sm text-gray-600 mb-1">
                                Phân loại: {getVariantDisplay(item)}
                              </p>
                            )}
                            <p className="text-sm text-gray-500 mb-2">
                              Từ: {item.tourGuideName}
                            </p>
                            <p className="text-lg font-bold text-tour-blue">
                              {formatPrice(item.price, item.currency)}
                            </p>
                            {variant?.isOnSale && variant.salePrice && (
                              <p className="text-sm text-gray-400 line-through">
                                {formatPrice(variant.price, item.currency)}
                              </p>
                            )}
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex flex-col items-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>

                            <div className="flex items-center gap-2 border rounded-lg">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1 || isUpdating}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  if (val > 0 && val <= item.availableStock) {
                                    updateQuantity(item.id, val);
                                  }
                                }}
                                className="w-16 h-8 text-center border-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                disabled={isUpdating}
                                min={1}
                                max={item.availableStock}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                disabled={item.quantity >= item.availableStock || isUpdating}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>

                            <p className="text-sm text-gray-500">
                              Còn {item.availableStock} sản phẩm
                            </p>

                            <p className="text-lg font-bold text-gray-900">
                              {formatPrice(item.subtotal, item.currency)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </>
            )}

            {/* Unavailable Items */}
            {unavailableItems.length > 0 && (
              <>
                <div className="flex items-center gap-2 text-gray-600 mt-6">
                  <AlertCircle className="w-5 h-5" />
                  <h2 className="text-lg font-semibold">Sản phẩm không khả dụng</h2>
                </div>
                {unavailableItems.map((item) => (
                  <Card key={item.id} className="opacity-60">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-full h-full object-cover grayscale"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-700 mb-1">{item.productName}</h3>
                          <p className="text-sm text-red-600 mb-2">
                            {item.availableStock === 0 ? "Hết hàng" : "Không đủ số lượng"}
                          </p>
                          <p className="text-gray-500">Số lượng: {item.quantity}</p>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}

            {cart.items.length > 1 && (
              <Button
                variant="outline"
                onClick={clearCart}
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Xóa tất cả
              </Button>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Tổng đơn hàng</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính:</span>
                    <span>{formatPrice(cart.totalAmount, cart.currency)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Phí vận chuyển:</span>
                    <span className="text-green-600">Miễn phí</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Tổng cộng:</span>
                      <span className="text-tour-blue">
                        {formatPrice(cart.totalAmount, cart.currency)}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full mb-3"
                  size="lg"
                  disabled={availableItems.length === 0}
                  onClick={() => navigate("/checkout")}
                >
                  Thanh toán ({availableItems.length} sản phẩm)
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/products")}
                >
                  Tiếp tục mua sắm
                </Button>

                {unavailableItems.length > 0 && (
                  <p className="text-sm text-gray-500 mt-4 text-center">
                    {unavailableItems.length} sản phẩm không khả dụng sẽ không được thanh toán
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

