import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Calendar, MapPin, Users, Download, ArrowLeft } from "lucide-react";
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

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingNumber = searchParams.get("bookingNumber");
  const bookingId = searchParams.get("bookingId");

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingNumber || !bookingId) {
      navigate("/");
      return;
    }

    fetchBookingDetails();
  }, [bookingNumber, bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/bookings/${bookingId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

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

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Không tìm thấy thông tin đặt tour</p>
          <Button onClick={() => navigate("/")}>Về trang chủ</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
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
                    <span className="font-semibold">Số điện thoại:</span> {contactInfo.PhoneNumber}
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
            onClick={() => navigate("/profile")}
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
  );
}

