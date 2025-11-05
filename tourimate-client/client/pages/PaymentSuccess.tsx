import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Calendar, MapPin, Users, Download, ArrowLeft, Mail, Phone } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5125";

interface Booking {
  id: string;
  bookingNumber: string;
  tour: {
    title: string;
    location: string;
  };
  tourAvailability: {
    date: string;
  };
  adultCount: number;
  childCount: number;
  totalAmount: number;
  paymentStatus: string;
  status: string;
  contactInfo: string;
}

interface Order {
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
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    productImage?: string;
    quantity: number;
    price: number;
    subtotal: number;
    selectedVariant?: string;
  }>;
}

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingNumber = searchParams.get("bookingNumber");
  const orderNumber = searchParams.get("orderNumber");
  const type = searchParams.get("type"); // "order" or undefined (booking)

  const [booking, setBooking] = useState<Booking | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (type === "order") {
      if (!orderNumber) {
        navigate("/");
        return;
      }
      fetchOrderDetails();
    } else {
      if (!bookingNumber) {
        navigate("/");
        return;
      }
      fetchBookingDetails();
    }
  }, [bookingNumber, orderNumber, type, navigate]);

  const fetchBookingDetails = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/bookings/${encodeURIComponent(bookingNumber!)}`);
      if (response.ok) {
        const data = await response.json();
        setBooking(data);
      }
    } catch (error) {
      console.error("Error fetching booking:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(orderNumber!)}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      }
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  };

  const getContactInfo = () => {
    try {
      if (booking?.contactInfo) {
        return JSON.parse(booking.contactInfo);
      }
    } catch {
      return null;
    }
    return null;
  };

  const contactInfo = getContactInfo();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (type === "order" && !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Không tìm thấy thông tin đơn hàng</p>
          <Button onClick={() => navigate("/")}>Về trang chủ</Button>
        </div>
      </div>
    );
  }

  if (type !== "order" && !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Không tìm thấy thông tin đặt tour</p>
          <Button onClick={() => navigate("/")}>Về trang chủ</Button>
        </div>
      </div>
    );
  }

  // Render order success page
  if (type === "order" && order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <Header />
        <div className="py-12 px-4">
          <div className="max-w-3xl mx-auto">
            {/* Success Header */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-green-100 rounded-full p-4">
                    <CheckCircle2 className="w-20 h-20 text-green-600" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Đặt hàng thành công!
                </h1>
                <p className="text-gray-600 mb-4">
                  Cảm ơn bạn đã thanh toán. Thông tin đơn hàng đã được gửi đến email của bạn.
                </p>
                <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg">
                  <span className="font-semibold">Mã đơn hàng:</span>
                  <span className="font-mono text-lg">{order.orderNumber}</span>
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Thông tin đơn hàng</h2>

              <div className="space-y-4">
                {/* Order Items */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Sản phẩm đã đặt</h3>
                  <div className="space-y-3">
                    {order.items.map((item) => {
                      const variant = item.selectedVariant ? (() => {
                        try {
                          const v = JSON.parse(item.selectedVariant);
                          return `${v.netAmount}${v.netUnit}`;
                        } catch {
                          return null;
                        }
                      })() : null;

                      return (
                        <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                          <img
                            src={item.productImage || "/placeholder.svg"}
                            alt={item.productName}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{item.productName}</p>
                            {variant && (
                              <p className="text-sm text-gray-600">Phân loại: {variant}</p>
                            )}
                            <p className="text-sm text-gray-600">
                              Số lượng: {item.quantity} × {item.price.toLocaleString()} ₫
                            </p>
                            <p className="font-semibold text-gray-900 mt-1">
                              {item.subtotal.toLocaleString()} ₫
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Receiver Info */}
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Thông tin người nhận</h3>
                  <div className="space-y-2">
                    <div className="flex gap-3">
                      <Users className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Họ tên</p>
                        <p className="font-semibold text-gray-900">{order.receiverName}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Phone className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Số điện thoại</p>
                        <p className="font-semibold text-gray-900">{order.receiverPhone}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Mail className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-semibold text-gray-900">{order.receiverEmail}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Địa chỉ giao hàng</p>
                        <p className="font-semibold text-gray-900">{order.shippingAddress}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Amount */}
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Tổng thanh toán</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {order.totalAmount.toLocaleString()} ₫
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 rounded-2xl p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Bước tiếp theo</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Chúng tôi đã gửi email xác nhận đến {order.receiverEmail}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Đơn hàng sẽ được xử lý và giao hàng trong vòng 3-5 ngày làm việc</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Bạn có thể theo dõi trạng thái đơn hàng trong phần "Sản phẩm đã đặt"</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => navigate("/profile?tab=products")}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Xem đơn hàng của tôi
              </Button>
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Về trang chủ
              </Button>
            </div>

            {/* Support */}
            <div className="text-center mt-8 text-sm text-gray-600">
              <p>Cần hỗ trợ? Liên hệ: <span className="font-semibold">support@tourimate.site</span></p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Render booking success page (existing code)
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Header />
      <div className="py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 rounded-full p-4">
                <CheckCircle2 className="w-20 h-20 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Đặt tour thành công!
            </h1>
            <p className="text-gray-600 mb-4">
              Cảm ơn bạn đã thanh toán. Thông tin đặt tour đã được gửi đến email của bạn.
            </p>
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg">
              <span className="font-semibold">Mã đặt tour:</span>
              <span className="font-mono text-lg">{booking.bookingNumber}</span>
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Thông tin đặt tour</h2>

          <div className="space-y-4">
            {/* Tour Info */}
            <div className="flex gap-3">
              <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">{booking.tour.title}</p>
                <p className="text-sm text-gray-600">{booking.tour.location}</p>
              </div>
            </div>

            {/* Date */}
            <div className="flex gap-3">
              <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Ngày khởi hành</p>
                <p className="font-semibold text-gray-900">
                  {new Date(booking.tourAvailability.date).toLocaleDateString("vi-VN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Participants */}
            <div className="flex gap-3">
              <Users className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Số lượng khách</p>
                <p className="font-semibold text-gray-900">
                  {booking.adultCount} người lớn
                  {booking.childCount > 0 && `, ${booking.childCount} trẻ em`}
                </p>
              </div>
            </div>

            {/* Contact Info */}
            {contactInfo && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Thông tin liên hệ</p>
                <div className="space-y-1">
                  <p className="text-gray-900">
                    <span className="font-semibold">Họ tên:</span> {contactInfo.Name}
                  </p>
                  <p className="text-gray-900">
                    <span className="font-semibold">Email:</span> {contactInfo.Email}
                  </p>
                  <p className="text-gray-900">
                    <span className="font-semibold">Số điện thoại:</span> {contactInfo.Phone || contactInfo.PhoneNumber}
                  </p>
                </div>
              </div>
            )}

            {/* Total Amount */}
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Tổng thanh toán</span>
                <span className="text-2xl font-bold text-blue-600">
                  {booking.totalAmount.toLocaleString()} ₫
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 rounded-2xl p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Bước tiếp theo</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>Chúng tôi đã gửi email xác nhận đến {contactInfo?.Email}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>Hướng dẫn viên sẽ liên hệ với bạn trước ngày khởi hành 1-2 ngày</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>Bạn có thể xem chi tiết đặt tour trong phần "Đơn đặt tour của tôi"</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => navigate("/profile?tab=tours")}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Xem đơn đặt tour của tôi
          </Button>
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Về trang chủ
          </Button>
        </div>

        {/* Support */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>Cần hỗ trợ? Liên hệ: <span className="font-semibold">support@tourimate.site</span></p>
        </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

