import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, MapPin, Calendar, Bus } from "lucide-react";
import Header from "./Header";

interface TourCard {
  id: number;
  title: string;
  duration: string;
  price: string;
  image: string;
}

interface FeaturedTour {
  id: number;
  title: string;
  duration: string;
  price: string;
  image: string;
}

export default function TourHomepage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const featuredTours: FeaturedTour[] = [
    {
      id: 1,
      title: "Tour guide tại Nha Trang",
      duration: "3 ngày 2 đêm",
      price: "3.000.00 vnd",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/10b1097fd1534995ce1aa5277ebd0f9aa1c19f7d?width=1082",
    },
    {
      id: 2,
      title: "Tour guide tại Đà Lạt",
      duration: "3 ngày 2 đêm",
      price: "3.000.00 vnd",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/a6a6b19a1b5bd896d9f2536f27b5b57ab8c9128e?width=1082",
    },
  ];

  const tours: TourCard[] = [
    {
      id: 1,
      title: "Tour guide tại Huế",
      duration: "3 ngày 2 đêm",
      price: "3.000.00 vnd",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/70f355664edb43207aa25e7eb2be8c8bda964238?width=736",
    },
    {
      id: 2,
      title: "Tour guide tại Hạ Long",
      duration: "3 ngày 2 đêm",
      price: "3.000.00 vnd",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/766e14260b99570779920f49b71b00c9bcaf78e4?width=736",
    },
    {
      id: 3,
      title: "Tour guide tại Hà Nội",
      duration: "3 ngày 2 đêm",
      price: "3.000.00 vnd",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/fce4a98885859abda418e55d05541e706c1550c9?width=736",
    },
    {
      id: 4,
      title: "Tour guide tại Hạ Long",
      duration: "3 ngày 2 đêm",
      price: "3.000.00 vnd",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/13916259c3f24770257988fa8afa0bf40080376b?width=736",
    },
    {
      id: 5,
      title: "Tour guide tại Phú Quốc",
      duration: "3 ngày 2 đêm",
      price: "3.000.00 vnd",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/7c497dcdbb3d5217867134b17d46c87fa56fe8cf?width=736",
    },
    {
      id: 6,
      title: "Tour guide tại Đà Lạt",
      duration: "3 ngày 2 đêm",
      price: "3.000.00 vnd",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/fa1a83ebd7b4644d4cb9922971198e3c2748b67e?width=736",
    },
    {
      id: 7,
      title: "Tour guide tại Đồng sen Trà Lý",
      duration: "3 ngày 2 đêm",
      price: "3.000.00 vnd",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/95f4f31dfafb6a002ae452e8b3ca1096cb134d1d?width=736",
    },
    {
      id: 8,
      title: "Tour guide đảo Cát Bà",
      duration: "3 ngày 2 đêm",
      price: "3.000.00 vnd",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/412af725b9b93d72e5e52584c6386495176d188e?width=736",
    },
    {
      id: 9,
      title: "Tour guide Tam Cốc - Bích Động",
      duration: "3 ngày 2 đêm",
      price: "3.000.00 vnd",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/12450ff5678b9542035fd74d82e0c3861b1295ae?width=736",
    },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredTours.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + featuredTours.length) % featuredTours.length,
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section
        className="relative min-h-[500px] md:min-h-[700px] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://cdn.builder.io/api/v1/image/assets/TEMP/63b4c457c84f25d77787717a687e234d71e49dd0?width=2570')",
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Side - Title */}
            <div className="text-left">
              <h1 className="font-josefin text-4xl md:text-6xl lg:text-8xl font-bold text-white leading-tight">
                Thiên đường đảo ngọc Phú Quốc
              </h1>
            </div>

            {/* Right Side - Tour Info Card */}
            <div className="lg:mt-16">
              <div className="bg-white bg-opacity-50 rounded-[60px] p-6 md:p-8 backdrop-blur-md max-w-md mx-auto lg:mx-0">
                <div className="space-y-4 md:space-y-6">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-6 h-6 md:w-8 md:h-8 text-black mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-nunito font-bold text-lg md:text-2xl text-black">
                        Điểm đến chính:
                      </p>
                      <p className="font-nunito text-lg md:text-2xl text-black">
                        Đảo Phú Quốc, Kiên Giang
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
                        3 ngày 2 đêm / 4 ngày 3 đêm
                      </p>
                      <p className="font-nunito text-lg md:text-2xl text-black">
                        (linh hoạt theo nhu cầu)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Bus className="w-6 h-6 md:w-8 md:h-8 text-black mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-nunito font-bold text-lg md:text-2xl text-black">
                        Khởi hành:
                      </p>
                      <p className="font-nunito text-lg md:text-2xl text-black">
                        Hằng ngày từ TP.HCM, Hà Nội và các tỉnh khác
                      </p>
                    </div>
                  </div>

                  <button className="bg-tour-teal hover:bg-tour-blue transition-colors duration-200 rounded-[20px] px-8 py-4 mt-6">
                    <span className="font-nunito text-2xl md:text-3xl font-bold text-black">
                      Chi tiết
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <p className="font-josefin text-lg md:text-2xl font-bold text-black mb-4">
            Về chúng tôi
          </p>
          <h2 className="font-itim text-4xl md:text-5xl lg:text-6xl text-black font-normal">
            Những ngày hè rực rỡ
          </h2>
        </div>
      </section>

      {/* Featured Tours Carousel */}
      <section className="py-8 md:py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="relative max-w-6xl mx-auto">
            {/* Carousel Container */}
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {featuredTours.map((tour, index) => (
                  <div key={tour.id} className="w-full flex-shrink-0 px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                      {/* Tour Card */}
                      <div className="relative">
                        <img
                          src={tour.image}
                          alt={tour.title}
                          className="w-full h-64 md:h-80 lg:h-96 object-cover rounded-[30px]"
                        />
                        {/* Price Badge */}
                        <div className="absolute top-4 right-4 bg-white rounded-[20px] px-6 py-4">
                          <span className="font-nunito text-xl md:text-2xl lg:text-3xl font-bold text-black">
                            {tour.price}
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
                          {tour.duration}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
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
              {featuredTours.map((_, index) => (
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
          </div>
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

      {/* Tours Grid */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {tours.map((tour, index) => (
              <div key={tour.id} className="group">
                <div className="relative overflow-hidden rounded-[30px]">
                  <img
                    src={tour.image}
                    alt={tour.title}
                    className="w-full h-48 md:h-56 lg:h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                <div className="mt-4 space-y-2">
                  <h3 className="font-nunito text-lg md:text-xl lg:text-2xl font-bold text-black">
                    {tour.title}
                  </h3>
                  <p className="font-nunito text-lg md:text-xl lg:text-2xl font-normal text-black">
                    {tour.duration}
                  </p>

                  <div className="flex space-x-3 pt-2">
                    <button
                      onClick={() => navigate(`/tour/${tour.id}`)}
                      className="bg-tour-blue hover:bg-tour-teal transition-colors duration-200 rounded-[10px] px-4 py-2"
                    >
                      <span className="font-nunito text-lg md:text-xl lg:text-2xl font-bold text-black">
                        Đặt ngay
                      </span>
                    </button>
                    <button
                      onClick={() => navigate(`/tour/${tour.id}`)}
                      className="bg-gray-300 hover:bg-gray-400 transition-colors duration-200 rounded-[10px] px-4 py-2"
                    >
                      <span className="font-nunito text-lg md:text-xl lg:text-2xl font-bold text-black">
                        Chi tiết
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Section */}
          <div className="text-center mt-12">
            <div className="flex justify-center items-center space-x-4">
              <div className="flex space-x-2">
                <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
              </div>
              <button className="bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <ChevronRight className="w-6 h-6 text-black" />
              </button>
            </div>
          </div>
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
