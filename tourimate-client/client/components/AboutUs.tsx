import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  ChevronDown,
  LogOut,
  MapPin,
  Phone,
  Mail,
  Award,
  Users,
  Star,
  Heart,
  Shield,
  Globe,
} from "lucide-react";

interface TeamMember {
  id: number;
  name: string;
  position: string;
  description: string;
  image: string;
  experience: string;
}

interface Achievement {
  id: number;
  title: string;
  value: string;
  icon: React.ReactNode;
}

export default function AboutUs() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const teamMembers: TeamMember[] = [
    {
      id: 1,
      name: "Nguyễn Thành Long",
      position: "Giám đốc điều hành",
      description:
        "Với hơn 10 năm kinh nghiệm trong ngành du lịch, anh Long đã dẫn dắt công ty phát triển và mở rộng khắp Việt Nam.",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/db84159ff10c8b7bceb41b0f85ded4139e62ae21?width=712",
      experience: "10+ năm",
    },
    {
      id: 2,
      name: "Trần Thị Mai",
      position: "Trưởng phòng Marketing",
      description:
        "Chuyên gia marketing du lịch với niềm đam mê chia sẻ vẻ đẹp Việt Nam đến bạn bè quốc tế.",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/2168645f531d28b82837c632f89d3ed0ceaf4956?width=720",
      experience: "7+ năm",
    },
    {
      id: 3,
      name: "Lê Văn Minh",
      position: "Trưởng phòng Tour",
      description:
        "Chuyên thiết kế và tổ chức các tour du lịch độc đáo, mang lại trải nghiệm khó quên cho du khách.",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/283482ebc0855495706c7faf4d8ce5277cf54e0b?width=710",
      experience: "8+ năm",
    },
  ];

  const achievements: Achievement[] = [
    {
      id: 1,
      title: "Khách hàng phục vụ",
      value: "50,000+",
      icon: <Users className="w-8 h-8 text-tour-blue" />,
    },
    {
      id: 2,
      title: "Đánh giá 5 sao",
      value: "98%",
      icon: <Star className="w-8 h-8 text-yellow-500 fill-current" />,
    },
    {
      id: 3,
      title: "Năm kinh nghiệm",
      value: "15+",
      icon: <Award className="w-8 h-8 text-tour-blue" />,
    },
    {
      id: 4,
      title: "Điểm đến",
      value: "63",
      icon: <MapPin className="w-8 h-8 text-tour-blue" />,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="relative z-20 p-4 md:p-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Navigation Menu */}
          <nav className="flex space-x-6 md:space-x-8">
            <button
              onClick={() => handleNavigation("/home")}
              className="bg-gray-200 hover:bg-tour-teal transition-colors duration-200 px-6 py-2 rounded-2xl"
            >
              <span className="font-nunito text-lg md:text-xl font-bold text-black">
                Trang chủ
              </span>
            </button>
            <button className="bg-tour-teal hover:bg-tour-blue transition-colors duration-200 px-6 py-2 rounded-2xl">
              <span className="font-nunito text-lg md:text-xl font-bold text-black">
                Về chúng tôi
              </span>
            </button>
            <button
              onClick={() => handleNavigation("/tour-guides")}
              className="bg-gray-200 hover:bg-tour-teal transition-colors duration-200 px-6 py-2 rounded-2xl"
            >
              <span className="font-nunito text-lg md:text-xl font-bold text-black">
                Hướng dẫn viên
              </span>
            </button>
          </nav>

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

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="py-2">
                  <button
                    onClick={() => handleNavigation("/profile")}
                    className="w-full px-6 py-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-3"
                  >
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

      {/* Hero Section */}
      <section
        className="relative h-[500px] md:h-[600px] lg:h-[700px] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://cdn.builder.io/api/v1/image/assets/TEMP/63b4c457c84f25d77787717a687e234d71e49dd0?width=2570')",
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative z-10 container mx-auto px-4 h-full flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-josefin text-4xl md:text-6xl lg:text-8xl font-bold text-white mb-6 leading-tight">
              Về Travel Guide Vietnam
            </h1>
            <p className="font-nunito text-xl md:text-2xl lg:text-3xl text-white max-w-4xl mx-auto">
              Đồng hành cùng bạn khám phá vẻ đẹp Việt Nam qua từng hành trình
              đầy ý nghĩa
            </p>
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
                <strong className="text-tour-blue">Travel Guide Vietnam</strong>{" "}
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

      {/* Achievements */}
      <section className="py-12 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="font-itim text-3xl md:text-4xl lg:text-5xl text-black text-center mb-12">
            Thành tựu của chúng tôi
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-white rounded-[20px] p-6 md:p-8 text-center shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex justify-center mb-4">
                  {achievement.icon}
                </div>
                <h3 className="font-nunito text-2xl md:text-3xl lg:text-4xl font-bold text-tour-blue mb-2">
                  {achievement.value}
                </h3>
                <p className="font-nunito text-base md:text-lg text-gray-700">
                  {achievement.title}
                </p>
              </div>
            ))}
          </div>
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

      {/* Team Section */}
      <section className="py-12 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="font-itim text-3xl md:text-4xl lg:text-5xl text-black text-center mb-12">
            Đội ngũ lãnh đạo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white rounded-[30px] overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-nunito text-xl md:text-2xl font-bold text-black">
                      {member.name}
                    </h3>
                    <span className="bg-tour-light-blue text-tour-blue px-3 py-1 rounded-full text-sm font-medium">
                      {member.experience}
                    </span>
                  </div>
                  <p className="font-nunito text-lg font-medium text-tour-blue mb-4">
                    {member.position}
                  </p>
                  <p className="font-nunito text-base text-gray-700 leading-relaxed">
                    {member.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="font-itim text-3xl md:text-4xl lg:text-5xl text-black text-center mb-12">
            Liên hệ với chúng tôi
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-tour-light-blue rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-tour-blue" />
                </div>
                <h3 className="font-nunito text-xl font-bold text-black mb-2">
                  Địa chỉ
                </h3>
                <p className="font-nunito text-lg text-gray-700">
                  123 Nguyễn Huệ, Quận 1<br />
                  TP. Hồ Chí Minh, Việt Nam
                </p>
              </div>
              <div className="text-center">
                <div className="bg-tour-light-blue rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-tour-blue" />
                </div>
                <h3 className="font-nunito text-xl font-bold text-black mb-2">
                  Điện thoại
                </h3>
                <p className="font-nunito text-lg text-gray-700">
                  +84 123 456 789
                  <br />
                  +84 987 654 321
                </p>
              </div>
              <div className="text-center">
                <div className="bg-tour-light-blue rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-tour-blue" />
                </div>
                <h3 className="font-nunito text-xl font-bold text-black mb-2">
                  Email
                </h3>
                <p className="font-nunito text-lg text-gray-700">
                  info@travelguide.vn
                  <br />
                  booking@travelguide.vn
                </p>
              </div>
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
