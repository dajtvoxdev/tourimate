import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { getApiBase } from "@/src/lib/http";

interface AdminBankingInfo {
  account: string;
  bankName: string;
  qrCodeUrl: string;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingNumber: string;
  totalAmount: number;
  adminBanking: AdminBankingInfo | null;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5125";

export function PaymentDialog(props: PaymentDialogProps) {
  const { open, onOpenChange, bookingNumber, totalAmount, adminBanking } = props;
  const navigate = useNavigate();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Setup SignalR to listen payment success
  useEffect(() => {
    if (!open || !bookingNumber) return;

    const connection = new HubConnectionBuilder()
      .withUrl(`${API_BASE}/hubs/payment`, { withCredentials: true })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Error)
      .build();

    const start = async () => {
      try {
        await connection.start();
        await connection.invoke("JoinPaymentGroup", bookingNumber);
      } catch {}
    };

    connection.on("PaymentSuccess", (data) => {
      const nextBookingNumber = data?.bookingNumber ?? bookingNumber;
      navigate(`/payment-success?bookingNumber=${encodeURIComponent(nextBookingNumber)}`);
    });

    start();

    return () => {
      if (connection.state === HubConnectionState.Connected) {
        try { connection.invoke("LeavePaymentGroup", bookingNumber); } catch {}
        connection.stop();
      }
    };
  }, [open, bookingNumber, navigate]);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Thanh toán</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Left Side - QR Code */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="text-center bg-blue-50 p-4 rounded-lg w-full">
                <p className="text-sm text-gray-600 mb-2">
                  Mã đặt tour: <span className="font-mono font-semibold">{bookingNumber}</span>
                </p>
                <p className="text-lg font-semibold text-blue-600">
                  Số tiền: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
                </p>
              </div>

              <div className="flex justify-center">
                <img
                  src={`${getApiBase()}/api/payment/qr-code?amount=${totalAmount}&des=${encodeURIComponent(bookingNumber)}`}
                  alt="QR Code thanh toán"
                  className="w-64 h-64 border rounded-lg shadow-lg"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
                    (e.currentTarget as HTMLImageElement).alt = "Không thể tải QR code";
                  }}
                />
              </div>

              <p className="text-sm text-gray-500 text-center">
                Quét mã QR để thanh toán nhanh chóng
              </p>
            </div>

            {/* Right Side - Payment Information */}
            <div className="space-y-6">
              {adminBanking && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Thông tin chuyển khoản thủ công</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Số tài khoản:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">{adminBanking.account}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(adminBanking.account, "account")}
                          className="h-8 w-8 p-0"
                        >
                          {copiedField === "account" ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Tên ngân hàng:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{adminBanking.bankName}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(adminBanking.bankName, "bank")}
                          className="h-8 w-8 p-0"
                        >
                          {copiedField === "bank" ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Số tiền:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-blue-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(totalAmount.toString(), "amount")}
                          className="h-8 w-8 p-0"
                        >
                          {copiedField === "amount" ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Nội dung:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{bookingNumber}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(bookingNumber, "content")}
                          className="h-8 w-8 p-0"
                        >
                          {copiedField === "content" ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Chính sách thanh toán</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>• Thanh toán 100% giá trị tour trước khi khởi hành</p>
                  <p>• Sau khi chuyển khoản, vui lòng giữ lại biên lai giao dịch</p>
                  <p>• Hệ thống sẽ tự động xác nhận thanh toán khi nhận được giao dịch hợp lệ</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Auto-redirect on success via SignalR */}
      </DialogContent>
    </Dialog>
  );
}
