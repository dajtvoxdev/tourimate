import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  ChevronDown,
  LogOut,
  Edit,
  Camera,
  Mail,
  Phone,
  MapPin,
  Calendar as CalendarIcon,
  Star,
  Heart,
  Eye,
  Save,
  X,
  Globe,
  Settings,
  Bell,
  Check,
  CreditCard,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import Header from "./Header";
import { httpWithRefresh, httpJson, httpUpload, getApiBase } from "@/src/lib/http";
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CancellationDialog } from "./CancellationDialog";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7181";

interface BookedTour {
  id: string;
  bookingNumber: string;
  status: "PendingPayment" | "Confirmed" | "Cancelled" | "Completed";
  totalAmount: number;
  adultCount: number;
  childCount: number;
  contactInfo: string; // JSON string
  specialRequests?: string;
  createdAt: string;
  tour: {
    id: string;
    title: string;
    images?: string; // JSON string
    location: string;
  };
  tourAvailability: {
    id: string;
    date: string;
    adultPrice: number;
    childPrice: number;
    departurePoint?: string;
    vehicle?: string;
    tripTime?: string;
  };
}

interface FavoriteTour {
  id: number;
  title: string;
  image: string;
  price: string;
  location: string;
}

export default function PersonalProfile() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const navigate = useNavigate();
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputId = "avatar-file-input";

  // User profile state
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    birthDate: "",
    gender: "",
    website: "",
    avatar: "https://cdn.builder.io/api/v1/image/assets/TEMP/db84159ff10c8b7bceb41b0f85ded4139e62ae21?width=712",
    bio: "",
    country: "Vietnam",
    acceptEmailMarketing: false,
    lastLoginAt: "",
    provinceCode: null as number | null,
    socialMedia: {
      facebook: "",
      instagram: "",
      twitter: "",
      zalo: "",
      tiktok: "",
      youtube: ""
    },
    notificationSettings: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      marketingEmails: false
    }
  });

  const [editedProfile, setEditedProfile] = useState(profile);
  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const formatDob = (d: string) => {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "";
    return dt.toLocaleDateString("vi-VN");
  };

  // Load provinces
  const loadProvinces = async () => {
    try {
      const data = await httpJson<any[]>(`${getApiBase()}/api/divisions/provinces`, { skipAuth: true });
      const provinces = (data || []).filter((d: any) => (d.parentCode ?? d.ParentCode) == null);
      setProvinces(provinces.map((d: any) => ({ code: d.code ?? d.Code, name: d.name ?? d.Name })));
    } catch (e) {
      console.error("Failed to load provinces:", e);
    }
  };


  // Fetch profile from API
  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Bạn cần đăng nhập");
        navigate("/login");
        return;
      }
      try {
        const data = await httpJson<any>(`${getApiBase()}/api/auth/me`);
        const name = `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim();
        const birth = data.dateOfBirth ? String(data.dateOfBirth) : "";
        const next = {
          name,
          email: data.email ?? "",
          phone: data.phoneNumber ?? "",
          address: data.address ?? "",
          birthDate: birth,
          gender: data.gender ?? "",
          website: data.website ?? "",
          avatar: data.avatar || profile.avatar,
          bio: data.bio ?? "",
          country: data.country ?? "Vietnam",
          acceptEmailMarketing: data.acceptEmailMarketing ?? false,
          lastLoginAt: data.lastLoginAt ? new Date(data.lastLoginAt).toLocaleString("vi-VN") : "",
          provinceCode: data.provinceCode ?? null,
          socialMedia: data.socialMedia ? JSON.parse(data.socialMedia) : {
            facebook: "",
            instagram: "",
            twitter: "",
            zalo: "",
            tiktok: "",
            youtube: ""
          },
          notificationSettings: typeof data.notificationSettings === "string"
            ? JSON.parse(data.notificationSettings)
            : (data.notificationSettings ?? {
              emailNotifications: true,
              smsNotifications: false,
              pushNotifications: true,
              marketingEmails: false
            })
        };
        setProfile(next);
        setEditedProfile(next);
      } catch (e: any) {
        console.error(e);
        toast.error(e.message || "Không thể tải thông tin hồ sơ");
      }
    };
    load();
    loadProvinces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch user bookings
  const fetchBookings = async () => {
    setBookingsLoading(true);
    try {
      const data = await httpJson<BookedTour[]>(`${getApiBase()}/api/bookings/user`);
      setBookedTours(data);
    } catch (error: any) {
      console.error("Error fetching bookings:", error);
      toast.error("Không thể tải danh sách tour đã đặt");
    } finally {
      setBookingsLoading(false);
    }
  };

  // Load bookings when tours tab is active
  useEffect(() => {
    if (activeTab === "tours") {
      fetchBookings();
    }
  }, [activeTab]);

  // Open cancel booking dialog
  const openCancelDialog = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setShowCancellationDialog(true);
  };

  // Handle successful cancellation
  const handleCancellationSuccess = () => {
    fetchBookings(); // Refresh the list
    setShowCancellationDialog(false);
    setSelectedBookingId(null);
  };

  // Continue payment function
  const handleContinuePayment = (booking: BookedTour) => {
    // Navigate to booking page with tour ID and availability ID
    navigate(`/tour/${booking.tour.id}/book?availability=${booking.tourAvailability.id}&booking=${booking.bookingNumber}`);
  };

  // Helper functions
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PendingPayment":
        return "bg-yellow-100 text-yellow-800";
      case "Confirmed":
        return "bg-green-100 text-green-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      case "Completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PendingPayment":
        return "Chờ thanh toán";
      case "Confirmed":
        return "Đã xác nhận";
      case "Cancelled":
        return "Đã hủy";
      case "Completed":
        return "Hoàn thành";
      default:
        return status;
    }
  };

  const getTourImage = (images?: string) => {
    if (!images) return "/placeholder.svg";
    try {
      const imageArray = JSON.parse(images);
      return imageArray && imageArray.length > 0 ? imageArray[0] : "/placeholder.svg";
    } catch {
      return "/placeholder.svg";
    }
  };

  const getContactInfo = (contactInfo: string) => {
    try {
      const info = JSON.parse(contactInfo);
      return {
        name: info.Name || info.name || "",
        email: info.Email || info.email || "",
        phone: info.Phone || info.phone || ""
      };
    } catch {
      return { name: "", email: "", phone: "" };
    }
  };

  const handleLogout = () => {
    navigate("/");
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleSaveProfile = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Bạn cần đăng nhập để cập nhật hồ sơ");
      navigate("/login");
      return;
    }
    // Split name into first/last (Vietnamese format: Family Name + Given Name)
    // For "Võ Thành Đạt" -> firstName: "Võ Thành", lastName: "Đạt"
    const parts = (editedProfile.name || "").trim().split(/\s+/);
    const firstName = parts.slice(0, -1).join(" ") || "";  // All except last word
    const lastName = parts[parts.length - 1] || "";        // Last word only
    const payload = {
      email: editedProfile.email,
      firstName,
      lastName,
      acceptEmailMarketing: editedProfile.acceptEmailMarketing,
      address: editedProfile.address,
      country: editedProfile.country || "Vietnam",
      dateOfBirth: editedProfile.birthDate || null,
      bio: editedProfile.bio || null,
      gender: editedProfile.gender || null,
      website: editedProfile.website || null,
      provinceCode: editedProfile.provinceCode,
      socialMedia: JSON.stringify(editedProfile.socialMedia),
      notificationSettings: JSON.stringify(editedProfile.notificationSettings),
    } as any;

    setLoading(true);
    try {
      await httpJson(`${getApiBase()}/api/auth/me`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setProfile(editedProfile);
      setIsEditing(false);
      toast.success("Cập nhật hồ sơ thành công");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Cập nhật hồ sơ thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const handleAvatarButtonClick = () => {
    const input = document.getElementById(fileInputId) as HTMLInputElement | null;
    input?.click();
  };

  const handleAvatarSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Bạn cần đăng nhập");
      navigate("/login");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      toast.error("Vui lòng chọn tệp hình ảnh");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Kích thước ảnh tối đa 10MB");
      return;
    }
    setAvatarUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const data = await httpUpload<{ url: string }>(`${getApiBase()}/api/media/upload`, form);
      const url: string = data.url;
      const next = { ...profile, avatar: url };
      setProfile(next);
      setEditedProfile((p) => ({ ...p, avatar: url }));
      // persist avatar to profile
      try {
        const payload = {
          email: next.email,
          firstName: (next.name || "").trim().split(/\s+/)[0] || "",
          lastName: (next.name || "").trim().split(/\s+/).slice(1).join(" ") || "",
          acceptEmailMarketing: false,
          address: next.address,
          city: undefined,
          country: "Vietnam",
          dateOfBirth: next.birthDate || null,
          bio: undefined,
          gender: next.gender || null,
          website: next.website || null,
          avatar: url,
        } as any;
        await httpJson(`${getApiBase()}/api/auth/me`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } catch (err: any) {
        console.error(err);
        // keep avatar locally even if persist fails
      }
      toast.success("Cập nhật ảnh đại diện thành công");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Tải ảnh lên thất bại");
    } finally {
      setAvatarUploading(false);
      // clear input to allow re-selecting the same file
      const input = document.getElementById(fileInputId) as HTMLInputElement | null;
      if (input) input.value = "";
    }
  };

  // Bookings state
  const [bookedTours, setBookedTours] = useState<BookedTour[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [showCancellationDialog, setShowCancellationDialog] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  // Mock data for favorite tours
  const favoriteTours: FavoriteTour[] = [
    {
      id: 1,
      title: "Tour guide tại Hạ Long",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/766e14260b99570779920f49b71b00c9bcaf78e4?width=736",
      price: "3.200.000 VND",
      location: "Hạ Long, Quảng Ninh",
    },
    {
      id: 2,
      title: "Tour guide tại Sapa",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/70f355664edb43207aa25e7eb2be8c8bda964238?width=736",
      price: "2.500.000 VND",
      location: "Sapa, Lào Cai",
    },
  ];

  // Mock data for guide's own tours
  const myTours = [
    {
      id: 1,
      title: "Tour Phú Quốc 3N2Đ",
      image: "https://cdn.builder.io/api/v1/image/assets/TEMP/7c497dcdbb3d5217867134b17d46c87fa56fe8cf?width=736",
      date: "25/12/2024",
      price: "3.500.000 VND",
      status: "active",
    },
    {
      id: 2,
      title: "Tour Đà Lạt săn mây",
      image: "https://cdn.builder.io/api/v1/image/assets/TEMP/a6a6b19a1b5bd896d9f2536f27b5b57ab8c9128e?width=1082",
      date: "10/01/2025",
      price: "2.800.000 VND",
      status: "active",
    },
  ];


  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Main Content */}
      <main className="max-w-9xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Profile Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[20px] p-6 shadow-lg">
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <img
                    src={profile.avatar}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                  <button onClick={handleAvatarButtonClick} disabled={avatarUploading} className="absolute bottom-0 right-0 bg-tour-blue text-white rounded-full p-2 hover:bg-tour-teal transition-colors duration-200 disabled:opacity-60">
                    <Camera className="w-4 h-4" />
                  </button>
                  <input id={fileInputId} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelected} />
                </div>
                <h2 className="font-nunito text-xl font-bold text-black mb-2">
                  {profile.name}
                </h2>

                {/* Navigation Tabs */}
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
                      activeTab === "profile"
                        ? "bg-tour-light-blue text-tour-blue"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <span className="font-nunito font-medium">
                      Thông tin cá nhân
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("tours")}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
                      activeTab === "tours"
                        ? "bg-tour-light-blue text-tour-blue"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <span className="font-nunito font-medium">Tour đã đặt</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("favorites")}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
                      activeTab === "favorites"
                        ? "bg-tour-light-blue text-tour-blue"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <span className="font-nunito font-medium">
                      Tour yêu thích
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("notifications")}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
                      activeTab === "notifications"
                        ? "bg-tour-light-blue text-tour-blue"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <span className="font-nunito font-medium">
                      Cài đặt thông báo
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-3">
            {/* Profile Information Tab */}
            {activeTab === "profile" && (
              <div className="bg-white rounded-[20px] p-6 md:p-8 shadow-lg">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-itim text-2xl md:text-3xl text-black">
                    Thông tin cá nhân
                  </h3>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-2 bg-tour-blue hover:bg-tour-teal text-white px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="font-nunito">Chỉnh sửa</span>
                    </button>
                  ) : (
                    <div className="flex space-x-3">
                      <button
                        onClick={handleSaveProfile}
                        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                      >
                        <Save className="w-4 h-4" />
                        <span className="font-nunito">Lưu</span>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                      >
                        <X className="w-4 h-4" />
                        <span className="font-nunito">Hủy</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Basic Information Section */}
                <div className="space-y-8">
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h4 className="font-nunito text-lg font-bold text-gray-900 mb-6 flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Thông tin cơ bản
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">Họ và tên</Label>
                        {isEditing ? (
                          <Input
                            id="name"
                            value={editedProfile.name}
                            onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                            placeholder="Nhập tên và họ (ví dụ: James Võ Thành)"
                          />
                        ) : (
                          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                            <User className="w-5 h-5 text-gray-500" />
                            <span className="text-sm">{profile.name}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                        {isEditing ? (
                          <Input
                            id="email"
                            type="email"
                            value={editedProfile.email}
                            onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                            placeholder="Nhập email"
                          />
                        ) : (
                          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                            <Mail className="w-5 h-5 text-gray-500" />
                            <span className="text-sm">{profile.email}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium">Số điện thoại</Label>
                        <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg border">
                          <Phone className="w-5 h-5 text-gray-500" />
                          <span className="text-sm text-gray-700">{profile.phone}</span>
                          <span className="ml-auto text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            Đã xác thực
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">Số điện thoại đã được xác thực và không thể thay đổi</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="gender" className="text-sm font-medium">Giới tính</Label>
                        {isEditing ? (
                          <Select value={editedProfile.gender || "none"} onValueChange={(value) => setEditedProfile({ ...editedProfile, gender: value === "none" ? "" : value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn giới tính" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Không xác định</SelectItem>
                              <SelectItem value="Male">Nam</SelectItem>
                              <SelectItem value="Female">Nữ</SelectItem>
                              <SelectItem value="Other">Khác</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                            <User className="w-5 h-5 text-gray-500" />
                            <span className="text-sm">
                              {profile.gender === "Male" ? "Nam" : profile.gender === "Female" ? "Nữ" : profile.gender === "Other" ? "Khác" : "-"}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="birthDate" className="text-sm font-medium">Ngày sinh</Label>
                        {isEditing ? (
                          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !editedProfile.birthDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {editedProfile.birthDate ? (
                                  format(new Date(editedProfile.birthDate), "dd/MM/yyyy", { locale: vi })
                                ) : (
                                  <span>Chọn ngày sinh</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={editedProfile.birthDate ? new Date(editedProfile.birthDate) : undefined}
                                onSelect={(date) => {
                                  if (date) {
                                    setEditedProfile({
                                      ...editedProfile,
                                      birthDate: format(date, "yyyy-MM-dd")
                                    });
                                    setCalendarOpen(false);
                                  }
                                }}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                                locale={vi}
                              />
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                            <CalendarIcon className="w-5 h-5 text-gray-500" />
                            <span className="text-sm">{formatDob(profile.birthDate)}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="website" className="text-sm font-medium">Website</Label>
                        {isEditing ? (
                          <Input
                            id="website"
                            type="url"
                            value={editedProfile.website}
                            onChange={(e) => setEditedProfile({ ...editedProfile, website: e.target.value })}
                            placeholder="https://example.com"
                          />
                        ) : (
                          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                            <Globe className="w-5 h-5 text-gray-500" />
                            <span className="text-sm break-all">{profile.website || "-"}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Location Section */}
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h4 className="font-nunito text-lg font-bold text-gray-900 mb-6 flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      Thông tin địa chỉ
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="country" className="text-sm font-medium">Quốc gia</Label>
                        <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg border">
                          <Globe className="w-5 h-5 text-gray-500" />
                          <span className="text-sm text-gray-700">{profile.country}</span>
                        </div>
                        <p className="text-xs text-gray-500">Quốc gia không thể thay đổi</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="province" className="text-sm font-medium">Tỉnh/Thành phố</Label>
                        {isEditing ? (
                          <Select 
                            value={editedProfile.provinceCode?.toString() || "none"} 
                            onValueChange={(value) => setEditedProfile({ ...editedProfile, provinceCode: value === "none" ? null : Number(value) })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn tỉnh/thành phố" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Chọn tỉnh/thành phố</SelectItem>
                              {provinces.map((province) => (
                                <SelectItem key={province.code} value={province.code.toString()}>
                                  {province.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                            <MapPin className="w-5 h-5 text-gray-500" />
                            <span className="text-sm">
                              {provinces.find(p => p.code === profile.provinceCode)?.name || "-"}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="address" className="text-sm font-medium">Địa chỉ chi tiết</Label>
                        {isEditing ? (
                          <Input
                            id="address"
                            value={editedProfile.address}
                            onChange={(e) => setEditedProfile({ ...editedProfile, address: e.target.value })}
                            placeholder="Nhập địa chỉ chi tiết"
                          />
                        ) : (
                          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                            <MapPin className="w-5 h-5 text-gray-500" />
                            <span className="text-sm">{profile.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bio Section */}
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h4 className="font-nunito text-lg font-bold text-gray-900 mb-6 flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Giới thiệu bản thân
                    </h4>
                    {isEditing ? (
                      <div className="ckeditor-container" style={{ height: '200px' }}>
                        <CKEditor
                          editor={ClassicEditor}
                          data={editedProfile.bio}
                          onChange={(event, editor) => {
                            const data = editor.getData();
                            setEditedProfile({
                              ...editedProfile,
                              bio: data,
                            });
                          }}
                          config={{
                            toolbar: ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|', 'outdent', 'indent', '|', 'blockQuote', 'insertTable', 'undo', 'redo'],
                            language: 'vi'
                          }}
                        />
                      </div>
                    ) : (
                      <div className="p-4 bg-white rounded-lg border">
                        {profile.bio ? (
                          <div 
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: profile.bio }}
                          />
                        ) : (
                          <span className="text-gray-500">Chưa có giới thiệu</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Social Media Section */}
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h4 className="font-nunito text-lg font-bold text-gray-900 mb-6 flex items-center">
                      <Globe className="w-5 h-5 mr-2" />
                      Mạng xã hội
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="facebook" className="text-sm font-medium flex items-center">
                          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="#1877F2">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                          Facebook
                        </Label>
                        {isEditing ? (
                          <Input
                            id="facebook"
                            value={editedProfile.socialMedia.facebook}
                            onChange={(e) => setEditedProfile({
                              ...editedProfile,
                              socialMedia: { ...editedProfile.socialMedia, facebook: e.target.value }
                            })}
                            placeholder="https://facebook.com/username"
                          />
                        ) : (
                          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                            <span className="text-sm break-all">{profile.socialMedia.facebook || "-"}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="instagram" className="text-sm font-medium flex items-center">
                          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="#E4405F">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                          Instagram
                        </Label>
                        {isEditing ? (
                          <Input
                            id="instagram"
                            value={editedProfile.socialMedia.instagram}
                            onChange={(e) => setEditedProfile({
                              ...editedProfile,
                              socialMedia: { ...editedProfile.socialMedia, instagram: e.target.value }
                            })}
                            placeholder="https://instagram.com/username"
                          />
                        ) : (
                          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                            <span className="text-sm break-all">{profile.socialMedia.instagram || "-"}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="twitter" className="text-sm font-medium flex items-center">
                          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="#1DA1F2">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                          </svg>
                          X (Twitter)
                        </Label>
                        {isEditing ? (
                          <Input
                            id="twitter"
                            value={editedProfile.socialMedia.twitter}
                            onChange={(e) => setEditedProfile({
                              ...editedProfile,
                              socialMedia: { ...editedProfile.socialMedia, twitter: e.target.value }
                            })}
                            placeholder="https://x.com/username"
                          />
                        ) : (
                          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                            <span className="text-sm break-all">{profile.socialMedia.twitter || "-"}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="zalo" className="text-sm font-medium flex items-center">
                          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="#0068FF">
                            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 15h-1v-6h1v6zm2 0h-1v-6h1v6zm3 0h-1v-6h1v6z"/>
                          </svg>
                          Zalo
                        </Label>
                        {isEditing ? (
                          <Input
                            id="zalo"
                            value={editedProfile.socialMedia.zalo}
                            onChange={(e) => setEditedProfile({
                              ...editedProfile,
                              socialMedia: { ...editedProfile.socialMedia, zalo: e.target.value }
                            })}
                            placeholder="Zalo ID hoặc link"
                          />
                        ) : (
                          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                            <span className="text-sm break-all">{profile.socialMedia.zalo || "-"}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tiktok" className="text-sm font-medium flex items-center">
                          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="#000000">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                          </svg>
                          TikTok
                        </Label>
                        {isEditing ? (
                          <Input
                            id="tiktok"
                            value={editedProfile.socialMedia.tiktok}
                            onChange={(e) => setEditedProfile({
                              ...editedProfile,
                              socialMedia: { ...editedProfile.socialMedia, tiktok: e.target.value }
                            })}
                            placeholder="https://tiktok.com/@username"
                          />
                        ) : (
                          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                            <span className="text-sm break-all">{profile.socialMedia.tiktok || "-"}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="youtube" className="text-sm font-medium flex items-center">
                          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="#FF0000">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                          YouTube
                        </Label>
                        {isEditing ? (
                          <Input
                            id="youtube"
                            value={editedProfile.socialMedia.youtube}
                            onChange={(e) => setEditedProfile({
                              ...editedProfile,
                              socialMedia: { ...editedProfile.socialMedia, youtube: e.target.value }
                            })}
                            placeholder="https://youtube.com/@username"
                          />
                        ) : (
                          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                            <span className="text-sm break-all">{profile.socialMedia.youtube || "-"}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Preferences Section */}
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h4 className="font-nunito text-lg font-bold text-gray-900 mb-6 flex items-center">
                      <Settings className="w-5 h-5 mr-2" />
                      Tùy chọn
                    </h4>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="emailMarketing" className="text-sm font-medium">Nhận email khuyến mãi</Label>
                          <p className="text-xs text-gray-500">Đồng ý nhận thông tin khuyến mãi và cập nhật từ TouriMate</p>
                        </div>
                        {isEditing ? (
                          <Checkbox
                            id="emailMarketing"
                            checked={editedProfile.acceptEmailMarketing}
                            onCheckedChange={(checked) => setEditedProfile({
                              ...editedProfile,
                              acceptEmailMarketing: checked as boolean
                            })}
                          />
                        ) : (
                          <div className="flex items-center">
                            {profile.acceptEmailMarketing ? (
                              <Check className="w-5 h-5 text-green-500" />
                            ) : (
                              <X className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* System Information Section */}
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h4 className="font-nunito text-lg font-bold text-gray-900 mb-6 flex items-center">
                      <CalendarIcon className="w-5 h-5 mr-2" />
                      Thông tin hệ thống
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                        <CalendarIcon className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">Đăng nhập lần cuối</p>
                          <p className="text-xs text-gray-500">
                            {profile.lastLoginAt || "Chưa có thông tin"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      Thông tin hệ thống chỉ đọc, không thể thay đổi
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Booked Tours Tab */}
            {activeTab === "tours" && (
              <div className="bg-white rounded-[20px] p-6 md:p-8 shadow-lg">
                <h3 className="font-itim text-2xl md:text-3xl text-black mb-8">
                  Tour đã đặt
                </h3>
                
                {bookingsLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tour-blue"></div>
                    <span className="ml-3 text-gray-600">Đang tải...</span>
                  </div>
                ) : bookedTours.length === 0 ? (
                  <div className="text-center py-12">
                    <h4 className="font-nunito text-lg font-medium text-gray-600 mb-2">
                      Chưa có tour nào được đặt
                    </h4>
                    <p className="text-gray-500 mb-6">
                      Hãy khám phá và đặt tour đầu tiên của bạn!
                    </p>
                    <button
                      onClick={() => navigate("/tours")}
                      className="bg-tour-blue hover:bg-tour-dark-blue text-white px-6 py-3 rounded-lg transition-colors duration-200 font-nunito font-medium"
                    >
                      Khám phá tour
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {bookedTours.map((booking) => (
                      <div
                        key={booking.id}
                        className="border border-gray-200 rounded-[15px] p-6 hover:shadow-lg transition-shadow duration-300"
                      >
                        <div className="flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-6">
                          <img
                            src={getTourImage(booking.tour.images)}
                            alt={booking.tour.title}
                            className="w-full md:w-32 h-32 object-cover rounded-[10px]"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-nunito text-xl font-bold text-black">
                                {booking.tour.title}
                              </h4>
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}
                              >
                                {getStatusText(booking.status)}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2 text-gray-600">
                                  <CalendarIcon className="w-4 h-4" />
                                  <span className="font-nunito text-sm">
                                    Ngày khởi hành: {formatDate(booking.tourAvailability.date)}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 text-gray-600">
                                  <MapPin className="w-4 h-4" />
                                  <span className="font-nunito text-sm">
                                    Điểm khởi hành: {booking.tourAvailability.departurePoint || "Chưa cập nhật"}
                                  </span>
                                </div>
                                {booking.tourAvailability.vehicle && (
                                  <div className="flex items-center space-x-2 text-gray-600">
                                    <Globe className="w-4 h-4" />
                                    <span className="font-nunito text-sm">
                                      Phương tiện: {booking.tourAvailability.vehicle}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2 text-gray-600">
                                  <User className="w-4 h-4" />
                                  <span className="font-nunito text-sm">
                                    Số người: {booking.adultCount} người lớn, {booking.childCount} trẻ em
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 text-gray-600">
                                  <span className="font-nunito text-sm font-medium text-tour-blue">
                                    Tổng tiền: {formatPrice(booking.totalAmount)}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 text-gray-600">
                                  <span className="font-nunito text-sm">
                                    Mã đặt tour: {booking.bookingNumber}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Contact Information */}
                            {booking.contactInfo && (() => {
                              const contact = getContactInfo(booking.contactInfo);
                              return contact.name || contact.email || contact.phone ? (
                                <div className="bg-blue-50 p-3 rounded-lg mb-4">
                                  <h5 className="font-medium text-blue-900 mb-2">Thông tin liên hệ</h5>
                                  <div className="space-y-1 text-sm text-blue-800">
                                    {contact.name && <p><span className="font-medium">Tên:</span> {contact.name}</p>}
                                    {contact.email && <p><span className="font-medium">Email:</span> {contact.email}</p>}
                                    {contact.phone && <p><span className="font-medium">SĐT:</span> {contact.phone}</p>}
                                  </div>
                                </div>
                              ) : null;
                            })()}

                            {booking.specialRequests && (
                              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Yêu cầu đặc biệt:</span> {booking.specialRequests}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col space-y-2 min-w-[140px]">
                            <button
                              onClick={() => navigate(`/tour/${booking.tour.id}`)}
                              className="flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 text-black px-4 py-2 rounded-lg transition-colors duration-200"
                            >
                              <Eye className="w-4 h-4" />
                              <span className="font-nunito">Xem tour</span>
                            </button>
                            
                            {booking.status === "PendingPayment" && (
                              <button
                                onClick={() => handleContinuePayment(booking)}
                                className="flex items-center justify-center space-x-2 bg-tour-blue hover:bg-tour-dark-blue text-white px-4 py-2 rounded-lg transition-colors duration-200"
                              >
                                <CreditCard className="w-4 h-4" />
                                <span className="font-nunito">Thanh toán</span>
                              </button>
                            )}
                            
                            {(booking.status === "PendingPayment" || booking.status === "Confirmed") && (
                              <button
                                onClick={() => openCancelDialog(booking.id)}
                                className="flex items-center justify-center space-x-2 bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg transition-colors duration-200"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="font-nunito">Hủy tour</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Favorite Tours Tab */}
            {activeTab === "favorites" && (
              <div className="bg-white rounded-[20px] p-6 md:p-8 shadow-lg">
                <h3 className="font-itim text-2xl md:text-3xl text-black mb-8">
                  Tour yêu thích
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {favoriteTours.map((tour) => (
                    <div
                      key={tour.id}
                      className="border border-gray-200 rounded-[15px] overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                      onClick={() => navigate(`/tour/${tour.id}`)}
                    >
                      <div className="relative">
                        <img
                          src={tour.image}
                          alt={tour.title}
                          className="w-full h-48 object-cover"
                        />
                        <button className="absolute top-3 right-3 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-all duration-200">
                          <Heart className="w-5 h-5 text-red-500 fill-current" />
                        </button>
                      </div>
                      <div className="p-4">
                        <h4 className="font-nunito text-lg font-bold text-black mb-2">
                          {tour.title}
                        </h4>
                        <div className="flex items-center space-x-1 mb-3">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="font-nunito text-sm text-gray-600">
                            {tour.location}
                          </span>
                        </div>
                        <p className="font-nunito text-lg font-bold text-tour-blue">
                          {tour.price}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* Notification Settings Tab */}
            {activeTab === "notifications" && (
              <div className="bg-white rounded-[20px] p-6 md:p-8 shadow-lg">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-itim text-2xl md:text-3xl text-black">
                    Cài đặt thông báo
                  </h3>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-2 bg-tour-blue hover:bg-tour-teal text-white px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="font-nunito">Chỉnh sửa</span>
                    </button>
                  ) : (
                    <div className="flex space-x-3">
                      <button
                        onClick={handleSaveProfile}
                        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                      >
                        <Save className="w-4 h-4" />
                        <span className="font-nunito">Lưu</span>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                      >
                        <X className="w-4 h-4" />
                        <span className="font-nunito">Hủy</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="border border-gray-200 rounded-[15px] p-6">
                    <h4 className="font-nunito text-lg font-bold text-black mb-4 flex items-center">
                      <Bell className="w-5 h-5 mr-2" />
                      Thông báo qua Email
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Thông báo đặt tour</Label>
                          <p className="text-xs text-gray-500">Nhận email khi có đặt tour mới</p>
                        </div>
                        {isEditing ? (
                          <Checkbox
                            checked={editedProfile.notificationSettings.emailNotifications}
                            onCheckedChange={(checked) =>
                              setEditedProfile({
                                ...editedProfile,
                                notificationSettings: {
                                  ...editedProfile.notificationSettings,
                                  emailNotifications: checked as boolean,
                                },
                              })
                            }
                          />
                        ) : (
                          <div className="flex items-center">
                            {profile.notificationSettings.emailNotifications ? (
                              <Check className="w-5 h-5 text-green-500" />
                            ) : (
                              <X className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Email khuyến mãi</Label>
                          <p className="text-xs text-gray-500">Nhận thông tin về chương trình khuyến mãi</p>
                        </div>
                        {isEditing ? (
                          <Checkbox
                            checked={editedProfile.notificationSettings.marketingEmails}
                            onCheckedChange={(checked) =>
                              setEditedProfile({
                                ...editedProfile,
                                notificationSettings: {
                                  ...editedProfile.notificationSettings,
                                  marketingEmails: checked as boolean,
                                },
                              })
                            }
                          />
                        ) : (
                          <div className="flex items-center">
                            {profile.notificationSettings.marketingEmails ? (
                              <Check className="w-5 h-5 text-green-500" />
                            ) : (
                              <X className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-[15px] p-6">
                    <h4 className="font-nunito text-lg font-bold text-black mb-4 flex items-center">
                      <Phone className="w-5 h-5 mr-2" />
                      Thông báo qua SMS
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Thông báo SMS</Label>
                          <p className="text-xs text-gray-500">Nhận thông báo qua tin nhắn SMS</p>
                        </div>
                        {isEditing ? (
                          <Checkbox
                            checked={editedProfile.notificationSettings.smsNotifications}
                            onCheckedChange={(checked) =>
                              setEditedProfile({
                                ...editedProfile,
                                notificationSettings: {
                                  ...editedProfile.notificationSettings,
                                  smsNotifications: checked as boolean,
                                },
                              })
                            }
                          />
                        ) : (
                          <div className="flex items-center">
                            {profile.notificationSettings.smsNotifications ? (
                              <Check className="w-5 h-5 text-green-500" />
                            ) : (
                              <X className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-[15px] p-6">
                    <h4 className="font-nunito text-lg font-bold text-black mb-4 flex items-center">
                      <Settings className="w-5 h-5 mr-2" />
                      Thông báo Push
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">Thông báo Push</Label>
                          <p className="text-xs text-gray-500">Nhận thông báo trên thiết bị</p>
                        </div>
                        {isEditing ? (
                          <Checkbox
                            checked={editedProfile.notificationSettings.pushNotifications}
                            onCheckedChange={(checked) =>
                              setEditedProfile({
                                ...editedProfile,
                                notificationSettings: {
                                  ...editedProfile.notificationSettings,
                                  pushNotifications: checked as boolean,
                                },
                              })
                            }
                          />
                        ) : (
                          <div className="flex items-center">
                            {profile.notificationSettings.pushNotifications ? (
                              <Check className="w-5 h-5 text-green-500" />
                            ) : (
                              <X className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-300 py-12 md:py-20 mt-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="font-nunito text-lg md:text-xl text-black">
              © 2024 Travel Guide Vietnam. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Cancellation Dialog */}
      {selectedBookingId && (
        <CancellationDialog
          open={showCancellationDialog}
          onOpenChange={setShowCancellationDialog}
          bookingId={selectedBookingId}
          onCancelSuccess={handleCancellationSuccess}
        />
      )}
    </div>
  );
}
