import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
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
  totalTours?: number;
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
    if (guide.bio) {
      return guide.bio;
    }
    
    let description = `Hướng dẫn viên chuyên nghiệp`;
    if (guide.experience) {
      description += ` với ${guide.experience} năm kinh nghiệm`;
    }
    if (guide.specialties && guide.specialties.length > 0) {
      description += ` chuyên về ${guide.specialties.join(', ')}`;
    }
    description += ` trong việc đồng hành và chia sẻ vẻ đẹp của Việt Nam.`;
    
    return description;
  };

  const getGuideImage = (guide: TourGuide) => {
    if (guide.avatar) {
      return guide.avatar;
    }
    // Default placeholder image
    return "https://cdn.builder.io/api/v1/image/assets/TEMP/2168645f531d28b82837c632f89d3ed0ceaf4956?width=720";
  };

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
                <img
                    src={getGuideImage(guide)}
                    alt={getGuideDisplayName(guide)}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="p-6">
                  <h3 className="font-nunito text-xl font-bold text-black mb-2">
                      {getGuideDisplayName(guide)}
                  </h3>
                    <p className="font-nunito text-base text-gray-700 mb-4 line-clamp-3">
                      {getGuideDescription(guide)}
                    </p>
                    
                    {/* Guide Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      {guide.rating && (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span>{guide.rating.toFixed(1)}</span>
                          {guide.totalReviews && <span>({guide.totalReviews})</span>}
                        </div>
                      )}
                      {guide.totalTours && (
                        <div className="flex items-center gap-1">
                          <span>📅</span>
                          <span>{guide.totalTours} tour</span>
                        </div>
                      )}
                      {guide.experience && (
                        <div className="flex items-center gap-1">
                          <span>⭐</span>
                          <span>{guide.experience} năm KN</span>
                        </div>
                      )}
                    </div>
                    
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/guide/${guide.id}`); }}
                    className="bg-tour-blue hover:bg-tour-teal text-white px-4 py-2 rounded-lg font-nunito font-bold transition-colors duration-200"
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
