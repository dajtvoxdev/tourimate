import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, MapPin, Calendar, Bus, Star, Users, Eye } from "lucide-react";
import Header from "./Header";
import FeaturedTours from "./FeaturedTours";
import { TourDto } from "../types/tour";
import { TourApiService } from "../lib/tourApi";
import { useAuth } from "../src/hooks/useAuth";


export default function TourHomepage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const [featuredTours, setFeaturedTours] = useState<TourDto[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchFeaturedTours();
  }, []);

  const fetchFeaturedTours = async () => {
    try {
      setLoading(true);
      const tours = await TourApiService.getFeaturedTours(10);
      setFeaturedTours(tours);
    } catch (error) {
      console.error('Error fetching featured tours:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string = "VND") => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency === 'VND' ? 'VND' : currency,
    }).format(price);
  };

  const formatDuration = (duration: number) => {
    if (duration < 24) {
      return `${duration} giờ`;
    }
    const days = Math.floor(duration / 24);
    const hours = duration % 24;
    if (hours === 0) {
      return `${days} ngày`;
    }
    return `${days} ngày ${hours} giờ`;
  };

  // Chia tours thành 2 nhóm, mỗi nhóm 5 tour
  const firstSectionTours = featuredTours.slice(0, 5);
  const secondSectionTours = featuredTours.slice(5, 10);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % firstSectionTours.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + firstSectionTours.length) % firstSectionTours.length,
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      {loading ? (
        <section className="relative min-h-[500px] md:min-h-[700px] bg-gray-200 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-tour-blue"></div>
        </section>
      ) : featuredTours.length > 0 ? (
        <section
          className="relative min-h-[500px] md:min-h-[700px] bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: featuredTours[0].imageUrls && featuredTours[0].imageUrls.length > 0 
              ? `url('${featuredTours[0].imageUrls[0]}')`
              : "url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')",
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>

          {/* Hero Content */}
          <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Left Side - Title */}
              <div className="text-left">
                <h1 className="font-josefin text-4xl md:text-6xl lg:text-8xl font-bold text-white leading-tight">
                  {featuredTours[0].title}
                </h1>
                <div className="mt-6 flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Star className="w-6 h-6 text-yellow-400 fill-current" />
                    <span className="text-white text-xl font-semibold">
                      {featuredTours[0].averageRating.toFixed(1)}
                    </span>
                    <span className="text-white text-lg">
                      ({featuredTours[0].totalReviews} đánh giá)
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-6 h-6 text-white" />
                    <span className="text-white text-lg">
                      {featuredTours[0].totalBookings} lượt đặt
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side - Tour Info Card */}
              <div className="lg:mt-16">
                <div className="bg-white bg-opacity-90 rounded-[60px] p-6 md:p-8 backdrop-blur-md max-w-md mx-auto lg:mx-0 shadow-2xl">
                  <div className="space-y-4 md:space-y-6">
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-6 h-6 md:w-8 md:h-8 text-black mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-nunito font-bold text-lg md:text-2xl text-black">
                          Điểm đến:
                        </p>
                        <p className="font-nunito text-lg md:text-2xl text-black">
                          {featuredTours[0].location}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Calendar className="w-6 h-6 md:w-8 md:h-8 text-black mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-nunito font-bold text-lg md:text-2xl text-black">
                          Thời gian:
                        </p>
                        <p className="font-nunito text-lg md:text-2xl text-black">
                          {formatDuration(featuredTours[0].duration)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Bus className="w-6 h-6 md:w-8 md:h-8 text-black mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-nunito font-bold text-lg md:text-2xl text-black">
                          Giá từ:
                        </p>
                        <p className="font-nunito text-2xl md:text-3xl font-bold text-tour-blue">
                          {formatPrice(featuredTours[0].price, featuredTours[0].currency)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 mt-6">
                      <button 
                        onClick={() => navigate(`/tour/${featuredTours[0].id}`)}
                        className="bg-tour-teal hover:bg-tour-blue transition-colors duration-200 rounded-[20px] px-8 py-4"
                      >
                        <span className="font-nunito text-2xl md:text-3xl font-bold text-black">
                          Chi tiết
                        </span>
                      </button>
                      <button 
                        onClick={() => navigate('/tours')}
                        className="bg-tour-blue hover:bg-tour-teal transition-colors duration-200 rounded-[20px] px-8 py-4"
                      >
                        <span className="font-nunito text-2xl md:text-3xl font-bold text-black">
                          Xem tất cả tour
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="relative min-h-[500px] md:min-h-[700px] bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="font-josefin text-4xl md:text-6xl font-bold mb-4">
              Chào mừng đến với TouriMate
            </h1>
            <p className="font-nunito text-xl md:text-2xl">
              Khám phá những tour du lịch tuyệt vời
            </p>
          </div>
        </section>
      )}

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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {/* Stat 1 */}
            <div className="text-center bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-tour-blue rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-nunito text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                1000+
              </h3>
              <p className="font-nunito text-lg text-gray-600">
                Khách hàng hài lòng
              </p>
            </div>

            {/* Stat 2 */}
            <div className="text-center bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-tour-teal rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-nunito text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                50+
              </h3>
              <p className="font-nunito text-lg text-gray-600">
                Điểm đến hấp dẫn
              </p>
            </div>

            {/* Stat 3 */}
            <div className="text-center bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-nunito text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                4.8
              </h3>
              <p className="font-nunito text-lg text-gray-600">
                Đánh giá trung bình
              </p>
            </div>

            {/* Stat 4 */}
            <div className="text-center bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-nunito text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                24/7
              </h3>
              <p className="font-nunito text-lg text-gray-600">
                Hỗ trợ khách hàng
              </p>
            </div>
          </div>

          {/* Features */}
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

          {/* CTA */}
          <div className="text-center mt-16">
            <button 
              onClick={() => navigate('/tours')}
              className="bg-gradient-to-r from-tour-blue to-tour-teal hover:from-tour-teal hover:to-tour-blue text-white font-nunito text-xl font-bold py-4 px-12 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Khám phá ngay
            </button>
          </div>
        </div>
      </section>

      {/* Featured Tours Carousel - Section 1 */}
      <section className="py-8 md:py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="font-josefin text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-4">
              Tour nổi bật
            </h2>
            <p className="font-nunito text-lg md:text-xl text-gray-600">
              Những tour du lịch được yêu thích nhất
            </p>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tour-blue"></div>
            </div>
          ) : (
            <div className="relative max-w-6xl mx-auto">
              {/* Carousel Container */}
              <div className="overflow-hidden">
                <div
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {firstSectionTours.map((tour, index) => (
                    <div key={tour.id} className="w-full flex-shrink-0 px-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        {/* Tour Card */}
                        <div className="relative">
                          <img
                            src={tour.imageUrls && tour.imageUrls.length > 0 ? tour.imageUrls[0] : '/placeholder-tour.jpg'}
                            alt={tour.title}
                            className="w-full h-64 md:h-80 lg:h-96 object-cover rounded-[30px]"
                          />
                          {/* Price Badge */}
                          <div className="absolute top-4 right-4 bg-white rounded-[20px] px-6 py-4">
                            <span className="font-nunito text-xl md:text-2xl lg:text-3xl font-bold text-black">
                              {formatPrice(tour.price, tour.currency)}
                            </span>
                          </div>
                          {/* Details Button */}
                          <button
                            onClick={() => navigate(`/tour/${tour.id}`)}
                            className="absolute bottom-4 right-4 bg-tour-blue hover:bg-tour-teal transition-colors duration-200 rounded-[20px] px-6 py-4"
                          >
                            <span className="font-nunito text-xl md:text-2xl lg:text-3xl font-bold text-black">
                              Chi tiết
                            </span>
                          </button>
                        </div>

                        {/* Tour Info */}
                        <div className="space-y-4">
                          <h3 className="font-nunito text-3xl md:text-4xl lg:text-5xl font-bold text-black">
                            {tour.title}
                          </h3>
                          <p className="font-nunito text-2xl md:text-3xl lg:text-4xl font-normal text-black">
                            {formatDuration(tour.duration)}
                          </p>
                          <div className="flex items-center space-x-4 text-lg">
                            <div className="flex items-center space-x-1">
                              <Star className="w-5 h-5 text-yellow-500 fill-current" />
                              <span>{tour.averageRating.toFixed(1)} ({tour.totalReviews})</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="w-5 h-5 text-gray-500" />
                              <span>{tour.totalBookings}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Buttons */}
              {firstSectionTours.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow duration-200"
                  >
                    <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-black" />
                  </button>

                  <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow duration-200"
                  >
                    <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-black" />
                  </button>

                  {/* Dots Indicator */}
                  <div className="flex justify-center space-x-2 mt-8">
                    {firstSectionTours.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-4 h-4 rounded-full transition-colors duration-200 ${
                          index === currentSlide
                            ? "bg-tour-blue"
                            : "bg-tour-light-blue"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-12 md:py-20 bg-cover bg-center bg-no-repeat relative"
        style={{
          backgroundImage:
            "url('https://cdn.builder.io/api/v1/image/assets/TEMP/cf453166b1b410b448124e644a9cd0080e77891c?width=2304')",
        }}
      >
        <div className="absolute inset-0 bg-blue-400 bg-opacity-50"></div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h2 className="font-itim text-4xl md:text-5xl lg:text-6xl text-white font-normal">
            Bạn đã chuẩn bị gì chưa ?
          </h2>
        </div>
      </section>

      {/* Featured Tours Section - Section 2 */}
      <section className="py-8 md:py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="font-josefin text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-4">
              Tour được đánh giá cao
            </h2>
            <p className="font-nunito text-lg md:text-xl text-gray-600">
              Những tour có rating và lượt đặt cao nhất
            </p>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tour-blue"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {secondSectionTours.map((tour) => (
                <div key={tour.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
                  <div className="relative h-48">
                    <img
                      src={tour.imageUrls && tour.imageUrls.length > 0 ? tour.imageUrls[0] : '/placeholder-tour.jpg'}
                      alt={tour.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1">
                      <span className="font-bold text-lg text-gray-900">
                        {formatPrice(tour.price, tour.currency)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                      {tour.title}
                    </h3>
                    <div 
                      className="text-sm text-gray-600 line-clamp-2 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: tour.shortDescription }}
                    />
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span>{tour.averageRating.toFixed(1)} ({tour.totalReviews})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{tour.totalBookings}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{tour.viewCount}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => navigate(`/tour/${tour.id}`)}
                        className="flex-1 bg-tour-blue hover:bg-tour-teal text-white py-2 px-4 rounded-lg transition-colors duration-200"
                      >
                        Chi tiết
                      </button>
                      {!(user && user.role === "TourGuide" && tour.tourGuideId === user.id) && (
                        <button
                          onClick={() => navigate(`/tour/${tour.id}/book`)}
                          className="flex-1 bg-tour-teal hover:bg-tour-blue text-white py-2 px-4 rounded-lg transition-colors duration-200"
                        >
                          Đặt tour
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-300 py-12 md:py-20">
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
