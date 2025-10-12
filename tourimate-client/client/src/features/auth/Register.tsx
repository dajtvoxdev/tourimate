import { useForm } from "react-hook-form";
import { AuthApi, RegisterRequest } from "./api";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft, LogIn } from "lucide-react";
import { setupRecaptcha, clearRecaptcha, sendOTP, verifyOTP, getIdToken } from "../../lib/firebase";
import Header from "../../../components/Header";
import { Link, useNavigate, useLocation } from "react-router-dom";

type RegisterForm = Omit<RegisterRequest, 'firebaseIdToken'> & { 
  confirmPassword: string; 
  acceptTerms: boolean;
  code: string;
};

export default function Register() {
  const { register, handleSubmit, watch } = useForm<RegisterForm>({
    defaultValues: {
      phoneNumberE164: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      acceptEmailMarketing: true,
      acceptTerms: false,
      email: "",
      code: "",
    },
  });
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const phone = watch("phoneNumberE164");
  const [cooldown, setCooldown] = useState<number>(0);
  const COOLDOWN_SECONDS = 90;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Helper to fully reset reCAPTCHA container and any existing verifier
  const resetRecaptcha = () => {
    clearRecaptcha();
  };

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // Initialize reCAPTCHA when component mounts
  useEffect(() => {
    try {
      console.log('Setting up reCAPTCHA...');
      resetRecaptcha();
      setupRecaptcha();
      console.log('reCAPTCHA setup successfully');
    } catch (error: any) {
      console.error('Failed to setup reCAPTCHA:', error);
      // Handle "already been rendered" by hard reset and single retry
      if (String(error?.message || "").includes('already been rendered')) {
        try {
          resetRecaptcha();
          setupRecaptcha();
          console.log('reCAPTCHA re-setup after render conflict');
          return;
        } catch {}
      }
      toast.error('Không thể khởi tạo xác thực. Vui lòng tải lại trang.');
    }
  }, []);

  const sendOtp = async () => {
    // Prevent duplicate requests
    if (sendingOtp || cooldown > 0) {
      return;
    }

    
    if (!phone) {
      toast.error("Vui lòng nhập số điện thoại");
      return;
    }

    // Validate phone number format (Vietnamese numbers)
    const phoneRegex = /^(\+84|84|0)[1-9][0-9]{8,9}$/;
    if (!phoneRegex.test(phone)) {
      toast.error("Số điện thoại không đúng định dạng. Vui lòng nhập số Việt Nam hợp lệ (VD: 0123456789, +84123456789).");
      return;
    }

    let retried = false;
    const attemptSend = async () => {
      setSendingOtp(true);
      try {
        const verificationId = await sendOTP(phone);
        setVerificationId(verificationId);
        toast.success("Đã gửi mã OTP. Vui lòng kiểm tra SMS.");
        // Start cooldown immediately and clear current reCAPTCHA session to avoid token reuse issues
        setCooldown(COOLDOWN_SECONDS);
        resetRecaptcha();
      } catch (e: any) {
        const message = e.message || "Gửi OTP thất bại";
        console.error('Error sending OTP:', message);
        if (!retried && message.includes('already been rendered')) {
          // One-time auto recovery: reset and retry silently
          retried = true;
          resetRecaptcha();
          try {
            setupRecaptcha();
            await new Promise(res => setTimeout(res, 150));
            return await attemptSend();
          } catch {
            toast.error('Không thể khởi tạo lại xác thực. Tải lại trang giúp mình nhé.');
          }
        } else {
          toast.error(message);
        }
      } finally {
        setSendingOtp(false);
      }
    };

    await attemptSend();
  };

  const onSubmit = async (data: RegisterForm) => {
    // Prevent duplicate submissions
    if (loading) {
      return;
    }

    // Password strength: >= 8, includes letters and numbers (specials allowed)
    const strong = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!strong.test(data.password)) {
      toast.error("Mật khẩu phải ít nhất 8 ký tự.");
      return;
    }

    if (!data.acceptTerms) {
      toast.error("Vui lòng đồng ý điều khoản và chính sách.");
      return;
    }
    if (data.password !== data.confirmPassword) {
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
      
      const payload = {
        phoneNumberE164: data.phoneNumberE164,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        acceptEmailMarketing: !!data.acceptEmailMarketing,
        email: data.email || undefined,
        firebaseIdToken: firebaseIdToken,
      } satisfies RegisterRequest;
      
      const res = await AuthApi.register(payload);
      localStorage.setItem("accessToken", res.accessToken);
      if ((res as any).refreshToken) localStorage.setItem("refreshToken", (res as any).refreshToken);
      if ((res as any).refreshTokenExpiresAt) localStorage.setItem("refreshTokenExpiresAt", String((res as any).refreshTokenExpiresAt));
      toast.success("Đăng ký thành công! Đang chuyển hướng...");
      
      // Check if there's a return URL from the protected route
      const from = location.state?.from;
      if (from) {
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 1000);
      } else {
        // Small delay before redirect to show success message
        setTimeout(() => {
          navigate("/");
        }, 1000);
      }
    } catch (e: any) {
      toast.error(e.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full relative overflow-hidden">
      {/* Header */}
      <Header hideRegister />

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
            <img src="/logo.png" alt="TouriMate" className="h-20 w-auto" />
            <h1 className="text-gradient-login text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-none">
              Đăng Ký
            </h1>
          </div>

          {/* reCAPTCHA container - invisible */}
          <div id="recaptcha-container" style={{ display: 'none' }}></div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5 sm:space-y-3.5 md:space-y-4">
            <div className="grid md:grid-cols-2 gap-3.5">
              <div className="relative">
                <input
                  type="text"
                  {...register("lastName", { required: true })}
                  className="w-full h-[32px] sm:h-[36px] md:h-[40px] bg-white rounded-[24px] px-3 sm:px-3.5 md:px-4 text-black  text-xs sm:text-sm md:text-base lg:text-[16px] leading-normal focus:outline-none focus:ring-2 focus:ring-login-gradient-start/50 transition-all duration-200"
                  placeholder="Họ"
                />
              </div>
              <div className="relative">
                <input
                  type="text"
                  {...register("firstName", { required: true })}
                  className="w-full h-[32px] sm:h-[36px] md:h-[40px] bg-white rounded-[24px] px-3 sm:px-3.5 md:px-4 text-black  text-xs sm:text-sm md:text-base lg:text-[16px] leading-normal focus:outline-none focus:ring-2 focus:ring-login-gradient-start/50 transition-all duration-200"
                  placeholder="Tên"
                />
              </div>
            </div>

            <div className="relative">
              <div className="flex gap-2">
                <input
                  type="tel"
                  {...register("phoneNumberE164", { required: true })}
                  className="flex-1 h-[32px] sm:h-[36px] md:h-[40px] bg-white rounded-[24px] px-3 sm:px-3.5 md:px-4 text-black  text-xs sm:text-sm md:text-base lg:text-[16px] leading-normal focus:outline-none focus:ring-2 focus:ring-login-gradient-start/50 transition-all duration-200"
                  placeholder="Số điện thoại (VD: 0123456789 hoặc +84123456789)"
                />
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={sendingOtp || cooldown > 0}
                  className="px-2 sm:px-3 md:px-3.5 h-[32px] sm:h-[36px] md:h-[40px] bg-[#0b4f85] text-white rounded-[24px] font-saira text-[11px] sm:text-xs md:text-sm font-bold shadow-md hover:bg-[#0a4676] transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {sendingOtp ? (
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang gửi...
                    </span>
                  ) : cooldown > 0 ? (
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Gửi lại sau {Math.floor(cooldown / 60)}:{String(cooldown % 60).padStart(2, "0")}
                    </span>
                  ) : (
                    "Gửi OTP"
                  )}
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                {...register("code", { required: true })}
                className="w-full h-[32px] sm:h-[36px] md:h-[40px] bg-white rounded-[24px] px-3 sm:px-3.5 md:px-4 text-black  text-xs sm:text-sm md:text-base lg:text-[16px] leading-normal focus:outline-none focus:ring-2 focus:ring-login-gradient-start/50 transition-all duration-200"
                placeholder="Mã OTP"
              />
            </div>

            <div className="relative">
              <input
                type="email"
                {...register("email")}
                className="w-full h-[32px] sm:h-[36px] md:h-[40px] bg-white rounded-[24px] px-3 sm:px-3.5 md:px-4 text-black  text-xs sm:text-sm md:text-base lg:text-[16px] leading-normal focus:outline-none focus:ring-2 focus:ring-login-gradient-start/50 transition-all duration-200"
                placeholder="Email (tùy chọn)"
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                {...register("password", { required: true })}
                className="w-full h-[32px] sm:h-[36px] md:h-[40px] bg-white rounded-[24px] pr-10 px-3 sm:px-3.5 md:px-4 text-black  text-xs sm:text-sm md:text-base lg:text-[16px] leading-normal focus:outline-none focus:ring-2 focus:ring-login-gradient-start/50 transition-all duration-200"
                placeholder="Mật khẩu"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                {...register("confirmPassword", { required: true })}
                className="w-full h-[32px] sm:h-[36px] md:h-[40px] bg-white rounded-[24px] pr-10 px-3 sm:px-3.5 md:px-4 text-black  text-xs sm:text-sm md:text-base lg:text-[16px] leading-normal focus:outline-none focus:ring-2 focus:ring-login-gradient-start/50 transition-all duration-200"
                placeholder="Nhập lại mật khẩu"
              />
              <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800">
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                defaultChecked
                {...register("acceptEmailMarketing")}
                className="w-4 h-4 sm:w-5 sm:h-5 accent-[#0b4f85] border border-gray-300 rounded focus:ring-2 focus:ring-[#0b4f85]/30"
              />
              <span className="text-black font-inter text-[11px] sm:text-xs md:text-sm font-normal">Nhận email khuyến mãi</span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                {...register("acceptTerms", { required: true })}
                className="mt-1 w-4 h-4 sm:w-5 sm:h-5 accent-[#0b4f85] border border-gray-300 rounded focus:ring-2 focus:ring-[#0b4f85]/30"
              />
              <span className="text-black font-inter text-[11px] sm:text-xs md:text-sm font-normal">
                Tôi đã đọc và đồng ý với{" "}
                <a href="/terms" className="text-[#0b4f85] underline">điều khoản sử dụng</a>{" "}và{" "}
                <a href="/privacy" className="text-[#0b4f85] underline">chính sách bảo mật</a>.
              </span>
            </label>


            <div className="pt-2 sm:pt-3 md:pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full max-w-[180px] h-[36px] sm:h-[40px] md:h-[44px] bg-[#0b4f85] text-white rounded-[28px] mx-auto block shadow-lg hover:bg-[#0a4676] transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <span className="font-saira text-xs sm:text-sm md:text-base lg:text-[18px] font-bold flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    "Đăng ký"
                  )}
                </span>
              </button>
            </div>

            {/* Links below the register button */}
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


