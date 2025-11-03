import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "../components/ui/button";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5125";

export default function PaymentProcessing() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingNumber = searchParams.get("bookingNumber");
  const bookingId = searchParams.get("bookingId");

  const [paymentStatus, setPaymentStatus] = useState<"processing" | "success" | "timeout">("processing");
  const [paymentData, setPaymentData] = useState<any>(null);
  const [timeoutCountdown, setTimeoutCountdown] = useState(300); // 5 minutes timeout

  useEffect(() => {
    if (!bookingNumber || !bookingId) {
      navigate("/");
      return;
    }

    // Setup SignalR connection
    const connection = new HubConnectionBuilder()
      .withUrl(`${API_BASE}/hubs/payment`, {
        withCredentials: true,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    // Start connection
    const startConnection = async () => {
      try {
        await connection.start();
        console.log("SignalR Connected");

        // Join payment notification group
        await connection.invoke("JoinPaymentGroup", bookingNumber);
        console.log(`Joined payment group: payment_${bookingNumber}`);
      } catch (err) {
        console.error("SignalR Connection Error: ", err);
        setTimeout(startConnection, 5000); // Retry after 5 seconds
      }
    };

    // Listen for payment success
    connection.on("PaymentSuccess", (data) => {
      console.log("Payment success received:", data);
      setPaymentData(data);
      setPaymentStatus("success");

      // Auto redirect after 3 seconds
      setTimeout(() => {
        navigate(`/payment-success?bookingNumber=${data.bookingNumber}&bookingId=${data.bookingId}`);
      }, 3000);
    });

    startConnection();

    // Cleanup on unmount
    return () => {
      if (connection.state === HubConnectionState.Connected) {
        connection.invoke("LeavePaymentGroup", bookingNumber);
        connection.stop();
      }
    };
  }, [bookingNumber, bookingId, navigate]);

  // Countdown timer
  useEffect(() => {
    if (paymentStatus !== "processing") return;

    const timer = setInterval(() => {
      setTimeoutCountdown((prev) => {
        if (prev <= 1) {
          setPaymentStatus("timeout");
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentStatus]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCheckStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/bookings/${bookingId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const booking = await response.json();
        if (booking.paymentStatus === "Paid") {
          setPaymentStatus("success");
          setTimeout(() => {
            navigate(`/payment-success?bookingNumber=${bookingNumber}&bookingId=${bookingId}`);
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Error checking booking status:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full">
        {paymentStatus === "processing" && (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Loader2 className="w-20 h-20 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Đang xử lý thanh toán
            </h1>
            <p className="text-gray-600 mb-6">
              Vui lòng không đóng trang này. Chúng tôi đang chờ xác nhận thanh toán từ ngân hàng.
            </p>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-blue-700 mb-2">
                <Clock className="w-5 h-5" />
                <span className="font-mono text-lg font-semibold">
                  {formatTime(timeoutCountdown)}
                </span>
              </div>
              <p className="text-sm text-blue-600">
                Mã đặt tour: <span className="font-semibold">{bookingNumber}</span>
              </p>
            </div>

            <div className="space-y-3 text-sm text-gray-500">
              <p className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Quét mã QR và chuyển khoản từ ứng dụng ngân hàng</span>
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Nhập đúng nội dung chuyển khoản: {bookingNumber}</span>
              </p>
              <p className="flex items-start gap-2">
                <Loader2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0 animate-spin" />
                <span>Chờ xác nhận từ ngân hàng (1-3 phút)</span>
              </p>
            </div>

            <Button
              onClick={handleCheckStatus}
              variant="outline"
              className="mt-6 w-full"
            >
              Kiểm tra trạng thái thanh toán
            </Button>
          </div>
        )}

        {paymentStatus === "success" && (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 rounded-full p-4">
                <CheckCircle2 className="w-16 h-16 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Thanh toán thành công!
            </h1>
            <p className="text-gray-600 mb-4">
              Cảm ơn bạn đã thanh toán. Đang chuyển hướng...
            </p>
            {paymentData && (
              <div className="bg-green-50 rounded-lg p-4 text-sm">
                <p className="text-gray-700">
                  Mã đặt tour: <span className="font-semibold">{paymentData.bookingNumber}</span>
                </p>
                <p className="text-gray-700 mt-1">
                  Số tiền: <span className="font-semibold">{paymentData.amount?.toLocaleString()} {paymentData.currency}</span>
                </p>
              </div>
            )}
          </div>
        )}

        {paymentStatus === "timeout" && (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-yellow-100 rounded-full p-4">
                <XCircle className="w-16 h-16 text-yellow-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Quá thời gian chờ
            </h1>
            <p className="text-gray-600 mb-6">
              Chúng tôi chưa nhận được xác nhận thanh toán. Vui lòng kiểm tra lại hoặc liên hệ hỗ trợ.
            </p>

            <div className="space-y-3">
              <Button
                onClick={handleCheckStatus}
                className="w-full"
              >
                Kiểm tra lại trạng thái
              </Button>
              <Button
                onClick={() => navigate("/profile")}
                variant="outline"
                className="w-full"
              >
                Xem đơn đặt tour của tôi
              </Button>
              <Button
                onClick={() => navigate("/")}
                variant="ghost"
                className="w-full"
              >
                Về trang chủ
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

