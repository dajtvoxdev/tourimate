import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { httpJson, getApiBase } from "@/src/lib/http";
import {
  LayoutDashboard,
  Users,
  MapPin,
  Calendar,
  DollarSign,
  BarChart3,
  Settings,
  FileText,
  Shield,
  MessageSquare,
  Star,
  Package,
  CreditCard,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  X,
  Clock,
  CheckCircle,
  RotateCcw,
  TrendingUp,
  Cog
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/src/hooks/useAuth";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  badge?: string;
  children?: NavItem[];
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [bookingCount, setBookingCount] = useState<number>(0);

  // Fetch booking count
  const fetchBookingCount = async () => {
    try {
      const response = await httpJson<{ totalCount: number }>(
        `${getApiBase()}/api/bookings/admin?page=1&pageSize=1`
      );
      setBookingCount(response.totalCount || 0);
    } catch (error) {
      console.error("Error fetching booking count:", error);
      setBookingCount(0);
    }
  };

  useEffect(() => {
    if (user?.role === "Admin") {
      fetchBookingCount();
    }
  }, [user?.role]);
  const [pendingGuideApps, setPendingGuideApps] = React.useState<number>(0);
  const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "https://localhost:7181";

  React.useEffect(() => {
    let mounted = true;
    const fetchPending = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch(`${API_BASE}/api/auth/tour-guide-applications?status=pending_review&page=1&pageSize=1`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setPendingGuideApps(Number(data.totalCount || 0));
      } catch {}
    };
    fetchPending();
    const id = window.setInterval(fetchPending, 30000);
    return () => { mounted = false; window.clearInterval(id); };
  }, [API_BASE]);

  const isTourGuideOnly = user?.role === 'TourGuide';
  const navItems: NavItem[] = [
    {
      id: "dashboard",
      label: "Tổng quan",
      icon: LayoutDashboard,
      path: "/admin"
    },
    isTourGuideOnly ? {
      id: "tours",
      label: "Quản lý Tour",
      icon: MapPin,
      children: [
        { id: "my-tours", label: "Tour của tôi", icon: MapPin, path: "/admin/tours?mine=1" },
        { id: "my-tour-reviews", label: "Đánh giá Tour", icon: Star, path: "/admin/reviews?mine=1" }
      ]
    } : {
      id: "tours",
      label: "Quản lý Tour",
      icon: MapPin,
      children: [
        { id: "all-tours", label: "Tất cả Tour", icon: MapPin, path: "/admin/tours" },
        { id: "tour-categories", label: "Danh mục Tour", icon: Package, path: "/admin/tour-categories" },
        { id: "tour-reviews", label: "Đánh giá Tour", icon: Star, path: "/admin/reviews" }
      ]
    },
    !isTourGuideOnly ? {
      id: "transactions",
      label: "Quản lý Giao dịch",
      icon: CreditCard,
      children: [
        { id: "all-transactions", label: "Tất cả giao dịch", icon: CreditCard, path: "/admin/transactions" },
        { id: "bookings", label: "Đặt tour", icon: Calendar, path: "/admin/bookings" }
      ]
    } : null,
    !isTourGuideOnly ? {
      id: "users",
      label: "Quản lý Người dùng",
      icon: Users,
      children: [
        { id: "all-users", label: "Tất cả Người dùng", icon: Users, path: "/admin/users" },
        { id: "tour-guide-applications", label: "Đơn đăng ký hướng dẫn viên", icon: FileText, path: "/admin/tour-guide-applications" },
        { id: "tour-guides", label: "Hướng dẫn viên", icon: Shield, path: "/admin/guides" },
        { id: "user-roles", label: "Phân quyền", icon: Settings, path: "/admin/user-roles" }
      ]
    } : {
      id: "guides",
      label: "Hướng dẫn viên",
      icon: Shield,
      children: [
        { id: "tour-guides", label: "Hồ sơ của tôi", icon: Shield, path: "/profile" }
      ]
    },
    isTourGuideOnly ? {
      id: "bookings",
      label: "Đặt Tour",
      icon: Calendar,
      children: [
        { id: "my-bookings", label: "Đặt tour của tôi", icon: Calendar, path: "/admin/bookings?mine=1" }
      ]
    } : {
      id: "bookings",
      label: "Đặt Tour",
      icon: Calendar,
      badge: bookingCount > 0 ? bookingCount.toString() : undefined,
      children: [
        { id: "all-bookings", label: "Tất cả Tour đã đặt", icon: Calendar, path: "/admin/bookings" },
        { id: "pending-bookings", label: "Chờ xử lý", icon: Clock, path: "/admin/bookings/pending" },
        { id: "confirmed-bookings", label: "Đã xác nhận", icon: CheckCircle, path: "/admin/bookings/confirmed" }
      ]
    },
    isTourGuideOnly ? {
      id: "payments",
      label: "Thanh toán",
      icon: CreditCard,
      children: [
        { id: "transactions", label: "Giao dịch của tôi", icon: CreditCard, path: "/admin/transactions?mine=1" },
        { id: "revenue", label: "Doanh thu", icon: DollarSign, path: "/admin/revenue?mine=1" }
      ]
    } : {
      id: "payments",
      label: "Thanh toán",
      icon: CreditCard,
      children: [
        { id: "transactions", label: "Giao dịch", icon: CreditCard, path: "/admin/transactions" },
        { id: "revenue", label: "Doanh thu", icon: DollarSign, path: "/admin/revenue" },
        { id: "refunds", label: "Hoàn tiền", icon: RotateCcw, path: "/admin/refunds" }
      ]
    },
    isTourGuideOnly ? {
      id: "analytics",
      label: "Thống kê",
      icon: BarChart3,
      children: [
        { id: "performance", label: "Hiệu suất của tôi", icon: TrendingUp, path: "/admin/performance?mine=1" }
      ]
    } : {
      id: "analytics",
      label: "Thống kê",
      icon: BarChart3,
      children: [
        { id: "overview", label: "Tổng quan", icon: BarChart3, path: "/admin/analytics" },
        { id: "reports", label: "Báo cáo", icon: FileText, path: "/admin/reports" },
        { id: "performance", label: "Hiệu suất", icon: TrendingUp, path: "/admin/performance" }
      ]
    },
    {
      id: "communications",
      label: "Giao tiếp",
      icon: MessageSquare,
      badge: "5",
      children: [
        { id: "messages", label: "Tin nhắn", icon: MessageSquare, path: "/admin/messages" },
        { id: "notifications", label: "Thông báo", icon: Bell, path: "/admin/notifications" },
        { id: "support", label: "Hỗ trợ", icon: HelpCircle, path: "/admin/support" }
      ]
    },
    !isTourGuideOnly ? {
      id: "settings",
      label: "Cài đặt",
      icon: Settings,
      children: [
        { id: "general", label: "Tổng quan", icon: Settings, path: "/admin/settings" },
        { id: "system", label: "Hệ thống", icon: Cog, path: "/admin/settings/system" },
        { id: "security", label: "Bảo mật", icon: Shield, path: "/admin/settings/security" },
        { id: "divisions", label: "Đơn vị hành chính", icon: MapPin, path: "/admin/divisions" }
      ]
    } : undefined as any
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const NavItemComponent: React.FC<{ item: NavItem; level?: number }> = ({ item, level = 0 }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const hasChildren = item.children && item.children.length > 0;
    const isItemActive = item.path ? isActive(item.path) : false;
    const hasActiveChild = item.children?.some(child => child.path && isActive(child.path));

    return (
      <div>
        <button
          onClick={() => {
            if (hasChildren) {
              setIsExpanded(!isExpanded);
            } else if (item.path) {
              handleNavigation(item.path);
            }
          }}
          className={cn(
            "w-full flex items-center justify-between px-2 py-2 text-sm font-medium rounded-lg transition-all duration-200 group",
            level === 0 ? "mb-1" : "ml-3 mb-1",
            isItemActive || hasActiveChild
              ? "bg-gradient-to-r from-tour-blue to-tour-teal text-white shadow-sm"
              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          )}
          title={!isOpen ? item.label : undefined}
        >
          <div className="flex items-center space-x-2">
            <item.icon className={cn(
              "h-4 w-4 transition-colors flex-shrink-0",
              isItemActive || hasActiveChild ? "text-white" : "text-gray-500 group-hover:text-gray-700"
            )} />
            {isOpen && <span className="text-xs">{item.label}</span>}
          </div>
          
          {isOpen && (
            <div className="flex items-center space-x-2">
              {((item.id === "tour-guide-applications" && pendingGuideApps > 0) || item.badge) && (
                <span className={cn(
                  "px-2 py-0.5 text-xs font-medium rounded-full",
                  isItemActive || hasActiveChild
                    ? "bg-white/20 text-white"
                    : "bg-tour-blue text-white"
                )}>
                  {item.id === "tour-guide-applications" ? pendingGuideApps : item.badge}
                </span>
              )}
              {hasChildren && (
                <ChevronRight className={cn(
                  "h-4 w-4 transition-transform",
                  isExpanded ? "rotate-90" : "",
                  isItemActive || hasActiveChild ? "text-white" : "text-gray-400"
                )} />
              )}
            </div>
          )}
        </button>

        {hasChildren && isExpanded && isOpen && (
          <div className="mt-1 space-y-1">
            {item.children?.map((child) => (
              <NavItemComponent key={child.id} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white border-r border-gray-200 shadow-lg transition-all duration-300 ease-in-out flex-shrink-0",
          "lg:relative lg:h-full lg:z-auto",
          isOpen ? "w-64" : "w-16",
          "fixed left-0 top-0 z-50 h-full",
          "flex flex-col"
        )}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-tour-blue to-tour-teal rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            {isOpen && (
              <div>
                <h2 className="text-lg font-bold text-gray-900">Bảng điều khiển</h2>
                <p className="text-xs text-gray-500">TouriMate</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
          <div className="space-y-1 px-2">
            {navItems.filter(Boolean).map((item: any) => (
              <NavItemComponent key={item.id} item={item} />
            ))}
          </div>
        </nav>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar || ""} />
              <AvatarFallback className="bg-tour-light-blue text-black text-sm font-medium">
                {user ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
            {isOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Người dùng" : "Khách"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || user?.phoneNumber || "Chưa cập nhật"}
                </p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await logout();
                navigate("/");
              }}
              className="p-1 hover:bg-gray-200 rounded"
              title={!isOpen ? "Đăng xuất" : undefined}
            >
              <LogOut className="h-4 w-4 text-gray-600" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
