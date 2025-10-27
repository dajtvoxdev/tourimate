import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Calendar, Bus, Star, Users, Eye, Heart, Shield, Globe, Award, Phone, Mail } from "lucide-react";
import Header from "./Header";
import { httpJson, getApiBase } from "@/src/lib/http";

interface CompanyStats {
  totalTours: number;
  totalGuides: number;
  totalCustomers: number;
  averageRating: number;
}

export default function AboutUs() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanyStats();
  }, []);

  const fetchCompanyStats = async () => {
    try {
      setLoading(true);
      
      // Fetch company statistics from API
      const statsData = await httpJson<CompanyStats>(`${getApiBase()}/api/stats`, { skipAuth: true });
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching company stats:', err);
      // Set default stats if API fails
      setStats({
        totalTours: 0,
        totalGuides: 0,
        totalCustomers: 0,
        averageRating: 0
      });
    } finally {
      setLoading(false);
    }
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
            "url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative z-10 container mx-auto px-4 h-full flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-josefin text-4xl md:text-6xl lg:text-8xl font-bold text-white mb-6 leading-tight">
              Về TouriMate
            </h1>
            <p className="font-nunito text-xl md:text-2xl lg:text-3xl text-white max-w-4xl mx-auto">
              Đồng hành cùng bạn khám phá vẻ đẹp Việt Nam qua từng hành trình đầy ý nghĩa
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="font-josefin text-lg md:text-2xl font-bold text-tour-blue mb-4">
              Về chúng tôi
            </p>
            <h2 className="font-itim text-4xl md:text-5xl lg:text-6xl text-gray-900 font-normal mb-6">
              TouriMate - Người bạn đồng hành tin cậy
            </h2>
            <p className="font-nunito text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Chúng tôi kết nối bạn với những hướng dẫn viên chuyên nghiệp và những trải nghiệm du lịch đáng nhớ nhất
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-tour-blue" />
              </div>
              <h3 className="font-nunito text-xl font-bold text-gray-900 mb-4">
                Hướng dẫn viên chuyên nghiệp
              </h3>
              <p className="font-nunito text-gray-600 leading-relaxed">
                Đội ngũ hướng dẫn viên giàu kinh nghiệm, am hiểu sâu sắc về văn hóa và lịch sử địa phương
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-nunito text-xl font-bold text-gray-900 mb-4">
                Điểm đến đa dạng
              </h3>
              <p className="font-nunito text-gray-600 leading-relaxed">
                Từ biển đảo xanh biếc đến núi rừng hùng vĩ, khám phá mọi vẻ đẹp của Việt Nam
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-nunito text-xl font-bold text-gray-900 mb-4">
                Trải nghiệm tuyệt vời
              </h3>
              <p className="font-nunito text-gray-600 leading-relaxed">
                Cam kết mang đến những kỷ niệm đáng nhớ với dịch vụ chất lượng cao và giá cả hợp lý
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Company Story */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-itim text-3xl md:text-4xl lg:text-5xl text-black mb-8">
              Câu chuyện của chúng tôi
            </h2>
            <div className="space-y-6 text-lg md:text-xl leading-relaxed text-gray-700">
              <p className="font-nunito">
                <strong className="text-tour-blue">TouriMate</strong>{" "}
                ra đời từ tình yêu sâu sắc với đất nước Việt Nam và mong muốn
                chia sẻ những vẻ đẹp tuyệt vời này đến với mọi người. Chúng tôi
                tin rằng du lịch không chỉ là việc di chuyển từ nơi này đến nơi
                khác, mà còn là hành trình khám phá văn hóa, con người và tạo
                nên những kỷ niệm đáng nhớ.
              </p>
              <p className="font-nunito">
                Với đội ngũ hướng dẫn viên giàu kinh nghiệm và am hiểu sâu sắc
                về từng vùng miền, chúng tôi cam kết mang đến cho bạn những trải
                nghiệm du lịch chất lượng cao, an toàn và đầy cảm hứng. Từ những
                bãi biển hoang sơ của Phú Quốc đến những thửa ruộng bậc thang
                hùng vĩ của Sapa, chúng tôi sẽ dẫn bạn đi khắp 63 tỉnh thành của
                Việt Nam.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-12 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="font-itim text-3xl md:text-4xl lg:text-5xl text-black text-center mb-12">
            Thành tựu của chúng tôi
          </h2>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tour-blue"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              <div className="bg-white rounded-[20px] p-6 md:p-8 text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex justify-center mb-4">
                  <Users className="w-8 h-8 text-tour-blue" />
                </div>
                <h3 className="font-nunito text-2xl md:text-3xl lg:text-4xl font-bold text-tour-blue mb-2">
                  {stats?.totalCustomers || 0}+
                </h3>
                <p className="font-nunito text-base md:text-lg text-gray-700">
                  Khách hàng phục vụ
                </p>
              </div>
              
              <div className="bg-white rounded-[20px] p-6 md:p-8 text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex justify-center mb-4">
                  <Star className="w-8 h-8 text-yellow-500 fill-current" />
                </div>
                <h3 className="font-nunito text-2xl md:text-3xl lg:text-4xl font-bold text-tour-blue mb-2">
                  {stats?.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
                </h3>
                <p className="font-nunito text-base md:text-lg text-gray-700">
                  Đánh giá trung bình
                </p>
              </div>
              
              <div className="bg-white rounded-[20px] p-6 md:p-8 text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex justify-center mb-4">
                  <MapPin className="w-8 h-8 text-tour-blue" />
                </div>
                <h3 className="font-nunito text-2xl md:text-3xl lg:text-4xl font-bold text-tour-blue mb-2">
                  {stats?.totalTours || 0}+
                </h3>
                <p className="font-nunito text-base md:text-lg text-gray-700">
                  Tour du lịch
                </p>
              </div>
              
              <div className="bg-white rounded-[20px] p-6 md:p-8 text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex justify-center mb-4">
                  <Users className="w-8 h-8 text-tour-blue" />
                </div>
                <h3 className="font-nunito text-2xl md:text-3xl lg:text-4xl font-bold text-tour-blue mb-2">
                  {stats?.totalGuides || 0}+
                </h3>
                <p className="font-nunito text-base md:text-lg text-gray-700">
                  Hướng dẫn viên
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Core Values */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="font-itim text-3xl md:text-4xl lg:text-5xl text-black text-center mb-12">
            Giá trị cốt lõi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-tour-light-blue rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Heart className="w-10 h-10 text-tour-blue" />
              </div>
              <h3 className="font-nunito text-xl md:text-2xl font-bold text-black mb-4">
                Tận tâm
              </h3>
              <p className="font-nunito text-lg text-gray-700">
                Chúng tôi luôn đặt khách hàng làm trung tâm, tận tâm phục vụ với
                sự chân thành và nhiệt huyết.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-tour-light-blue rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Shield className="w-10 h-10 text-tour-blue" />
              </div>
              <h3 className="font-nunito text-xl md:text-2xl font-bold text-black mb-4">
                An toàn
              </h3>
              <p className="font-nunito text-lg text-gray-700">
                An toàn của khách hàng là ưu tiên hàng đầu trong mọi hoạt động
                du lịch của chúng tôi.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-tour-light-blue rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Globe className="w-10 h-10 text-tour-blue" />
              </div>
              <h3 className="font-nunito text-xl md:text-2xl font-bold text-black mb-4">
                Trải nghiệm
              </h3>
              <p className="font-nunito text-lg text-gray-700">
                Tạo ra những trải nghiệm độc đáo, khó quên giúp bạn hiểu sâu hơn
                về văn hóa Việt Nam.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-12 md:py-20 bg-cover bg-center bg-no-repeat relative"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-blue-400 bg-opacity-50"></div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h2 className="font-itim text-4xl md:text-5xl lg:text-6xl text-white font-normal">
            Bạn đã chuẩn bị gì chưa ?
          </h2>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/tours')}
              className="bg-white hover:bg-gray-100 text-tour-blue font-nunito text-xl font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Khám phá tour
            </button>
            <button 
              onClick={() => navigate('/tour-guide-registration')}
              className="bg-tour-teal hover:bg-tour-blue text-white font-nunito text-xl font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Đăng ký hướng dẫn viên
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-300 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="font-nunito text-lg md:text-xl text-black">
              © 2024 TouriMate. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}