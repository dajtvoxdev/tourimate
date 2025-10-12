import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Header from "./Header";

interface TourGuide {
  id: number;
  name: string;
  description: string;
  image: string;
}

export default function TourGuides() {
  const navigate = useNavigate();

  const tourGuides: TourGuide[] = [
    {
      id: 1,
      name: "Nguyễn văn A",
      description:
        "Là một hướng dẫn viên du lịch chuyên nghiệp với hơn 5 năm kinh nghiệm trong việc đồng hành và chia sẻ vẻ đẹp của Việt Nam đến với bạn bè trong và ngoài nước.",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/2168645f531d28b82837c632f89d3ed0ceaf4956?width=720",
    },
    {
      id: 2,
      name: "Nguyễn văn A",
      description:
        "Là một hướng dẫn viên du lịch chuyên nghiệp với hơn 5 năm kinh nghiệm trong việc đồng hành và chia sẻ vẻ đẹp của Việt Nam đến với bạn bè trong và ngoài nước.",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/db84159ff10c8b7bceb41b0f85ded4139e62ae21?width=712",
    },
    {
      id: 3,
      name: "Nguyễn văn A",
      description:
        "Là một hướng dẫn viên du lịch chuyên nghiệp với hơn 5 năm kinh nghiệm trong việc đồng hành và chia sẻ vẻ đẹp của Việt Nam đến với bạn bè trong và ngoài nước.",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/283482ebc0855495706c7faf4d8ce5277cf54e0b?width=710",
    },
    {
      id: 4,
      name: "Nguyễn văn A",
      description:
        "Là một hướng dẫn viên du lịch chuyên nghiệp với hơn 5 năm kinh nghiệm trong việc đồng hành và chia sẻ vẻ đẹp của Việt Nam đến với bạn bè trong và ngoài nước.",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/572fb7f4437eeecbf321a460610403f7f7efffb4?width=720",
    },
    {
      id: 5,
      name: "Nguyễn văn A",
      description:
        "Là một hướng dẫn viên du lịch chuyên nghiệp với hơn 5 năm kinh nghiệm trong việc đồng hành và chia sẻ vẻ đẹp của Việt Nam đến với bạn bè trong và ngoài nước.",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/23ac25d3391204dc45fae9c1eb53855668ae6667?width=720",
    },
    {
      id: 6,
      name: "Nguyễn văn A",
      description:
        "Là một hướng dẫn viên du lịch chuyên nghiệp với hơn 5 năm kinh nghiệm trong việc đồng hành và chia sẻ vẻ đẹp của Việt Nam đến với bạn bè trong và ngoài nước.",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/8222fc44d912d7b69354a5bac43f3a137e5d0525?width=728",
    },
    {
      id: 7,
      name: "Nguyễn văn A",
      description:
        "Là một hướng dẫn viên du lịch chuyên nghiệp với hơn 5 năm kinh nghiệm trong việc đồng hành và chia sẻ vẻ đẹp của Việt Nam đến với bạn bè trong và ngoài nước.",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/cf2214af03c08127f2b5b0dc3f373d496b54bdd1?width=720",
    },
    {
      id: 8,
      name: "Nguyễn văn A",
      description:
        "Là một hướng dẫn viên du lịch chuyên nghiệp với hơn 5 năm kinh nghiệm trong việc đồng hành và chia sẻ vẻ đẹp của Việt Nam đến với bạn bè trong và ngoài nước.",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/30ea3fd127ab77b9b4989771d01fc512bc05e519?width=688",
    },
    {
      id: 9,
      name: "Nguyễn văn A",
      description:
        "Là một hướng dẫn viên du lịch chuyên nghiệp với hơn 5 năm kinh nghiệm trong việc đồng hành và chia sẻ vẻ đẹp của Việt Nam đến với bạn bè trong và ngoài nước.",
      image:
        "https://cdn.builder.io/api/v1/image/assets/TEMP/1bcc3a27d3f89980f76d46b0101ba61f4caf9f59?width=710",
    },
  ];

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {tourGuides.map((guide) => (
              <div
                key={guide.id}
                className="border border-gray-200 rounded-[20px] overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
                onClick={() => navigate(`/guide/${guide.id}`)}
              >
                <img
                  src={guide.image}
                  alt={guide.name}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="p-6">
                  <h3 className="font-nunito text-xl font-bold text-black mb-2">
                    {guide.name}
                  </h3>
                  <p className="font-nunito text-base text-gray-700 mb-4">
                    {guide.description}
                  </p>
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
