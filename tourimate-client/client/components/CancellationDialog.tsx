import React, { useState, useEffect } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SearchableSelect } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { httpJson, getApiBase } from "@/src/lib/http";
import { toast } from "sonner";
import { Info, AlertTriangle, Clock, DollarSign } from "lucide-react";

interface BankInfo {
  name: string;
  code: string;
  shortName: string;
  bin: string;
}

interface RefundCalculation {
  canRefund: boolean;
  daysBeforeTour: number;
  refundPercentage: number;
  originalAmount: number;
  refundAmount: number;
  refundPolicy: string;
}

interface CancellationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  isPaid?: boolean;
  onCancelSuccess: () => void;
}

export function CancellationDialog({ open, onOpenChange, bookingId, isPaid = false, onCancelSuccess }: CancellationDialogProps) {
  const [cancellationReason, setCancellationReason] = useState("");
  const [refundBankName, setRefundBankName] = useState("");
  const [refundBankCode, setRefundBankCode] = useState(""); // shortName from API
  const [refundBankAccount, setRefundBankAccount] = useState("");
  const [refundAccountName, setRefundAccountName] = useState("");
  const [banks, setBanks] = useState<BankInfo[]>([]);
  const [refundCalculation, setRefundCalculation] = useState<RefundCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // Load banks data and user profile when dialog opens for paid bookings
  useEffect(() => {
    const loadBanksAndProfile = async () => {
      try {
        // Load banks
        const banksResponse = await httpJson<BankInfo[]>(`${getApiBase()}/api/banks`, { skipAuth: true });
        setBanks(banksResponse);

        // Load user profile to get bank info
        const profileResponse = await httpJson<any>(`${getApiBase()}/api/auth/me`);
        
        // Auto-fill bank info if user has configured it
        if (profileResponse.bankCode && profileResponse.bankAccount && profileResponse.bankAccountName) {
          setRefundBankCode(profileResponse.bankCode);
          setRefundBankName(profileResponse.bankName || "");
          setRefundBankAccount(profileResponse.bankAccount);
          setRefundAccountName(profileResponse.bankAccountName);
        }
      } catch (error) {
        console.error("Error loading banks and profile:", error);
        toast.error("Không thể tải thông tin ngân hàng");
      }
    };
    if (open && isPaid) {
      loadBanksAndProfile();
    }
  }, [open, isPaid]);

  // Calculate refund when reason changes - debounce and only when isPaid
  useEffect(() => {
    if (!isPaid) return;
    if (!cancellationReason.trim() || !bookingId) return;
    const t = setTimeout(() => {
      calculateRefund();
    }, 400);
    return () => clearTimeout(t);
  }, [cancellationReason, bookingId, isPaid]);

  const calculateRefund = async () => {
    try {
      setCalculating(true);
      const response = await httpJson<RefundCalculation>(
        `${getApiBase()}/api/bookings/${bookingId}/calculate-refund`,
        {
          method: "POST",
          body: JSON.stringify({ cancellationReason: cancellationReason || "" })
        }
      );
      setRefundCalculation(response);
    } catch (error) {
      console.error("Error calculating refund:", error);
      toast.error("Không thể tính toán hoàn tiền");
    } finally {
      setCalculating(false);
    }
  };

  // Pre-calculate refund on open for paid bookings
  useEffect(() => {
    if (open && isPaid && bookingId) {
      calculateRefund();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isPaid, bookingId]);

  const handleCancel = async () => {
    if (!cancellationReason.trim()) {
      toast.error("Vui lòng nhập lý do hủy tour");
      return;
    }

    // Validate refund info only when paid and refund is applicable
    if (isPaid && refundCalculation?.canRefund) {
      if (!refundBankName) {
        toast.error("Vui lòng chọn ngân hàng hoàn tiền");
        return;
      }
      if (!refundBankAccount.trim()) {
        toast.error("Vui lòng nhập số tài khoản");
        return;
      }
      if (!refundAccountName.trim()) {
        toast.error("Vui lòng nhập tên chủ tài khoản");
        return;
      }
    }

    try {
      setLoading(true);
      await httpJson(
        `${getApiBase()}/api/bookings/${bookingId}/cancel`,
        {
          method: "PUT",
          body: JSON.stringify({
            cancellationReason,
            refundBankCode: isPaid && refundCalculation?.canRefund ? refundBankCode : null,
            refundBankName: isPaid && refundCalculation?.canRefund ? refundBankName : null,
            refundBankAccount: isPaid && refundCalculation?.canRefund ? refundBankAccount : null,
            refundAccountName: isPaid && refundCalculation?.canRefund ? refundAccountName : null
          })
        }
      );

      toast.success("Hủy tour thành công");
      onCancelSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error("Error cancelling booking:", error);
      toast.error(error.message || "Không thể hủy tour. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCancellationReason("");
    setRefundBankName("");
    setRefundBankAccount("");
    setRefundAccountName("");
    setRefundCalculation(null);
  };

  const bankOptions = banks.map(bank => ({
    value: bank.shortName, // use shortName as the value (refundBankCode)
    label: `${bank.name} (${bank.shortName})`
  }));

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Hủy tour</AlertDialogTitle>
          <AlertDialogDescription>
            Vui lòng điền thông tin để hủy tour.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-6">
          {/* Cancellation Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Lý do hủy tour *</Label>
            <Textarea
              id="reason"
              placeholder="Vui lòng nhập lý do hủy tour..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Refund Calculation - show only when booking is paid */}
          {isPaid && calculating && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Đang tính toán hoàn tiền...</span>
            </div>
          )}

          {isPaid && refundCalculation && !calculating && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Thông tin hoàn tiền
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">Số ngày trước tour</Label>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">{refundCalculation.daysBeforeTour} ngày</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Tỷ lệ hoàn tiền</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant={refundCalculation.refundPercentage === 100 ? "default" : refundCalculation.refundPercentage === 50 ? "secondary" : "destructive"}>
                        {refundCalculation.refundPercentage}%
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">Số tiền gốc</Label>
                    <div className="font-medium">{refundCalculation.originalAmount.toLocaleString('vi-VN')} VND</div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Số tiền hoàn lại</Label>
                    <div className="font-medium text-green-600">
                      {refundCalculation.refundAmount.toLocaleString('vi-VN')} VND
                    </div>
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Chính sách:</strong> {refundCalculation.refundPolicy}
                  </AlertDescription>
                </Alert>

                {!refundCalculation.canRefund && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {refundCalculation.refundPolicy.includes("Chưa thanh toán") 
                        ? "Bạn chưa thanh toán cho tour này, không cần hoàn tiền."
                        : "Không thể hoàn tiền theo chính sách hiện tại."
                      }
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Refund Bank Information - show only when booking is paid and can refund */}
          {isPaid && refundCalculation?.canRefund && (
            <Card>
              <CardHeader>
                <CardTitle>Thông tin ngân hàng hoàn tiền</CardTitle>
                <CardDescription>
                  Vui lòng cung cấp thông tin ngân hàng để nhận hoàn tiền
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bank">Ngân hàng *</Label>
                  <SearchableSelect
                    value={refundBankCode}
                    onValueChange={(val) => {
                      setRefundBankCode(val);
                      const found = banks.find(b => b.shortName === val);
                      setRefundBankName(found?.name || "");
                    }}
                    placeholder="Chọn ngân hàng..."
                    searchPlaceholder="Tìm kiếm ngân hàng..."
                    options={bankOptions}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account">Số tài khoản *</Label>
                  <Input
                    id="account"
                    placeholder="Nhập số tài khoản..."
                    value={refundBankAccount}
                    onChange={(e) => setRefundBankAccount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountName">Tên chủ tài khoản *</Label>
                  <Input
                    id="accountName"
                    placeholder="Nhập tên chủ tài khoản..."
                    value={refundAccountName}
                    onChange={(e) => setRefundAccountName(e.target.value)}
                  />
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Vui lòng kiểm tra kỹ thông tin ngân hàng. Số tiền sẽ được chuyển khoản trong vòng 3-5 ngày làm việc.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={resetForm}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={loading || calculating}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? "Đang xử lý..." : "Xác nhận hủy tour"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

