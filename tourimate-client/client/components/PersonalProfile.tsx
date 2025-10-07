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
  Calendar,
  Star,
  Heart,
  Eye,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Header from "./Header";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7181";

interface BookedTour {
  id: number;
  title: string;
  image: string;
  date: string;
  status: "upcoming" | "completed" | "cancelled";
  price: string;
  rating?: number;
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
    avatar:
      "https://cdn.builder.io/api/v1/image/assets/TEMP/db84159ff10c8b7bceb41b0f85ded4139e62ae21?width=712",
  });

  const [editedProfile, setEditedProfile] = useState(profile);
  const [loading, setLoading] = useState(false);

  const formatDob = (d: string) => {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "";
    return dt.toLocaleDateString("vi-VN");
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
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("refreshTokenExpiresAt");
          toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          navigate("/login");
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data || res.statusText);
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
        };
        setProfile(next);
        setEditedProfile(next);
      } catch (e: any) {
        console.error(e);
        toast.error(e.message || "Không thể tải thông tin hồ sơ");
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    // Split name into first/last (best-effort)
    const parts = (editedProfile.name || "").trim().split(/\s+/);
    const lastName = parts.pop() || "";
    const firstName = parts.join(" ");
    const payload = {
      email: editedProfile.email,
      firstName,
      lastName,
      acceptEmailMarketing: false,
      address: editedProfile.address,
      city: undefined,
      country: "Vietnam",
      dateOfBirth: editedProfile.birthDate || null,
      bio: undefined,
      gender: editedProfile.gender || null,
      website: editedProfile.website || null,
    } as any;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
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
      const res = await fetch(`${API_BASE}/api/media/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data || res.statusText);
      const url: string = data.url;
      const next = { ...profile, avatar: url };
      setProfile(next);
      setEditedProfile((p) => ({ ...p, avatar: url }));
      // persist avatar to profile
      try {
        const payload = {
          email: next.email,
          firstName: (next.name || "").trim().split(/\s+/).slice(0, -1).join(" "),
          lastName: (next.name || "").trim().split(/\s+/).slice(-1)[0] || "",
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
        const res2 = await fetch(`${API_BASE}/api/auth/me`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (!res2.ok) {
          const text = await res2.text();
          throw new Error(text || res2.statusText);
        }
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

  // Mock data for booked tours
  const bookedTours: BookedTour[] = [
    {
      id: 1,
      title: "Tour guide tại Phú Quốc",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/7c497dcdbb3d5217867134b17d46c87fa56fe8cf?width=736",
      date: "25/12/2024",
      status: "upcoming",
      price: "3.500.000 VND",
    },
    {
      id: 2,
      title: "Tour guide tại Nha Trang",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/10b1097fd1534995ce1aa5277ebd0f9aa1c19f7d?width=1082",
      date: "10/11/2024",
      status: "completed",
      price: "2.800.000 VND",
      rating: 5,
    },
    {
      id: 3,
      title: "Tour guide tại Đà Lạt",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/a6a6b19a1b5bd896d9f2536f27b5b57ab8c9128e?width=1082",
      date: "15/10/2024",
      status: "completed",
      price: "2.200.000 VND",
      rating: 4,
    },
  ];

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "upcoming":
        return "Sắp tới";
      case "completed":
        return "Đã hoàn thành";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

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
                    onClick={() => setActiveTab("mytours")}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
                      activeTab === "mytours"
                        ? "bg-tour-light-blue text-tour-blue"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <span className="font-nunito font-medium">Quản lý tour</span>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-nunito text-sm font-medium text-gray-700 mb-2">
                      Họ và tên
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedProfile.name}
                        onChange={(e) =>
                          setEditedProfile({
                            ...editedProfile,
                            name: e.target.value,
                          })
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg font-nunito focus:outline-none focus:ring-2 focus:ring-tour-blue"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <User className="w-5 h-5 text-gray-500" />
                        <span className="font-nunito text-lg">
                          {profile.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-nunito text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editedProfile.email}
                        onChange={(e) =>
                          setEditedProfile({
                            ...editedProfile,
                            email: e.target.value,
                          })
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg font-nunito focus:outline-none focus:ring-2 focus:ring-tour-blue"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Mail className="w-5 h-5 text-gray-500" />
                        <span className="font-nunito text-lg">
                          {profile.email}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-nunito text-sm font-medium text-gray-700 mb-2">
                      Số điện thoại
                    </label>
                    <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg">
                      <Phone className="w-5 h-5 text-gray-500" />
                      <span className="font-nunito text-lg text-gray-700">
                        {profile.phone}
                      </span>
                      <span className="ml-auto text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        Đã xác thực
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Số điện thoại đã được xác thực và không thể thay đổi
                    </p>
                  </div>

                  <div>
                    <label className="block font-nunito text-sm font-medium text-gray-700 mb-2">
                      Giới tính
                    </label>
                    {isEditing ? (
                      <select
                        value={editedProfile.gender}
                        onChange={(e) =>
                          setEditedProfile({
                            ...editedProfile,
                            gender: e.target.value,
                          })
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg font-nunito focus:outline-none focus:ring-2 focus:ring-tour-blue"
                      >
                        <option value="">Không xác định</option>
                        <option value="Male">Nam</option>
                        <option value="Female">Nữ</option>
                        <option value="Other">Khác</option>
                      </select>
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <User className="w-5 h-5 text-gray-500" />
                        <span className="font-nunito text-lg">
                          {profile.gender === "Male" ? "Nam" : profile.gender === "Female" ? "Nữ" : profile.gender === "Other" ? "Khác" : "-"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-nunito text-sm font-medium text-gray-700 mb-2">
                      Ngày sinh
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editedProfile.birthDate}
                        onChange={(e) =>
                          setEditedProfile({
                            ...editedProfile,
                            birthDate: e.target.value,
                          })
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg font-nunito focus:outline-none focus:ring-2 focus:ring-tour-blue"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        <span className="font-nunito text-lg">
                              {formatDob(profile.birthDate)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-nunito text-sm font-medium text-gray-700 mb-2">
                      Địa chỉ
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedProfile.address}
                        onChange={(e) =>
                          setEditedProfile({
                            ...editedProfile,
                            address: e.target.value,
                          })
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg font-nunito focus:outline-none focus:ring-2 focus:ring-tour-blue"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <MapPin className="w-5 h-5 text-gray-500" />
                        <span className="font-nunito text-lg">
                          {profile.address}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-nunito text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    {isEditing ? (
                      <input
                        type="url"
                        value={editedProfile.website}
                        onChange={(e) =>
                          setEditedProfile({
                            ...editedProfile,
                            website: e.target.value,
                          })
                        }
                        placeholder="https://example.com"
                        className="w-full p-3 border border-gray-300 rounded-lg font-nunito focus:outline-none focus:ring-2 focus:ring-tour-blue"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <span className="font-nunito text-lg break-all">
                          {profile.website || "-"}
                        </span>
                      </div>
                    )}
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
                <div className="space-y-6">
                  {bookedTours.map((tour) => (
                    <div
                      key={tour.id}
                      className="border border-gray-200 rounded-[15px] p-6 hover:shadow-lg transition-shadow duration-300"
                    >
                      <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
                        <img
                          src={tour.image}
                          alt={tour.title}
                          className="w-full md:w-32 h-32 object-cover rounded-[10px]"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-nunito text-xl font-bold text-black">
                              {tour.title}
                            </h4>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tour.status)}`}
                            >
                              {getStatusText(tour.status)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-gray-600 mb-3">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span className="font-nunito text-sm">
                                {tour.date}
                              </span>
                            </div>
                            <span className="font-nunito text-sm font-medium text-tour-blue">
                              {tour.price}
                            </span>
                          </div>
                          {tour.status === "completed" && tour.rating && (
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < tour.rating
                                      ? "text-yellow-500 fill-current"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                              <span className="font-nunito text-sm text-gray-600 ml-2">
                                Đã đánh giá
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => navigate(`/tour/${tour.id}`)}
                            className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-black px-4 py-2 rounded-lg transition-colors duration-200"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="font-nunito">Xem</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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

            {/* My Tours Tab for Guide */}
            {activeTab === "mytours" && (
              <div className="bg-white rounded-[20px] p-6 md:p-8 shadow-lg">
                <h3 className="font-itim text-2xl md:text-3xl text-black mb-8">
                  Quản lý tour của tôi
                </h3>
                <div className="space-y-6">
                  {myTours.map((tour) => (
                    <div
                      key={tour.id}
                      className="border border-gray-200 rounded-[15px] p-6 hover:shadow-lg transition-shadow duration-300"
                    >
                      <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
                        <img
                          src={tour.image}
                          alt={tour.title}
                          className="w-full md:w-32 h-32 object-cover rounded-[10px]"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-nunito text-xl font-bold text-black">
                              {tour.title}
                            </h4>
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              Đang mở
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-gray-600 mb-3">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span className="font-nunito text-sm">
                                {tour.date}
                              </span>
                            </div>
                            <span className="font-nunito text-sm font-medium text-tour-blue">
                              {tour.price}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2 min-w-[120px]">
                          <button
                            onClick={() => navigate(`/tour/${tour.id}`)}
                            className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-black px-4 py-2 rounded-lg transition-colors duration-200"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="font-nunito">Xem</span>
                          </button>
                          <button
                            className="flex items-center space-x-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-4 py-2 rounded-lg transition-colors duration-200"
                          >
                            <Edit className="w-4 h-4" />
                            <span className="font-nunito">Sửa</span>
                          </button>
                          <button
                            className="flex items-center space-x-2 bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg transition-colors duration-200"
                          >
                            <X className="w-4 h-4" />
                            <span className="font-nunito">Xóa</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
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
    </div>
  );
}
