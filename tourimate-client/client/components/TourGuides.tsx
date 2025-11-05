import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, User, MapPin, CalendarDays, Globe, Tag, Star, Link as LinkIcon, Map } from "lucide-react";
import Header from "./Header";
import Footer from "./Footer";
import { httpJson, getApiBase } from "@/src/lib/http";

interface TourGuide {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  experience?: number;
  languages?: string[];
  specialties?: string[];
  rating?: number;
  totalReviews?: number;
  age?: number | null;
  provinceName?: string | null;
  totalActiveTours?: number;
  socialMedia?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function TourGuides() {
  const navigate = useNavigate();
  const [tourGuides, setTourGuides] = useState<TourGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTourGuides();
  }, []);

  const fetchTourGuides = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch tour guides from API
      const guides = await httpJson<TourGuide[]>(`${getApiBase()}/api/guides`, { skipAuth: true });
      
      // Filter only active guides
      const activeGuides = guides.filter(guide => guide.isActive);
      setTourGuides(activeGuides);
    } catch (err) {
      console.error('Error fetching tour guides:', err);
      setError('Không thể tải danh sách hướng dẫn viên');
      setTourGuides([]);
    } finally {
      setLoading(false);
    }
  };

  const getGuideDisplayName = (guide: TourGuide) => {
    return `${guide.firstName} ${guide.lastName}`.trim();
  };

  const getGuideDescription = (guide: TourGuide) => {
    if (guide.bio && guide.bio.trim().length > 0) {
      return guide.bio;
    }

    const parts: string[] = [];

    if (typeof guide.experience === "number" && guide.experience > 0) {
      parts.push(`${guide.experience} năm kinh nghiệm`);
    }

    if (Array.isArray(guide.specialties) && guide.specialties.length > 0) {
      parts.push(`Chuyên môn: ${guide.specialties.join(', ')}`);
    }

    if (Array.isArray(guide.languages) && guide.languages.length > 0) {
      parts.push(`Ngôn ngữ: ${guide.languages.join(', ')}`);
    }

    if (typeof guide.rating === "number" && guide.rating > 0) {
      const reviews = typeof guide.totalReviews === "number" && guide.totalReviews > 0
        ? ` (${guide.totalReviews} đánh giá)`
        : "";
      parts.push(`Đánh giá: ${guide.rating.toFixed(1)}${reviews}`);
    }

    if (typeof guide.age === "number") {
      parts.push(`Tuổi: ${guide.age}`);
    }

    if (guide.provinceName && guide.provinceName.trim().length > 0) {
      parts.push(`Tỉnh/Thành: ${guide.provinceName}`);
    }

    if (typeof guide.totalActiveTours === "number" && guide.totalActiveTours > 0) {
      parts.push(`Đã dẫn dắt: ${guide.totalActiveTours} tour`);
    }

    if (guide.socialMedia) {
      try {
        const social = JSON.parse(guide.socialMedia);
        const links: string[] = [];
        if (social.facebook) links.push("Facebook");
        if (social.instagram) links.push("Instagram");
        if (social.tiktok) links.push("TikTok");
        if (social.youtube) links.push("YouTube");
        if (links.length) parts.push(`MXH: ${links.join(', ')}`);
      } catch {}
    }

    if (parts.length > 0) {
      return parts.join(' • ');
    }

    // Minimal fallback when no metadata available
    return "Hướng dẫn viên đang hoạt động";
  };

  const hasAvatar = (guide: TourGuide) => !!guide.avatar && guide.avatar.trim().length > 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section
        className="relative h-[500px] md:h-[600px] lg:h-[700px] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://cdn.builder.io/api/v1/image/assets/TEMP/ac22f2485a263f666b244c562a91c2c171ea8b4e?width=2880')",
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>

        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center max-w-9xl w-full mx-auto">
            {/* Left Side - Glassmorphism Card */}
            <div className="bg-white bg-opacity-60 backdrop-blur-md rounded-[40px] p-8 md:p-12 lg:p-16">
              <h1 className="font-josefin text-3xl md:text-5xl lg:text-6xl font-bold text-white text-center lg:text-left leading-tight">
                Hướng dẫn viên chuyên nghiệp
              </h1>
              <p className="font-nunito text-lg md:text-xl text-white text-center lg:text-left mt-4 opacity-90">
                Tham gia đội ngũ hướng dẫn viên chuyên nghiệp của chúng tôi
              </p>
            </div>

            {/* Right Side - Registration Button */}
            <div className="flex justify-center lg:justify-end">
              <button
                onClick={() => navigate("/tour-guide-registration")}
                className="bg-tour-blue hover:bg-tour-teal transition-all duration-300 hover:scale-105 active:scale-95 rounded-[30px] px-8 md:px-12 py-6 md:py-8 shadow-2xl group"
              >
                <div className="text-center">
                  <span className="font-nunito text-xl md:text-2xl lg:text-3xl font-bold text-white block mb-2">
                    Đăng kí làm hướng dẫn viên
                  </span>
                  <span className="font-nunito text-sm md:text-base text-white opacity-90">
                    Chia sẻ kinh nghiệm - Tạo thu nhập
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Page Title */}
      <section className="py-8 md:py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="font-itim text-4xl md:text-5xl lg:text-6xl text-black text-left">
            Hướng dẫn viên
          </h2>
        </div>
      </section>

      {/* Tour Guides Grid */}
      <section className="py-8 md:py-12 bg-white">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-tour-blue" />
                <p className="mt-4 text-gray-500 font-nunito">Đang tải danh sách hướng dẫn viên...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 font-nunito text-lg">{error}</p>
              <button 
                onClick={fetchTourGuides}
                className="mt-4 bg-tour-blue hover:bg-tour-teal text-white px-6 py-2 rounded-lg font-nunito font-bold transition-colors duration-200"
              >
                Thử lại
              </button>
            </div>
          ) : tourGuides.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 font-nunito text-lg">Chưa có hướng dẫn viên nào</p>
              <p className="text-gray-400 font-nunito mt-2">Hãy đăng ký làm hướng dẫn viên đầu tiên!</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {tourGuides.map((guide) => (
              <div
                key={guide.id}
                className="border border-gray-200 rounded-[20px] overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
                onClick={() => navigate(`/guide/${guide.id}`)}
              >
                {hasAvatar(guide) ? (
                  <img
                    src={guide.avatar as string}
                    alt={getGuideDisplayName(guide)}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
                    <User className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <div className="p-6 flex flex-col h-full">
                  <h3 className="font-nunito text-xl font-bold text-black mb-2">
                      {getGuideDisplayName(guide)}
                  </h3>
                    {/* Info lines */}
                    {(() => {
                      const lines: { icon: JSX.Element; text: string }[] = [];
                      if (typeof guide.age === "number") {
                        lines.push({ icon: <CalendarDays className="w-4 h-4" />, text: `Tuổi: ${guide.age}` });
                      }
                      if (guide.provinceName && guide.provinceName.trim().length > 0) {
                        lines.push({ icon: <MapPin className="w-4 h-4" />, text: `Tỉnh/Thành: ${guide.provinceName}` });
                      }
                      if (Array.isArray(guide.languages) && guide.languages.length > 0) {
                        lines.push({ icon: <Globe className="w-4 h-4" />, text: `Ngôn ngữ: ${guide.languages.join(', ')}` });
                      }
                      if (Array.isArray(guide.specialties) && guide.specialties.length > 0) {
                        lines.push({ icon: <Tag className="w-4 h-4" />, text: `Chuyên môn: ${guide.specialties.join(', ')}` });
                      }
                      if (typeof guide.totalActiveTours === "number") {
                        lines.push({ icon: <Map className="w-4 h-4" />, text: `Hướng dẫn viên của ${guide.totalActiveTours} tour` });
                      }
                      if (typeof guide.rating === "number" && guide.rating > 0) {
                        const reviews = typeof guide.totalReviews === "number" && guide.totalReviews > 0 ? ` (${guide.totalReviews})` : "";
                        lines.push({ icon: <Star className="w-4 h-4 text-yellow-500" />, text: `Đánh giá: ${guide.rating.toFixed(1)}${reviews}` });
                      }
                      if (guide.socialMedia) {
                        try {
                          const social = JSON.parse(guide.socialMedia as any);
                          const platforms: string[] = [];
                          if (social.facebook) platforms.push("Facebook");
                          if (social.instagram) platforms.push("Instagram");
                          if (social.tiktok) platforms.push("TikTok");
                          if (social.youtube) platforms.push("YouTube");
                          if (platforms.length > 0) {
                            lines.push({ icon: <LinkIcon className="w-4 h-4" />, text: `MXH: ${platforms.join(', ')}` });
                          }
                        } catch {}
                      }

                      if (lines.length === 0) {
                        return (
                          <p className="font-nunito text-base text-gray-700 mb-4 line-clamp-3">
                            {getGuideDescription(guide)}
                          </p>
                        );
                      }
                      return (
                        <ul className="font-nunito text-sm text-gray-700 mb-4 space-y-2">
                          {lines.map((l, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              {l.icon}
                              <span>{l.text}</span>
                            </li>
                          ))}
                        </ul>
                      );
                    })()}
                    
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/guide/${guide.id}`); }}
                    className="bg-tour-blue hover:bg-tour-teal text-white px-4 py-2 rounded-lg font-nunito font-bold transition-colors duration-200 mt-auto"
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            ))}
          </div>
          )}

          {/* Pagination */}
          <div className="flex justify-center items-center space-x-4 mt-12">
            <div className="flex space-x-2">
              <div className="w-9 h-9 bg-gray-300 rounded-full"></div>
              <div className="w-9 h-9 bg-gray-300 rounded-full"></div>
              <div className="w-9 h-9 bg-gray-300 rounded-full"></div>
              <div className="w-9 h-9 bg-gray-300 rounded-full"></div>
            </div>
            <button className="bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-200">
              <ArrowRight className="w-6 h-6 text-black" />
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
