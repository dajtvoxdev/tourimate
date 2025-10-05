import { useParams, useNavigate } from "react-router-dom";
import { User, ChevronDown, LogOut, MapPin, Calendar, Star } from "lucide-react";

const mockGuides = [
  {
    id: 1,
    name: "Nguyễn văn A",
    description:
      "Là một hướng dẫn viên du lịch chuyên nghiệp với hơn 5 năm kinh nghiệm trong việc đồng hành và chia sẻ vẻ đẹp của Việt Nam đến với bạn bè trong và ngoài nước.",
    image:
      "https://cdn.builder.io/api/v1/image/assets/TEMP/2168645f531d28b82837c632f89d3ed0ceaf4956?width=720",
    location: "Hà Nội, Việt Nam",
    rating: 4.8,
    totalReviews: 120,
    tours: [
      {
        id: 101,
        title: "Tour Phú Quốc 3N2Đ",
        image: "https://cdn.builder.io/api/v1/image/assets/TEMP/7c497dcdbb3d5217867134b17d46c87fa56fe8cf?width=736",
        date: "25/12/2024",
        price: "3.500.000 VND",
      },
      {
        id: 102,
        title: "Tour Đà Lạt săn mây",
        image: "https://cdn.builder.io/api/v1/image/assets/TEMP/a6a6b19a1b5bd896d9f2536f27b5b57ab8c9128e?width=1082",
        date: "10/01/2025",
        price: "2.800.000 VND",
      },
    ],
  },
  // Thêm các hướng dẫn viên khác nếu cần
];

export default function GuideDetail() {
  const { guideId } = useParams();
  const navigate = useNavigate();
  // Lấy hướng dẫn viên theo id (mock)
  const guide = mockGuides.find((g) => g.id === Number(guideId)) || mockGuides[0];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="relative z-20 p-4 md:p-6 bg-white shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <nav className="flex space-x-6 md:space-x-8">
            <button onClick={() => navigate("/home")} className="bg-gray-200 hover:bg-tour-teal transition-colors duration-200 px-6 py-2 rounded-2xl">
              <span className="font-nunito text-lg md:text-xl font-bold text-black">Trang chủ</span>
            </button>
            <button onClick={() => navigate("/about")} className="bg-gray-200 hover:bg-tour-teal transition-colors duration-200 px-6 py-2 rounded-2xl">
              <span className="font-nunito text-lg md:text-xl font-bold text-black">Về chúng tôi</span>
            </button>
            <button onClick={() => navigate("/tour-guides")} className="bg-tour-teal hover:bg-tour-blue transition-colors duration-200 px-6 py-2 rounded-2xl">
              <span className="font-nunito text-lg md:text-xl font-bold text-black">Hướng dẫn viên</span>
            </button>
          </nav>
        </div>
      </header>
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-[30px] shadow-2xl border border-gray-100 p-8 md:p-12 flex flex-col md:flex-row gap-10 items-center">
          {/* Avatar & Info */}
          <div className="flex flex-col items-center md:items-start min-w-[200px]">
            <img src={guide.image} alt={guide.name} className="w-40 h-40 rounded-full object-cover mb-4 border-4 border-tour-blue" />
            <h1 className="font-itim text-3xl md:text-4xl text-black mb-2">{guide.name}</h1>
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="w-5 h-5 text-tour-blue" />
              <span className="font-nunito text-base text-gray-700">{guide.location}</span>
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <Star className="w-5 h-5 text-yellow-500 fill-current" />
              <span className="font-nunito text-base text-black">{guide.rating} ({guide.totalReviews} đánh giá)</span>
            </div>
          </div>
          {/* Description & Tours */}
          <div className="flex-1">
            <h2 className="font-josefin text-2xl md:text-3xl text-tour-blue mb-4">Giới thiệu</h2>
            <p className="font-nunito text-lg text-gray-700 mb-6">{guide.description}</p>
            <h3 className="font-itim text-xl md:text-2xl text-black mb-4">Các tour đang dẫn</h3>
            <div className="space-y-4">
              {guide.tours.map((tour) => (
                <div key={tour.id} className="flex items-center gap-4 border border-gray-200 rounded-[15px] p-4 hover:shadow-lg transition-shadow duration-300">
                  <img src={tour.image} alt={tour.title} className="w-20 h-20 object-cover rounded-[10px]" />
                  <div className="flex-1">
                    <h4 className="font-nunito text-lg font-bold text-black">{tour.title}</h4>
                    <div className="flex items-center space-x-3 text-gray-600 text-sm mt-1">
                      <Calendar className="w-4 h-4" />
                      <span>{tour.date}</span>
                      <span className="font-nunito font-medium text-tour-blue">{tour.price}</span>
                    </div>
                  </div>
                  <button onClick={() => navigate(`/tour/${tour.id}`)} className="bg-tour-blue hover:bg-tour-teal text-white px-4 py-2 rounded-lg font-nunito font-bold transition-colors duration-200">Xem tour</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 