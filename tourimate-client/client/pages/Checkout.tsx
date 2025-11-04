import { useNavigate, useLocation } from "react-router-dom";
import { User, MapPin, Calendar, Star, CreditCard } from "lucide-react";
import Footer from "../components/Footer";

// Mock data cho ví dụ
const mockUser = {
  name: "Nguyễn Văn B",
  email: "nguyenvanb@email.com",
  phone: "+84 987 654 321",
};

const mockTour = {
  id: 101,
  title: "Tour Phú Quốc 3N2Đ",
  image: "https://cdn.builder.io/api/v1/image/assets/TEMP/7c497dcdbb3d5217867134b17d46c87fa56fe8cf?width=736",
  date: "25/12/2024",
  price: "3.500.000 VND",
  location: "Phú Quốc, Kiên Giang",
};

const mockGuide = {
  id: 1,
  name: "Nguyễn văn A",
  image: "https://cdn.builder.io/api/v1/image/assets/TEMP/2168645f531d28b82837c632f89d3ed0ceaf4956?width=720",
  rating: 4.8,
  totalReviews: 120,
};

export default function Checkout() {
  const navigate = useNavigate();
  // const location = useLocation(); // Nếu muốn nhận dữ liệu từ location.state

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Thanh toán thành công! (Demo)");
    navigate("/home");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="relative z-20 p-4 md:p-6 bg-white shadow-sm">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <h1 className="font-itim text-2xl md:text-3xl text-tour-blue font-bold">Thanh toán tour</h1>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-[30px] shadow-2xl border border-gray-100 p-8 md:p-12 flex flex-col gap-8">
          {/* Thông tin người dùng */}
          <section>
            <h2 className="font-josefin text-xl md:text-2xl text-black mb-4">Thông tin khách hàng</h2>
            <div className="flex items-center gap-4 mb-2">
              <User className="w-8 h-8 text-tour-blue" />
              <span className="font-nunito text-lg font-bold text-black">{mockUser.name}</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 text-gray-700 font-nunito">
              <span>Email: {mockUser.email}</span>
              <span>Điện thoại: {mockUser.phone}</span>
            </div>
          </section>

          {/* Thông tin tour */}
          <section>
            <h2 className="font-josefin text-xl md:text-2xl text-black mb-4">Thông tin tour</h2>
            <div className="flex items-center gap-4 mb-2">
              <img src={mockTour.image} alt={mockTour.title} className="w-20 h-20 object-cover rounded-[10px] border" />
              <div>
                <h3 className="font-nunito text-lg font-bold text-black">{mockTour.title}</h3>
                <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                  <Calendar className="w-4 h-4" />
                  <span>{mockTour.date}</span>
                  <MapPin className="w-4 h-4 ml-4" />
                  <span>{mockTour.location}</span>
                </div>
                <span className="font-nunito text-base font-medium text-tour-blue block mt-1">{mockTour.price}</span>
              </div>
            </div>
          </section>

          {/* Thông tin hướng dẫn viên */}
          <section>
            <h2 className="font-josefin text-xl md:text-2xl text-black mb-4">Hướng dẫn viên</h2>
            <div className="flex items-center gap-4">
              <img src={mockGuide.image} alt={mockGuide.name} className="w-16 h-16 rounded-full object-cover border-2 border-tour-blue" />
              <div>
                <span className="font-nunito text-lg font-bold text-black">{mockGuide.name}</span>
                <div className="flex items-center gap-2 mt-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="font-nunito text-base text-black">{mockGuide.rating} ({mockGuide.totalReviews} đánh giá)</span>
                </div>
              </div>
            </div>
          </section>

          {/* Thanh toán */}
          <section>
            <h2 className="font-josefin text-xl md:text-2xl text-black mb-4">Thanh toán</h2>
            <form onSubmit={handlePayment} className="space-y-6">
              <div className="flex items-center gap-4">
                <CreditCard className="w-8 h-8 text-tour-blue" />
                <span className="font-nunito text-lg text-black">Chọn phương thức thanh toán</span>
              </div>
              <select className="w-full p-3 border border-gray-300 rounded-[15px] font-nunito text-base focus:outline-none focus:ring-2 focus:ring-tour-blue" required>
                <option value="">-- Chọn phương thức --</option>
                <option value="card">Thẻ tín dụng/Ghi nợ</option>
                <option value="bank">Chuyển khoản ngân hàng</option>
                <option value="momo">Ví MoMo</option>
                <option value="cod">Thanh toán khi đi tour</option>
              </select>
              <button type="submit" className="w-full bg-tour-blue hover:bg-tour-teal text-white font-nunito text-xl font-bold py-4 rounded-[20px] shadow-lg hover:shadow-xl transition-all duration-200">Thanh toán</button>
            </form>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
} 