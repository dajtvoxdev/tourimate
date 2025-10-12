import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, User, LogOut, Menu, X, Settings } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../src/hooks/useAuth";

interface HeaderProps {
  hideRegister?: boolean;
  hideLogin?: boolean;
}

export default function Header({ hideRegister = false, hideLogin = false }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isLoggedIn, user, isAdmin, logout } = useAuth();

  // Note: Removed auto-redirect to admin page to allow admin users to browse homepage normally

  const handleLogout = async () => {
    await logout();
    toast.success("Đã đăng xuất");
    navigate("/");
  };

  const NavButton = ({ to, label }: { to: string; label: string }) => (
    <button
      onClick={() => {
        setIsMobileOpen(false);
        navigate(to);
      }}
      className={`group relative px-6 py-2.5 rounded-full font-nunito font-bold text-sm md:text-base transition-all duration-200 shadow-sm hover:shadow-md ring-1 ring-black/5 overflow-hidden ${
        location.pathname === to
          ? "bg-gradient-to-r from-tour-blue to-tour-teal text-black"
          : "bg-white text-black hover:bg-gray-50"
      }`}
    >
      <span className="relative z-10">{label}</span>
      <span className="absolute inset-0 rounded-full bg-gradient-to-r from-tour-blue/0 via-tour-teal/10 to-tour-blue/0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );

  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-white/20 shadow-sm">
      <div className="max-w-9xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Left: Logo */}
          <button onClick={() => navigate("/")} className="flex items-center gap-3 group">
            <img src="/logo.png" alt="TouriMate" className="h-10 w-auto md:h-12 drop-shadow" />
            <span className="hidden sm:block font-josefin text-2xl md:text-3xl font-bold bg-gradient-to-r from-tour-blue to-tour-teal text-transparent bg-clip-text group-hover:opacity-90">
              TouriMate
            </span>
          </button>

          {/* Center: Nav (desktop) */}
          <nav className="hidden md:flex items-center gap-3 lg:gap-4">
            <NavButton to="/" label="Trang chủ" />
            <NavButton to="/about" label="Về chúng tôi" />
            <NavButton to="/tour-guides" label="Hướng dẫn viên" />
            <NavButton to="/create-tour" label="Tạo tour" />
          </nav>

          {/* Right: Auth / Avatar */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <div className="relative">
                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-2 p-1.5 hover:bg-gray-100 rounded-full transition-colors duration-200">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-tour-light-blue rounded-full flex items-center justify-center ring-1 ring-white/40 overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 md:w-6 md:h-6 text-black" />
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-black transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                    <div className="py-2">
                      <button onClick={() => navigate("/profile")} className="w-full px-6 py-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-3">
                        <User className="w-5 h-5 text-gray-600" />
                        <span className="font-nunito text-lg font-medium text-black">Thông tin cá nhân</span>
                      </button>
                      {isAdmin && (
                        <>
                          <button onClick={() => navigate("/admin")} className="w-full px-6 py-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-3">
                            <Settings className="w-5 h-5 text-gray-600" />
                            <span className="font-nunito text-lg font-medium text-black">Quản trị</span>
                          </button>
                        </>
                      )}
                      <div className="border-t border-gray-100 my-1"></div>
                      <button onClick={handleLogout} className="w-full px-6 py-3 text-left hover:bg-red-50 transition-colors duration-200 flex items-center space-x-3 text-red-600">
                        <LogOut className="w-5 h-5" />
                        <span className="font-nunito text-lg font-medium">Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                {!hideLogin && (
                  <button
                    onClick={() => navigate("/login")}
                    className="px-6 py-2.5 rounded-full bg-white text-black font-nunito font-bold shadow-sm hover:shadow-md ring-1 ring-black/5 hover:bg-gray-50 transition-all"
                  >
                    Đăng nhập
                  </button>
                )}
                {!hideRegister && (
                  <button
                    onClick={() => navigate("/register")}
                    className="px-6 py-2.5 rounded-full bg-gradient-to-r from-tour-blue to-tour-teal text-black font-nunito font-bold shadow-sm hover:shadow-md hover:brightness-105 transition-all"
                  >
                    Đăng ký
                  </button>
                )}
              </div>
            )}

            {/* Mobile menu toggle */}
            <button onClick={() => setIsMobileOpen((v) => !v)} className="md:hidden p-2 rounded-xl bg-gray-200 hover:bg-gray-300 transition-colors">
              {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileOpen && (
          <div className="md:hidden pb-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col gap-2">
              <NavButton to="/" label="Trang chủ" />
              <NavButton to="/about" label="Về chúng tôi" />
              <NavButton to="/tour-guides" label="Hướng dẫn viên" />
              <NavButton to="/create-tour" label="Tạo tour" />
              {isLoggedIn && isAdmin && (
                <NavButton to="/admin" label="Quản trị" />
              )}
              {!isLoggedIn && (
                <div className="flex gap-2 pt-2">
                  {!hideLogin && (
                    <button onClick={() => { setIsMobileOpen(false); navigate("/login"); }} className="flex-1 px-5 py-2.5 rounded-full bg-white text-black font-nunito font-bold shadow-sm ring-1 ring-black/5 hover:bg-gray-50 transition-all">Đăng nhập</button>
                  )}
                  {!hideRegister && (
                    <button onClick={() => { setIsMobileOpen(false); navigate("/register"); }} className="flex-1 px-5 py-2.5 rounded-full bg-gradient-to-r from-tour-blue to-tour-teal text-black font-nunito font-bold shadow-sm hover:brightness-105 transition-all">Đăng ký</button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}


