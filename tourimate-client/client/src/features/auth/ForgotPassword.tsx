import { useForm } from "react-hook-form";
import { AuthApi, ForgotVerifyRequest } from "./api";
import { useEffect, useState } from "react";
import Header from "../../../components/Header";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LogIn } from "lucide-react";
import { toast } from "sonner";
import { setupRecaptcha, sendOTP, verifyOTP, getIdToken } from "../../lib/firebase";

type ForgotForm = { phoneNumberE164: string; code: string; newPassword: string; confirmPassword: string };

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { register, handleSubmit, watch } = useForm<ForgotForm>({
    defaultValues: { phoneNumberE164: "", code: "", newPassword: "", confirmPassword: "" },
  });
  const [sendingOtp, setSendingOtp] = useState(false);
  const [cooldown, setCooldown] = useState<number>(0);
  const COOLDOWN_SECONDS = 90;
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const phone = watch("phoneNumberE164");

  // Initialize reCAPTCHA
  useEffect(() => {
    try {
      setupRecaptcha();
    } catch (e) {
      console.error("Failed to setup reCAPTCHA:", e);
      toast.error("Không thể khởi tạo xác thực. Vui lòng tải lại trang.");
    }
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const onSendOtp = async () => {
    if (sendingOtp) return;
    if (!phone) {
      toast.error("Vui lòng nhập số điện thoại");
      return;
    }
    // Check existence in DB before sending SMS
    try {
      const { exists } = await AuthApi.checkPhoneExists(phone);
      if (!exists) {
        toast.error("Số điện thoại không tồn tại trong hệ thống.");
        return;
      }
    } catch (e: any) {
      toast.error(e.message || "Không thể kiểm tra số điện thoại");
      return;
    }
    setSendingOtp(true);
    try {
      const vId = await sendOTP(phone);
      setVerificationId(vId);
      toast.success("Đã gửi mã OTP. Vui lòng kiểm tra SMS.");
      setCooldown(COOLDOWN_SECONDS);
      // Cancel current reCAPTCHA session during cooldown
      const w = window as any;
      try { w.recaptchaVerifier?.clear(); w.recaptchaVerifier = null; } catch {}
    } catch (e: any) {
      toast.error(e.message || "Gửi OTP thất bại");
    } finally {
      setSendingOtp(false);
    }
  };

  const onSubmit = async (data: ForgotForm) => {
    // Client-side validations
    const pass = data.newPassword || "";
    const strong = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/; // >=8, letters+numbers, specials allowed
    if (!strong.test(pass)) {
      toast.error("Mật khẩu phải ít nhất 8 ký tự.");
      return;
    }
    if (data.newPassword !== data.confirmPassword) {
      toast.error("Mật khẩu nhập lại không khớp.");
      return;
    }
    if (!verificationId) {
      toast.error("Vui lòng gửi mã OTP trước.");
      return;
    }
    if (!data.code || data.code.length < 6) {
      toast.error("Vui lòng nhập mã OTP đầy đủ (6 chữ số).");
      return;
    }

    setLoading(true);
    try {
      // Verify OTP with Firebase
      try {
        await verifyOTP(verificationId, data.code);
      } catch (otpErr: any) {
        const msg = otpErr?.code === 'auth/invalid-verification-code'
          ? 'Mã OTP không đúng. Vui lòng kiểm tra và thử lại.'
          : otpErr?.code === 'auth/code-expired'
          ? 'Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.'
          : 'Xác minh OTP thất bại. Vui lòng thử lại.';
        toast.error(msg);
        return;
      }

      // Get Firebase ID token
      const firebaseIdToken = await getIdToken();

      const payload: ForgotVerifyRequest = {
        phoneNumberE164: data.phoneNumberE164,
        firebaseIdToken,
        newPassword: data.newPassword,
      };
      await AuthApi.forgotVerify(payload);
      toast.success("Đặt lại mật khẩu thành công. Hãy đăng nhập.");
      setTimeout(() => navigate('/login'), 800);
    } catch (e: any) {
      toast.error(e.message || "Xác minh OTP thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full relative overflow-hidden">
      <Header />

      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://cdn.builder.io/api/v1/image/assets/TEMP/1a09124bf5c1d065e204bde5e60af8d4a7ebfba4?width=2878')",
        }}
      />

      <div className="relative z-10 flex items-center justify-center py-2 px-3 sm:px-4 lg:px-5">
        <div className="max-w-[80vw] min-w-[280px] max-h-[85vh] overflow-auto glassmorphism rounded-[24px] p-3 sm:p-4 md:p-6 lg:p-7 shadow-2xl">
          <div className="flex items-center justify-center gap-3 mb-4 sm:mb-5 md:mb-6">
            <img src="/logo.png" alt="TouriMate" className="h-12 w-auto" />
            <h1 className="text-gradient-login text-base sm:text-lg md:text-xl lg:text-2xl font-bold leading-none">
              Quên mật khẩu
            </h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-3.5 md:space-y-4">
            <div className="relative">
              <div className="flex gap-2">
                <input
                  className="flex-1 h-[30px] sm:h-[34px] md:h-[38px] bg-white rounded-[22px] px-2.5 sm:px-3 md:px-3.5 text-black text-xs sm:text-sm md:text-base leading-normal focus:outline-none focus:ring-2 focus:ring-login-gradient-start/50 transition-all duration-200"
                  placeholder="Số điện thoại (+84 hoặc 0...)"
                  {...register("phoneNumberE164", { required: true })}
                />
                <button
                  type="button"
                  onClick={onSendOtp}
                  disabled={sendingOtp || cooldown > 0}
                  className="px-2 sm:px-3 md:px-3.5 h-[30px] sm:h-[34px] md:h-[38px] bg-[#0b4f85] text-white rounded-[22px] font-saira text-[11px] sm:text-xs md:text-sm font-bold shadow-md hover:bg-[#0a4676] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {sendingOtp ? 'Đang gửi...' : cooldown > 0 ? `Gửi lại sau ${Math.floor(cooldown/60)}:${String(cooldown%60).padStart(2,'0')}` : 'Gửi OTP'}
                </button>
              </div>
            </div>
            <div className="relative">
              <input
                className="w-full h-[30px] sm:h-[34px] md:h-[38px] bg-white rounded-[22px] px-2.5 sm:px-3 md:px-3.5 text-black text-xs sm:text-sm md:text-base leading-normal focus:outline-none focus:ring-2 focus:ring-login-gradient-start/50 transition-all duration-200"
                placeholder="Mã OTP"
                {...register("code", { required: true })}
              />
            </div>
            <div className="relative">
              <input
                className="w-full h-[30px] sm:h-[34px] md:h-[38px] bg-white rounded-[22px] px-2.5 sm:px-3 md:px-3.5 text-black text-xs sm:text-sm md:text-base leading-normal focus:outline-none focus:ring-2 focus:ring-login-gradient-start/50 transition-all duration-200"
                placeholder="Mật khẩu mới"
                type="password"
                {...register("newPassword", { required: true })}
              />
            </div>
            <div className="relative">
              <input
                className="w-full h-[30px] sm:h-[34px] md:h-[38px] bg-white rounded-[22px] px-2.5 sm:px-3 md:px-3.5 text-black text-xs sm:text-sm md:text-base leading-normal focus:outline-none focus:ring-2 focus:ring-login-gradient-start/50 transition-all duration-200"
                placeholder="Nhập lại mật khẩu mới"
                type="password"
                {...register("confirmPassword", { required: true })}
              />
            </div>

            {/* Notifications are handled via toast */}

            <div className="pt-1 sm:pt-2 md:pt-3">
              <button disabled={loading} className="w-full max-w-[170px] h-[34px] sm:h-[38px] md:h-[42px] bg-[#0b4f85] text-white rounded-[26px] mx-auto block shadow-lg hover:bg-[#0a4676] transition-all font-saira text-[11px] sm:text-xs md:text-sm lg:text-[16px] font-bold disabled:opacity-60">
                {loading ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>

            {/* reCAPTCHA container - invisible */}
            <div id="recaptcha-container" style={{ display: 'none' }}></div>

            <div className="text-center pt-3 sm:pt-4 md:pt-5 flex items-center justify-center gap-4">
              <Link to="/" className="inline-flex items-center gap-1.5 text-black font-nunito font-bold hover:opacity-80 transition-opacity">
                <ArrowLeft className="w-4 h-4" />
                Về trang chủ
              </Link>
              <span className="text-black/20">|</span>
              <Link to="/login" className="inline-flex items-center gap-1.5 text-black font-nunito font-bold hover:opacity-80 transition-opacity">
                <LogIn className="w-4 h-4" />
                Đã có tài khoản? Đăng nhập
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


