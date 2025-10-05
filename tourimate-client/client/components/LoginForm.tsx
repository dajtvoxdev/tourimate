import { useState } from "react";
import { Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function LoginForm() {
  const [rememberMe, setRememberMe] = useState(true);
  const [email, setEmail] = useState("Example@123");
  const [password, setPassword] = useState("Example@123");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple validation - in real app, you'd make API call here
    if (email && password) {
      navigate("/home");
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://cdn.builder.io/api/v1/image/assets/TEMP/1a09124bf5c1d065e204bde5e60af8d4a7ebfba4?width=2878')",
        }}
      />

      {/* Login Form Container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center py-8 pl-8 pr-5 sm:px-6 lg:px-8">
        <div className="w-full max-w-[649px] glassmorphism rounded-[34px] p-6 sm:p-8 md:p-12 lg:p-16 shadow-2xl">
          {/* Login Title */}
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h1 className="text-gradient-login  text-3xl sm:text-4xl md:text-5xl lg:text-[64px] font-bold leading-none">
              Đăng Nhập
            </h1>
          </div>

          {/* Login Form */}
          <form
            onSubmit={handleLogin}
            className="space-y-4 sm:space-y-5 md:space-y-6"
          >
            {/* Email Input */}
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[60px] sm:h-[70px] md:h-[78px] bg-white rounded-[60px] px-4 sm:px-5 md:px-6 text-black  text-xl sm:text-2xl md:text-3xl lg:text-[35px] leading-normal focus:outline-none focus:ring-2 focus:ring-login-gradient-start/50 transition-all duration-200"
                placeholder="Example@123"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-[60px] sm:h-[70px] md:h-[78px] bg-white rounded-[60px] px-4 sm:px-5 md:px-6 text-black  text-xl sm:text-2xl md:text-3xl lg:text-[35px] leading-normal focus:outline-none focus:ring-2 focus:ring-login-gradient-start/50 transition-all duration-200"
                placeholder="Example@123"
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 sm:py-3 md:py-4 space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3 sm:space-x-4">
                {/* Custom Checkbox */}
                <button
                  onClick={() => setRememberMe(!rememberMe)}
                  className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full checkbox-hover flex items-center justify-center">
                    <div
                      className={`w-4 h-4 sm:w-[18px] sm:h-[18px] rounded-sm ${rememberMe ? "bg-black" : "bg-white border-2 border-gray-300"} flex items-center justify-center`}
                    >
                      {rememberMe && (
                        <Check
                          className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white"
                          strokeWidth={3}
                        />
                      )}
                    </div>
                  </div>
                </button>
                <span className="text-black font-inter text-lg sm:text-xl md:text-2xl font-normal">
                  Nhớ mật khẩu
                </span>
              </div>

              <button className="text-black font-inter text-lg sm:text-xl md:text-2xl font-normal hover:text-login-gradient-start transition-colors duration-200 text-left sm:text-right">
                Quên mật khẩu
              </button>
            </div>

            {/* Login Button */}
            <div className="pt-2 sm:pt-3 md:pt-4">
              <button
                type="submit"
                className="w-full max-w-[260px] h-[60px] sm:h-[70px] md:h-[78px] bg-white rounded-[60px] mx-auto block hover:bg-gray-50 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <span className="text-black font-saira text-xl sm:text-2xl md:text-3xl lg:text-[35px] font-bold">
                  đăng nhập
                </span>
              </button>
            </div>

            {/* Sign Up Link */}
            <div className="text-center pt-4 sm:pt-5 md:pt-6">
              <Link
                to="/register"
                className="text-black  text-lg sm:text-xl md:text-2xl lg:text-[25px] font-bold hover:text-login-gradient-start transition-colors duration-200 px-2 inline-block"
              >
                Bạn chưa có tài khoản? Đăng kí
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
