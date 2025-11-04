import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  User,
  ChevronDown,
  LogOut,
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Clock,
  Star,
  Heart,
  Share2,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Footer from "./Footer";

interface TourImage {
  id: number;
  url: string;
  alt: string;
}

interface Review {
  id: number;
  name: string;
  rating: number;
  comment: string;
  date: string;
  avatar: string;
}

interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  activities: string[];
}

interface SimilarTour {
  id: number;
  title: string;
  image: string;
  price: string;
  duration: string;
  rating: number;
}

export default function TourDetail() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");
  const [groupSize, setGroupSize] = useState(2);
  const navigate = useNavigate();
  const { tourId } = useParams();

  const handleLogout = () => {
    navigate("/");
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  // Mock tour data - in real app, this would come from API based on tourId
  const tour = {
    id: tourId || "1",
    title: "Tour guide tại Phú Quốc",
    subtitle: "Thiên đường đảo ngọc",
    description:
      "Khám phá vẻ đẹp tuyệt vời của đảo ngọc Phú Quốc với những bãi biển hoang sơ, làng chài truyền thống và ẩm thực đặc sắc. Chuyến đi sẽ đưa bạn đến những điểm đến nổi tiếng nhất của hòn đảo xinh đẹp này.",
    price: "3.500.000",
    originalPrice: "4.200.000",
    duration: "3 ngày 2 đêm",
    groupSize: "2-15 người",
    rating: 4.8,
    totalReviews: 124,
    location: "Phú Quốc, Kiên Giang",
    mainImage:
      "https://cdn.builder.io/api/v1/image/assets/TEMP/63b4c457c84f25d77787717a687e234d71e49dd0?width=2570",
    creator: {
      name: "Nguyễn Văn A",
      avatar: "https://cdn.builder.io/api/v1/image/assets/TEMP/2168645f531d28b82837c632f89d3ed0ceaf4956?width=720"
    }
  };

  const tourImages: TourImage[] = [
    {
      id: 1,
      url: "https://cdn.builder.io/api/v1/image/assets/TEMP/63b4c457c84f25d77787717a687e234d71e49dd0?width=2570",
      alt: "Phú Quốc beach view",
    },
    {
      id: 2,
      url: "https://cdn.builder.io/api/v1/image/assets/TEMP/7c497dcdbb3d5217867134b17d46c87fa56fe8cf?width=736",
      alt: "Phú Quốc sunset",
    },
    {
      id: 3,
      url: "https://cdn.builder.io/api/v1/image/assets/TEMP/ac22f2485a263f666b244c562a91c2c171ea8b4e?width=2880",
      alt: "Phú Quốc boat tour",
    },
    {
      id: 4,
      url: "https://cdn.builder.io/api/v1/image/assets/TEMP/cf453166b1b410b448124e644a9cd0080e77891c?width=2304",
      alt: "Phú Quốc island view",
    },
  ];

  const itinerary: ItineraryDay[] = [
    {
      day: 1,
      title: "Khám phá thành phố Dương Đông",
      description: "Tham quan trung tâm thành phố và chợ đêm Dương Đông",
      activities: [
        "Đón khách tại sân bay Phú Quốc",
        "Check-in khách sạn và nghỉ ngơi",
        "Tham quan chợ đêm Dương Đông",
        "Thưởng thức hải sản tươi sống",
      ],
    },
    {
      day: 2,
      title: "Tour khám phá đảo Nam",
      description: "Khám phá những điểm đến đẹp nhất phía Nam đảo",
      activities: [
        "Thăm làng chài Hàm Ninh",
        "Tham quan nhà thùng sản xuất nước mắm",
        "Tắm biển tại bãi Sao",
        "Ngắm hoàng hôn tại mũi Gành Dầu",
      ],
    },
    {
      day: 3,
      title: "Trải nghiệm cáp treo và về",
      description: "Chinh phục cáp treo dài nhất thế giới",
      activities: [
        "Trải nghiệm cáp treo Hòn Thơm",
        "Tham quan Aquatopia Water Park",
        "Mua sắm đặc sản tại Ben Thanh Market",
        "Tiễn khách ra sân bay",
      ],
    },
  ];

  const reviews: Review[] = [
    {
      id: 1,
      name: "Nguyễn Thị Mai",
      rating: 5,
      comment:
        "Chuyến đi tuyệt vời! Hướng dẫn viên rất chuyên nghiệp và nhiệt tình. Phú Quốc thật sự là thiên đường!",
      date: "15/12/2024",
      avatar:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/2168645f531d28b82837c632f89d3ed0ceaf4956?width=720",
    },
    {
      id: 2,
      name: "Trần Văn Nam",
      rating: 4,
      comment:
        "Tour được tổ chức rất tốt, lịch trình hợp lý. Đặc biệt ấn tượng với bãi Sao và cáp treo Hòn Thơm.",
      date: "10/12/2024",
      avatar:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/db84159ff10c8b7bceb41b0f85ded4139e62ae21?width=712",
    },
  ];

  const similarTours: SimilarTour[] = [
    {
      id: 2,
      title: "Tour guide tại Nha Trang",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/10b1097fd1534995ce1aa5277ebd0f9aa1c19f7d?width=1082",
      price: "2.800.000",
      duration: "3 ngày 2 đêm",
      rating: 4.6,
    },
    {
      id: 3,
      title: "Tour guide tại Đà Lạt",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/a6a6b19a1b5bd896d9f2536f27b5b57ab8c9128e?width=1082",
      price: "2.200.000",
      duration: "2 ngày 1 đêm",
      rating: 4.7,
    },
    {
      id: 4,
      title: "Tour guide tại Hạ Long",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/766e14260b99570779920f49b71b00c9bcaf78e4?width=736",
      price: "3.200.000",
      duration: "2 ngày 1 đêm",
      rating: 4.9,
    },
  ];

  const handleBooking = () => {
    navigate("/checkout");
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % tourImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + tourImages.length) % tourImages.length,
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="relative z-20 p-4 md:p-6 bg-white shadow-sm">
        <div className="flex items-center justify-between max-w-9xl mx-auto">
          {/* Back Button & Navigation */}
          <div className="flex items-center space-x-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-black hover:text-tour-blue transition-colors duration-200"
            >
              <ArrowLeft className="w-6 h-6" />
              <span className="font-nunito text-lg font-medium">Quay lại</span>
            </button>

            <nav className="hidden md:flex space-x-6">
              <button
                onClick={() => handleNavigation("/home")}
                className="bg-gray-200 hover:bg-tour-teal transition-colors duration-200 px-6 py-2 rounded-2xl"
              >
                <span className="font-nunito text-lg font-bold text-black">
                  Trang chủ
                </span>
              </button>
              <button className="bg-gray-200 hover:bg-tour-teal transition-colors duration-200 px-6 py-2 rounded-2xl">
                <span className="font-nunito text-lg font-bold text-black">
                  Về chúng tôi
                </span>
              </button>
              <button
                onClick={() => handleNavigation("/tour-guides")}
                className="bg-gray-200 hover:bg-tour-teal transition-colors duration-200 px-6 py-2 rounded-2xl"
              >
                <span className="font-nunito text-lg font-bold text-black">
                  Hướng dẫn viên
                </span>
              </button>
            </nav>
          </div>

          {/* Avatar Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 bg-tour-light-blue rounded-full flex items-center justify-center">
                <User className="w-6 h-6 md:w-8 md:h-8 text-black" />
              </div>
              <ChevronDown
                className={`w-4 h-4 text-black transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="py-2">
                  <button className="w-full px-6 py-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-600" />
                    <span className="font-nunito text-lg font-medium text-black">
                      Thông tin cá nhân
                    </span>
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-6 py-3 text-left hover:bg-red-50 transition-colors duration-200 flex items-center space-x-3 text-red-600"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-nunito text-lg font-medium">
                      Đăng xuất
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-9xl mx-auto px-4 py-8">
        {/* Image Gallery Section */}
        <section className="mb-8">
          <div className="relative">
            <div className="aspect-video w-full rounded-[30px] overflow-hidden">
              <img
                src={tourImages[currentImageIndex].url}
                alt={tourImages[currentImageIndex].alt}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Image Navigation */}
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-3 shadow-lg transition-all duration-200"
            >
              <ChevronLeft className="w-6 h-6 text-black" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-3 shadow-lg transition-all duration-200"
            >
              <ChevronRight className="w-6 h-6 text-black" />
            </button>

            {/* Image Indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {tourImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                    index === currentImageIndex
                      ? "bg-white"
                      : "bg-white bg-opacity-50"
                  }`}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex space-x-3">
              <button className="bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-3 shadow-lg transition-all duration-200">
                <Heart className="w-5 h-5 text-red-500" />
              </button>
              <button className="bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-3 shadow-lg transition-all duration-200">
                <Share2 className="w-5 h-5 text-black" />
              </button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Tour Information */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title and Basic Info */}
            <section>
              <h1 className="font-itim text-4xl md:text-5xl lg:text-6xl text-black mb-4">
                {tour.title}
              </h1>
              <h2 className="font-josefin text-2xl md:text-3xl text-gray-700 mb-6">
                {tour.subtitle}
              </h2>
              <div className="flex items-center space-x-3 mb-6">
                <img src={tour.creator.avatar} alt={tour.creator.name} className="w-10 h-10 rounded-full object-cover" />
                <span className="font-nunito text-lg text-black">Hướng dẫn viên: <b>{tour.creator.name}</b></span>
              </div>

              <div className="flex flex-wrap items-center gap-6 mb-6">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-tour-blue" />
                  <span className="font-nunito text-lg text-black">
                    {tour.location}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-tour-blue" />
                  <span className="font-nunito text-lg text-black">
                    {tour.duration}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-tour-blue" />
                  <span className="font-nunito text-lg text-black">
                    {tour.groupSize}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <span className="font-nunito text-lg text-black">
                    {tour.rating} ({tour.totalReviews} đánh giá)
                  </span>
                </div>
              </div>

              <p className="font-nunito text-lg text-gray-700 leading-relaxed">
                {tour.description}
              </p>
            </section>

            {/* Itinerary */}
            <section>
              <h3 className="font-itim text-3xl md:text-4xl text-black mb-6">
                Lịch trình tour
              </h3>
              <div className="space-y-6">
                {itinerary.map((day) => (
                  <div key={day.day} className="bg-gray-50 rounded-[20px] p-6">
                    <h4 className="font-nunito text-xl md:text-2xl font-bold text-black mb-2">
                      Ngày {day.day}: {day.title}
                    </h4>
                    <p className="font-nunito text-lg text-gray-700 mb-4">
                      {day.description}
                    </p>
                    <ul className="space-y-2">
                      {day.activities.map((activity, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="font-nunito text-base text-gray-700">
                            {activity}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* Reviews */}
            <section>
              <h3 className="font-itim text-3xl md:text-4xl text-black mb-6">
                Đánh giá từ khách hàng
              </h3>
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-gray-50 rounded-[20px] p-6"
                  >
                    <div className="flex items-start space-x-4">
                      <img
                        src={review.avatar}
                        alt={review.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-nunito text-lg font-bold text-black">
                            {review.name}
                          </h4>
                          <span className="font-nunito text-sm text-gray-500">
                            {review.date}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? "text-yellow-500 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="font-nunito text-base text-gray-700">
                          {review.comment}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white rounded-[30px] shadow-2xl border border-gray-100 p-6">
                <div className="mb-6">
                  <div className="flex items-baseline space-x-3 mb-2">
                    <span className="font-nunito text-3xl font-bold text-tour-blue">
                      {tour.price.toLocaleString()} VND
                    </span>
                    <span className="font-nunito text-lg text-gray-500 line-through">
                      {tour.originalPrice.toLocaleString()} VND
                    </span>
                  </div>
                  <span className="font-nunito text-base text-gray-600">
                    /người
                  </span>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block font-nunito text-lg font-medium text-black mb-2">
                      Chọn ngày khởi hành
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-[15px] font-nunito text-base focus:outline-none focus:ring-2 focus:ring-tour-blue"
                    />
                  </div>

                  <div>
                    <label className="block font-nunito text-lg font-medium text-black mb-2">
                      Số lượng người
                    </label>
                    <select
                      value={groupSize}
                      onChange={(e) => setGroupSize(Number(e.target.value))}
                      className="w-full p-3 border border-gray-300 rounded-[15px] font-nunito text-base focus:outline-none focus:ring-2 focus:ring-tour-blue"
                    >
                      {[...Array(14)].map((_, i) => (
                        <option key={i + 2} value={i + 2}>
                          {i + 2} người
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="font-nunito text-lg text-black">
                      Tổng cộng:
                    </span>
                    <span className="font-nunito text-2xl font-bold text-tour-blue">
                      {(
                        parseInt(tour.price.replace(/\./g, "")) * groupSize
                      ).toLocaleString()}{" "}
                      VND
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleBooking}
                  className="w-full bg-tour-blue hover:bg-tour-teal transition-colors duration-200 text-white font-nunito text-xl font-bold py-4 rounded-[20px] shadow-lg hover:shadow-xl"
                >
                  Đặt tour ngay
                </button>

                <div className="mt-4 text-center">
                  <span className="font-nunito text-sm text-gray-500">
                    Miễn phí hủy trong vòng 24h
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Tours */}
        <section className="mt-12">
          <h3 className="font-itim text-3xl md:text-4xl text-black mb-8">
            Tour tương tự
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {similarTours.map((similarTour) => (
              <div
                key={similarTour.id}
                className="group cursor-pointer"
                onClick={() => navigate(`/tour/${similarTour.id}`)}
              >
                <div className="relative overflow-hidden rounded-[20px] mb-4">
                  <img
                    src={similarTour.image}
                    alt={similarTour.title}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-3 right-3 bg-white rounded-full px-3 py-1">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="font-nunito text-sm font-medium">
                        {similarTour.rating}
                      </span>
                    </div>
                  </div>
                </div>
                <h4 className="font-nunito text-xl font-bold text-black mb-2">
                  {similarTour.title}
                </h4>
                <p className="font-nunito text-base text-gray-600 mb-2">
                  {similarTour.duration}
                </p>
                <p className="font-nunito text-lg font-bold text-tour-blue">
                  {similarTour.price} VND
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
