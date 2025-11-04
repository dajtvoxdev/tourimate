import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { User, MapPin, ShoppingCart, Star, CreditCard, ArrowLeft, Package, Truck, Copy, Check } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../components/ui/alert-dialog";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../src/hooks/useAuth";
import { httpJson, getApiBase } from "../src/lib/http";

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
}

interface OrderItemDto {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  subtotal: number;
  selectedVariant?: string;
  tourTitle?: string;
  tourId?: string;
  tourGuideName?: string;
}

interface OrderDto {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  currency: string;
  receiverName: string;
  receiverPhone: string;
  receiverEmail: string;
  shippingAddress: string;
  notes?: string;
  createdAt: string;
  items: OrderItemDto[];
}

const ProductCheckout: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [orderId, setOrderId] = useState<string>("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [adminBanking, setAdminBanking] = useState<{
    account: string;
    bankName: string;
    qrCodeUrl: string;
  } | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  const [checkoutData, setCheckoutData] = useState({
    receiverName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "",
    receiverPhone: user?.phoneNumber || "",
    receiverEmail: user?.email || "",
    detailedAddress: "",
    wardCode: undefined as number | undefined,
    provinceCode: undefined as number | undefined,
    notes: ""
  });

  const [provinces, setProvinces] = useState<Array<{ code: number; name: string }>>([]);
  const [wards, setWards] = useState<Array<{ code: number; name: string }>>([]);
  const [selectedProvince, setSelectedProvince] = useState<number | undefined>(undefined);
  const [provincesLoading, setProvincesLoading] = useState(false);
  const [wardsLoading, setWardsLoading] = useState(false);

  useEffect(() => {
    // Check authentication
    if (!user) {
      toast({
        variant: "destructive",
        title: "Vui lòng đăng nhập",
        description: "Bạn cần đăng nhập để thanh toán",
      });
      navigate("/login?redirect=/checkout");
      return;
    }

    loadData();
  }, [user, searchParams]);

  // Setup SignalR to listen for payment success
  useEffect(() => {
    if (!showQRDialog || !orderNumber) return;

    const connection = new HubConnectionBuilder()
      .withUrl(`${getApiBase()}/hubs/payment`, { withCredentials: true })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Error)
      .build();

    const start = async () => {
      try {
        await connection.start();
        await connection.invoke("JoinPaymentGroup", orderNumber);
      } catch (err) {
        console.error("SignalR connection error:", err);
      }
    };

    connection.on("PaymentSuccess", (data) => {
      // Check if this is for an order (not booking)
      if (data?.type === "order" || data?.orderNumber) {
        const finalOrderNumber = data.orderNumber || orderNumber;
        navigate(`/payment-success?orderNumber=${encodeURIComponent(finalOrderNumber)}&type=order`);
      } else if (data?.bookingNumber) {
        // Fallback to booking redirect (shouldn't happen for orders, but just in case)
        navigate(`/payment-success?bookingNumber=${encodeURIComponent(data.bookingNumber)}`);
      }
    });

    start();

    return () => {
      if (connection.state === HubConnectionState.Connected) {
        try {
          connection.invoke("LeavePaymentGroup", orderNumber);
        } catch {}
        connection.stop();
      }
    };
  }, [showQRDialog, orderNumber, navigate]);

  // Load provinces
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setProvincesLoading(true);
        const data = await httpJson<any[]>(`${getApiBase()}/api/divisions/provinces`, { skipAuth: true });
        const provincesData = (data || []).filter((d: any) => (d.parentCode ?? d.ParentCode) == null);
        setProvinces(provincesData.map((d: any) => ({ code: d.code ?? d.Code, name: d.name ?? d.Name })));
      } catch (error) {
        console.error("Failed to load provinces:", error);
      } finally {
        setProvincesLoading(false);
      }
    };
    loadProvinces();
  }, []);

  // Load wards when province is selected
  useEffect(() => {
    const loadWardsByProvince = async (provinceCode: number) => {
      try {
        setWardsLoading(true);
        const url = `${getApiBase()}/api/divisions/wards-by-province/${provinceCode}`;
        const data = await httpJson<any[]>(url, { skipAuth: true });
        setWards((data || []).map((d: any) => ({ code: d.code ?? d.Code, name: d.name ?? d.Name })));
      } catch (error) {
        console.error("Failed to load wards:", error);
        setWards([]);
      } finally {
        setWardsLoading(false);
      }
    };
    
    if (selectedProvince) {
      loadWardsByProvince(selectedProvince);
    } else {
      setWards([]);
      setCheckoutData(prev => ({ ...prev, wardCode: undefined }));
    }
  }, [selectedProvince]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const orderNumber = searchParams.get("order");
      
             // If order parameter exists, load order data instead of cart
       if (orderNumber) {
         // Ensure provinces are loaded first (for address parsing)
         let provincesList = provinces;
         if (provincesList.length === 0) {
           try {
             const provincesData = await httpJson<any[]>(`${getApiBase()}/api/divisions/provinces`, { skipAuth: true });
             const filteredProvinces = (provincesData || []).filter((d: any) => (d.parentCode ?? d.ParentCode) == null);
             provincesList = filteredProvinces.map((d: any) => ({ code: d.code ?? d.Code, name: d.name ?? d.Name }));
             setProvinces(provincesList);
           } catch (error) {
             console.error("Failed to load provinces:", error);
           }
         }
         
         const [orderData, bankingData] = await Promise.all([
           httpJson<OrderDto>(`${getApiBase()}/api/orders/${orderNumber}`),
           httpJson<{ account: string; bankName: string; qrCodeUrl: string }>(`${getApiBase()}/api/payment/admin-banking`, { skipAuth: true })
         ]);

         // Check if order can be paid (must be PendingPayment)
         if (orderData.status !== "PendingPayment" || orderData.paymentStatus !== "Pending") {
           toast({
             variant: "destructive",
             title: "Không thể thanh toán",
             description: "Đơn hàng này không thể thanh toán hoặc đã được thanh toán rồi",
           });
           navigate("/profile");
           return;
         }

        // Convert order items to cart items format
        const cartItems: CartItem[] = (orderData.items || []).map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          quantity: item.quantity,
          price: item.price,
          currency: orderData.currency || "VND",
          subtotal: item.subtotal,
          selectedVariant: item.selectedVariant,
          isAvailable: true,
          availableStock: item.quantity,
          tourTitle: item.tourTitle,
          tourId: item.tourId || "",
          tourGuideName: item.tourGuideName
        }));

        setCart({
          items: cartItems,
          totalItems: cartItems.length,
          totalAmount: orderData.totalAmount,
          currency: orderData.currency || "VND"
        });
                 setAdminBanking(bankingData);
         
         // Parse shipping address (format: "địa chỉ chi tiết, phường/xã, tỉnh/thành phố")
         let detailedAddress = orderData.shippingAddress || "";
         let wardCode: number | undefined = undefined;
         let provinceCode: number | undefined = undefined;
         
         if (orderData.shippingAddress) {
           // Split by comma
           const addressParts = orderData.shippingAddress.split(',').map(part => part.trim()).filter(Boolean);
           
           if (addressParts.length >= 3) {
             // Format: "địa chỉ chi tiết, phường/xã, tỉnh/thành phố"
             detailedAddress = addressParts[0];
             const wardName = addressParts[1];
             const provinceName = addressParts[2];
             
                           // Find province by name (check both exact match and partial match)
              const foundProvince = provincesList.find(p => 
                p.name === provinceName || 
                p.name.includes(provinceName) || 
                provinceName.includes(p.name)
              );
             
             if (foundProvince) {
               provinceCode = foundProvince.code;
               setSelectedProvince(foundProvince.code);
               
               // Load wards for this province, then find ward
               try {
                 const wardsData = await httpJson<any[]>(`${getApiBase()}/api/divisions/wards-by-province/${foundProvince.code}`, { skipAuth: true });
                 const wardsList = (wardsData || []).map((d: any) => ({ code: d.code ?? d.Code, name: d.name ?? d.Name }));
                 setWards(wardsList);
                 
                 // Find ward by name
                 const foundWard = wardsList.find(w => 
                   w.name === wardName || 
                   w.name.includes(wardName) || 
                   wardName.includes(w.name)
                 );
                 
                 if (foundWard) {
                   wardCode = foundWard.code;
                 }
               } catch (error) {
                 console.error("Failed to load wards:", error);
               }
             }
           } else if (addressParts.length === 2) {
             // Format: "địa chỉ chi tiết, phường/xã" or "địa chỉ chi tiết, tỉnh/thành phố"
             detailedAddress = addressParts[0];
             // Try to match as province first, then as ward
             const secondPart = addressParts[1];
             const foundProvince = provincesList.find(p => 
               p.name === secondPart || 
               p.name.includes(secondPart) || 
               secondPart.includes(p.name)
             );
             
             if (foundProvince) {
               provinceCode = foundProvince.code;
               setSelectedProvince(foundProvince.code);
             }
           } else if (addressParts.length === 1) {
             detailedAddress = addressParts[0];
           }
         }
         
         // Pre-fill checkout data from order
         setCheckoutData({
           receiverName: orderData.receiverName || "",
           receiverPhone: orderData.receiverPhone || "",
           receiverEmail: orderData.receiverEmail || "",
           detailedAddress: detailedAddress,
           wardCode: wardCode,
           provinceCode: provinceCode,
           notes: orderData.notes || ""
         });
         
         setOrderNumber(orderNumber);
         return;
      }

      // Otherwise, load cart data as usual
      const [cartData, bankingData] = await Promise.all([
        httpJson<CartSummary>(`${getApiBase()}/api/shoppingcart`),
        httpJson<{ account: string; bankName: string; qrCodeUrl: string }>(`${getApiBase()}/api/payment/admin-banking`, { skipAuth: true })
      ]);

      // Filter only available items
      const availableItems = cartData.items.filter(item => item.isAvailable);
      
      if (availableItems.length === 0) {
        toast({
          variant: "destructive",
          title: "Giỏ hàng trống",
          description: "Không có sản phẩm nào có thể thanh toán",
        });
        navigate("/cart");
        return;
      }

      setCart({
        ...cartData,
        items: availableItems,
        totalItems: availableItems.length,
        totalAmount: availableItems.reduce((sum, item) => sum + item.subtotal, 0)
      });
      setAdminBanking(bankingData);
    } catch (error: any) {
      console.error("Error loading checkout data:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể tải thông tin thanh toán",
      });
      navigate("/cart");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | undefined) => {
    setCheckoutData(prev => ({ ...prev, [field]: value }));
  };

  const handleProvinceChange = (provinceCode: string) => {
    const code = provinceCode === "none" ? undefined : Number(provinceCode);
    setSelectedProvince(code);
    setCheckoutData(prev => ({ ...prev, provinceCode: code, wardCode: undefined }));
  };

  const handleWardChange = (wardCode: string) => {
    const code = wardCode === "none" ? undefined : Number(wardCode);
    setCheckoutData(prev => ({ ...prev, wardCode: code }));
  };

  const validateForm = (): boolean => {
    if (!checkoutData.receiverName.trim()) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description: "Vui lòng nhập tên người nhận",
      });
      return false;
    }

    if (!checkoutData.receiverPhone.trim()) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description: "Vui lòng nhập số điện thoại",
      });
      return false;
    }

    if (!checkoutData.receiverEmail.trim()) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description: "Vui lòng nhập email",
      });
      return false;
    }

    if (!checkoutData.detailedAddress.trim()) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description: "Vui lòng nhập địa chỉ chi tiết",
      });
      return false;
    }

    if (!checkoutData.provinceCode) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description: "Vui lòng chọn tỉnh/thành phố",
      });
      return false;
    }

    if (!checkoutData.wardCode) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description: "Vui lòng chọn phường/xã",
      });
      return false;
    }

    return true;
  };

  const handleCheckout = () => {
    // Always validate form (even for existing orders, user might have changed info)
    if (!validateForm()) return;
    setShowConfirmDialog(true);
  };

  const handleConfirmCheckout = async () => {
    setShowConfirmDialog(false);
    setIsProcessing(true);

    try {
      const existingOrderNumber = searchParams.get("order");
      
      // Build shipping address by joining detailed address, ward, and province with commas
      const wardName = wards.find(w => w.code === checkoutData.wardCode)?.name || "";
      const provinceName = provinces.find(p => p.code === checkoutData.provinceCode)?.name || "";
      const addressParts = [
        checkoutData.detailedAddress,
        wardName,
        provinceName
      ].filter(Boolean);
      const shippingAddress = addressParts.join(", ");

      const orderData = {
        receiverName: checkoutData.receiverName,
        receiverPhone: checkoutData.receiverPhone,
        receiverEmail: checkoutData.receiverEmail,
        shippingAddress: shippingAddress,
        notes: checkoutData.notes,
      };

      let response: { orderId: string; orderNumber: string; totalAmount: number; currency?: string };

      // If updating existing order, use PUT API
      if (existingOrderNumber && cart) {
        response = await httpJson<{
          orderId: string;
          orderNumber: string;
          totalAmount: number;
          currency?: string;
        }>(`${getApiBase()}/api/orders/${existingOrderNumber}`, {
          method: "PUT",
          body: JSON.stringify(orderData),
        });
        
        toast({
          title: "Cập nhật đơn hàng thành công",
          description: `Đã cập nhật thông tin đơn hàng ${existingOrderNumber}`,
        });
      } else {
        // Otherwise, create new order from cart
        response = await httpJson<{
          orderId: string;
          orderNumber: string;
          totalAmount: number;
          currency?: string;
        }>(`${getApiBase()}/api/orders`, {
          method: "POST",
          body: JSON.stringify(orderData),
        });
        
        toast({
          title: "Đặt hàng thành công",
          description: `Mã đơn hàng: ${response.orderNumber}`,
        });
      }

      setOrderId(response.orderId);
      setOrderNumber(response.orderNumber || existingOrderNumber || "");
      
      // Generate QR code URL with amount and description
      if (adminBanking?.qrCodeUrl && cart) {
        let qrUrl = adminBanking.qrCodeUrl;
        // Replace or add amount parameter
        if (qrUrl.includes('amount=')) {
          qrUrl = qrUrl.replace(/amount=[^&]*/, `amount=${cart.totalAmount}`);
        } else {
          qrUrl += (qrUrl.includes('?') ? '&' : '?') + `amount=${cart.totalAmount}`;
        }
        // Replace or add des parameter (description)
        const finalOrderNumber = response.orderNumber || existingOrderNumber || "";
        if (qrUrl.includes('des=')) {
          qrUrl = qrUrl.replace(/des=[^&]*/, `des=${encodeURIComponent(finalOrderNumber)}`);
        } else {
          qrUrl += (qrUrl.includes('?') ? '&' : '?') + `des=${encodeURIComponent(finalOrderNumber)}`;
        }
        setQrCodeUrl(qrUrl);
      }

      // Show QR code dialog
      setShowQRDialog(true);
    } catch (error: any) {
      console.error("Error processing order:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || (searchParams.get("order") ? "Không thể cập nhật đơn hàng. Vui lòng thử lại" : "Không thể tạo đơn hàng. Vui lòng thử lại"),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: "Đã sao chép",
        description: `Đã sao chép ${field}`,
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const getVariantDisplay = (item: CartItem): string => {
    if (!item.selectedVariant) return "";
    try {
      const variant: ProductVariant = JSON.parse(item.selectedVariant);
      return `${variant.netAmount}${variant.netUnit}`;
    } catch {
      return "";
    }
  };

  const formatPrice = (price: number, currency: string = "VND") => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency === 'VND' ? 'VND' : currency,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tour-blue mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải thông tin...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!cart) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Không có sản phẩm để thanh toán</h1>
            <Button onClick={() => navigate("/products")}>
              Quay lại mua sắm
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => {
            const existingOrder = searchParams.get("order");
            if (existingOrder) {
              navigate("/profile");
            } else {
              navigate("/cart");
            }
          }}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {searchParams.get("order") ? "Quay lại trang cá nhân" : "Quay lại giỏ hàng"}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Thông tin người nhận
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="receiverName">Họ và tên *</Label>
                  <Input
                    id="receiverName"
                    value={checkoutData.receiverName}
                    onChange={(e) => handleInputChange("receiverName", e.target.value)}
                    placeholder="Nhập họ và tên"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="receiverPhone">Số điện thoại *</Label>
                    <Input
                      id="receiverPhone"
                      value={checkoutData.receiverPhone}
                      onChange={(e) => handleInputChange("receiverPhone", e.target.value)}
                      placeholder="+84"
                    />
                  </div>
                  <div>
                    <Label htmlFor="receiverEmail">Email *</Label>
                    <Input
                      id="receiverEmail"
                      type="email"
                      value={checkoutData.receiverEmail}
                      onChange={(e) => handleInputChange("receiverEmail", e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Địa chỉ giao hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="provinceCode">Tỉnh/Thành phố *</Label>
                    <Select
                      value={checkoutData.provinceCode?.toString() || "none"}
                      onValueChange={handleProvinceChange}
                      disabled={provincesLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={provincesLoading ? "Đang tải..." : "Chọn tỉnh/thành phố"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Chọn tỉnh/thành phố</SelectItem>
                        {provinces.map((province) => (
                          <SelectItem key={province.code} value={province.code.toString()}>
                            {province.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="wardCode">Phường/Xã *</Label>
                    <Select
                      value={checkoutData.wardCode?.toString() || "none"}
                      onValueChange={handleWardChange}
                      disabled={!selectedProvince || wardsLoading}
                    >
                      <SelectTrigger>
                        <SelectValue 
                          placeholder={
                            !selectedProvince 
                              ? "Chọn tỉnh/thành phố trước" 
                              : wardsLoading 
                              ? "Đang tải..." 
                              : "Chọn phường/xã"
                          } 
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Chọn phường/xã</SelectItem>
                        {wards.map((ward) => (
                          <SelectItem key={ward.code} value={ward.code.toString()}>
                            {ward.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="detailedAddress">Địa chỉ chi tiết *</Label>
                  <Input
                    id="detailedAddress"
                    value={checkoutData.detailedAddress}
                    onChange={(e) => handleInputChange("detailedAddress", e.target.value)}
                    placeholder="Số nhà, tên đường..."
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Ghi chú (tùy chọn)</Label>
                  <Input
                    id="notes"
                    value={checkoutData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Yêu cầu đặc biệt, thời gian giao hàng..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Đơn hàng của bạn</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Products List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {cart.items.map((item) => {
                    const variantDisplay = getVariantDisplay(item);
                    return (
                      <div key={item.id} className="flex gap-3 pb-3 border-b">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm line-clamp-2">{item.productName}</h4>
                          {variantDisplay && (
                            <p className="text-xs text-gray-500">Phân loại: {variantDisplay}</p>
                          )}
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-sm text-gray-600">x{item.quantity}</span>
                            <span className="text-sm font-semibold text-tour-blue">
                              {formatPrice(item.subtotal, item.currency)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Separator />

                {/* Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tạm tính:</span>
                    <span className="font-semibold">{formatPrice(cart.totalAmount, cart.currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Phí vận chuyển:</span>
                    <span className="text-green-600 font-semibold">Miễn phí</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Tổng cộng:</span>
                    <span className="text-tour-blue">{formatPrice(cart.totalAmount, cart.currency)}</span>
                  </div>
                </div>

                                 {/* Checkout Button */}
                 <Button
                   className="w-full"
                   size="lg"
                   onClick={handleCheckout}
                   disabled={isProcessing}
                 >
                   <CreditCard className="w-5 h-5 mr-2" />
                   {isProcessing ? "Đang xử lý..." : searchParams.get("order") ? "Thanh toán" : "Đặt hàng"}
                 </Button>

                <p className="text-xs text-center text-gray-500">
                  Bằng cách đặt hàng, bạn đồng ý với các điều khoản và điều kiện của chúng tôi
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

             {/* Confirm Dialog */}
       <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>
               {searchParams.get("order") ? "Xác nhận thanh toán" : "Xác nhận đặt hàng"}
             </AlertDialogTitle>
             <AlertDialogDescription className="space-y-2">
               {searchParams.get("order") ? (
                 <>
                   <p>Bạn có chắc chắn muốn thanh toán đơn hàng {searchParams.get("order")} với tổng giá trị {formatPrice(cart.totalAmount, cart.currency)}?</p>
                   <p className="text-sm">
                     <strong>Người nhận:</strong> {checkoutData.receiverName}
                   </p>
                   <p className="text-sm">
                     <strong>Địa chỉ:</strong> {(() => {
                       const wardName = wards.find(w => w.code === checkoutData.wardCode)?.name || "";
                       const provinceName = provinces.find(p => p.code === checkoutData.provinceCode)?.name || "";
                       const addressParts = [
                         checkoutData.detailedAddress,
                         wardName,
                         provinceName
                       ].filter(Boolean);
                       return addressParts.join(", ");
                     })()}
                   </p>
                 </>
               ) : (
                 <>
                   <p>Bạn có chắc chắn muốn đặt {cart.totalItems} sản phẩm với tổng giá trị {formatPrice(cart.totalAmount, cart.currency)}?</p>
                   <p className="text-sm">
                     <strong>Người nhận:</strong> {checkoutData.receiverName}
                   </p>
                   <p className="text-sm">
                     <strong>Địa chỉ:</strong> {(() => {
                       const wardName = wards.find(w => w.code === checkoutData.wardCode)?.name || "";
                       const provinceName = provinces.find(p => p.code === checkoutData.provinceCode)?.name || "";
                       const addressParts = [
                         checkoutData.detailedAddress,
                         wardName,
                         provinceName
                       ].filter(Boolean);
                       return addressParts.join(", ");
                     })()}
                   </p>
                 </>
               )}
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel disabled={isProcessing}>Hủy</AlertDialogCancel>
             <AlertDialogAction onClick={handleConfirmCheckout} disabled={isProcessing}>
               {isProcessing ? "Đang xử lý..." : "Xác nhận"}
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>

      {/* Payment QR Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Thanh toán đơn hàng</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Order Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800 mb-2">
                ✓ Đơn hàng đã được tạo thành công!
              </p>
              <div className="space-y-1">
                <p className="text-sm">
                  <strong>Mã đơn hàng:</strong> {orderNumber}
                </p>
                <p className="text-sm">
                  <strong>Tổng tiền:</strong> {formatPrice(cart.totalAmount, cart.currency)}
                </p>
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* QR Code */}
              <div className="text-center">
                <h3 className="font-semibold mb-3">Quét mã QR để thanh toán</h3>
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="w-64 h-64 mx-auto border rounded-lg"
                  />
                ) : adminBanking?.qrCodeUrl ? (
                  <img
                    src={adminBanking.qrCodeUrl}
                    alt="QR Code"
                    className="w-64 h-64 mx-auto border rounded-lg"
                  />
                ) : (
                  <div className="w-64 h-64 mx-auto border rounded-lg flex items-center justify-center bg-gray-100">
                    <p className="text-gray-500">QR Code không khả dụng</p>
                  </div>
                )}
              </div>

              {/* Bank Info */}
              <div>
                <h3 className="font-semibold mb-3">Hoặc chuyển khoản thủ công</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600">Ngân hàng</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input value={adminBanking?.bankName || ""} readOnly />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(adminBanking?.bankName || "", "Tên ngân hàng")}
                      >
                        {copiedField === "Tên ngân hàng" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Số tài khoản</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input value={adminBanking?.account || ""} readOnly />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(adminBanking?.account || "", "Số tài khoản")}
                      >
                        {copiedField === "Số tài khoản" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Số tiền</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input value={formatPrice(cart.totalAmount, cart.currency)} readOnly />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(cart.totalAmount.toString(), "Số tiền")}
                      >
                        {copiedField === "Số tiền" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Nội dung chuyển khoản</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input value={orderNumber} readOnly />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(orderNumber, "Mã đơn hàng")}
                      >
                        {copiedField === "Mã đơn hàng" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-semibold mb-2">Lưu ý quan trọng:</p>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Vui lòng chuyển khoản <strong>chính xác số tiền</strong> và <strong>ghi đúng nội dung</strong> để đơn hàng được xác nhận tự động</li>
                <li>Đơn hàng sẽ được xử lý sau khi nhận được thanh toán</li>
                <li>Thời gian giao hàng: 3-5 ngày làm việc</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/products")}
              >
                Tiếp tục mua sắm
              </Button>
              <Button
                className="flex-1"
                onClick={() => navigate("/profile")}
              >
                Xem đơn hàng
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
};

export default ProductCheckout;

