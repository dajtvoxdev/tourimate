import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthApi, LoginRequest } from "./api";
import { useState } from "react";
import Header from "../../../components/Header";
import { Link } from "react-router-dom";
import { ArrowLeft, UserPlus } from "lucide-react";

// Helper: normalize Vietnamese phone numbers to +84 format
const normalizePhone = (raw: string) => {
  let v = (raw || "").replace(/[\s\-\(\)]/g, "");
  if (!v) return v;
  if (v.startsWith("+84")) return v;
  if (v.startsWith("84")) return "+" + v;
  if (v.startsWith("0")) return "+84" + v.substring(1);
  return "+84" + v; // assume local
};

export default function Login() {
  const { register, handleSubmit, setValue, watch } = useForm<LoginRequest>({
    defaultValues: { phoneNumberE164: "", password: "" },
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: LoginRequest) => {
    setError(null);
    setLoading(true);
    try {
      const normalized = normalizePhone(data.phoneNumberE164);
      const res = await AuthApi.login({ ...data, phoneNumberE164: normalized });
      localStorage.setItem("accessToken", res.accessToken);
      if ((res as any).refreshToken) localStorage.setItem("refreshToken", (res as any).refreshToken);
      if ((res as any).refreshTokenExpiresAt) localStorage.setItem("refreshTokenExpiresAt", String((res as any).refreshTokenExpiresAt));
      window.location.href = "/";
    } catch (e: any) {
      const message = e.message || "Đăng nhập thất bại";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full relative overflow-hidden">
      <Header hideLogin />

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
              Đăng nhập
            </h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-3.5 md:space-y-4">
            <div className="relative">
              <input
                placeholder="Số điện thoại (+84 hoặc 0...)"
                className="w-full h-[30px] sm:h-[34px] md:h-[38px] bg-white rounded-[22px] px-2.5 sm:px-3 md:px-3.5 text-black text-xs sm:text-sm md:text-base leading-normal focus:outline-none focus:ring-2 focus:ring-login-gradient-start/50 transition-all duration-200"
                {...register("phoneNumberE164", { required: true })}
              />
            </div>
            <div className="relative">
              <input
                placeholder="Mật khẩu"
                type="password"
                className="w-full h-[30px] sm:h-[34px] md:h-[38px] bg-white rounded-[22px] px-2.5 sm:px-3 md:px-3.5 text-black text-xs sm:text-sm md:text-base leading-normal focus:outline-none focus:ring-2 focus:ring-login-gradient-start/50 transition-all duration-200"
                {...register("password", { required: true })}
              />
            </div>

            {/* Errors are shown via toast; keep a tiny spacer to avoid layout jump */}
            {error && <div className="h-0.5" />}

            <div className="pt-1 sm:pt-2 md:pt-3">
              <button
                disabled={loading}
                className="w-full max-w-[170px] h-[34px] sm:h-[38px] md:h-[42px] bg-[#0b4f85] text-white rounded-[26px] mx-auto block shadow-lg hover:bg-[#0a4676] transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="font-saira text-[11px] sm:text-xs md:text-sm lg:text-[16px] font-bold flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    "Đăng nhập"
                  )}
                </span>
              </button>
            </div>

            <div className="text-center pt-3 sm:pt-4 md:pt-5 flex items-center justify-center gap-4">
              <Link to="/" className="inline-flex items-center gap-1.5 text-black font-nunito font-bold hover:opacity-80 transition-opacity">
                <ArrowLeft className="w-4 h-4" />
                Về trang chủ
              </Link>
              <span className="text-black/20">|</span>
              <Link to="/register" className="inline-flex items-center gap-1.5 text-black font-nunito font-bold hover:opacity-80 transition-opacity">
                <UserPlus className="w-4 h-4" />
                Chưa có tài khoản? Đăng ký
              </Link>
            </div>

            <div className="text-center pt-1">
              <a className="text-xs sm:text-sm hover:underline" href="/forgot">Quên mật khẩu?</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


