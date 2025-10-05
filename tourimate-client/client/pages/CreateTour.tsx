import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { User, ChevronDown } from "lucide-react";

export default function CreateTour() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    date: "",
    price: "",
    image: "",
  });
  const navigate = useNavigate();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Tạm thời chỉ log dữ liệu ra console
    console.log("Tour data:", formData);
    alert("Tạo tour thành công! (Xem console)");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="relative z-20 p-4 md:p-6 bg-white shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Navigation Menu */}
          <nav className="flex space-x-6 md:space-x-8">
            <button onClick={() => navigate("/home")} className="bg-gray-200 hover:bg-tour-teal transition-colors duration-200 px-6 py-2 rounded-2xl">
              <span className="font-nunito text-lg md:text-xl font-bold text-black">Trang chủ</span>
            </button>
            <button onClick={() => navigate("/about")} className="bg-gray-200 hover:bg-tour-teal transition-colors duration-200 px-6 py-2 rounded-2xl">
              <span className="font-nunito text-lg md:text-xl font-bold text-black">Về chúng tôi</span>
            </button>
            <button onClick={() => navigate("/tour-guides")} className="bg-gray-200 hover:bg-tour-teal transition-colors duration-200 px-6 py-2 rounded-2xl">
              <span className="font-nunito text-lg md:text-xl font-bold text-black">Hướng dẫn viên</span>
            </button>
            <button className="bg-green-400 hover:bg-green-600 transition-colors duration-200 px-6 py-2 rounded-2xl">
              <span className="font-nunito text-lg md:text-xl font-bold text-black">Tạo tour</span>
            </button>
          </nav>
          {/* Avatar Dropdown */}
          <div className="relative">
            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-tour-light-blue rounded-full flex items-center justify-center">
                <User className="w-6 h-6 md:w-8 md:h-8 text-black" />
              </div>
              <ChevronDown className={`w-4 h-4 text-black transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="py-2">
                  <button onClick={() => navigate("/profile")} className="w-full px-6 py-3 text-left hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-600" />
                    <span className="font-nunito text-lg font-medium text-black">Thông tin cá nhân</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Hình ảnh minh họa */}
          <div className="hidden lg:block">
            <img src={formData.image || "https://cdn.builder.io/api/v1/image/assets/TEMP/63b4c457c84f25d77787717a687e234d71e49dd0?width=2570"} alt="Tour" className="rounded-[30px] w-full h-[500px] object-cover shadow-xl" />
          </div>
          {/* Right: Card Form */}
          <Card className="w-full max-w-xl mx-auto shadow-2xl rounded-[34px]">
            <CardHeader>
              <CardTitle className="text-3xl md:text-4xl font-bold text-center">Tạo Tour Mới</CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="name">Tên tour</Label>
                  <Input id="name" value={formData.name} onChange={e => handleInputChange("name", e.target.value)} placeholder="Nhập tên tour" required />
                </div>
                <div>
                  <Label htmlFor="description">Mô tả tour</Label>
                  <Textarea id="description" value={formData.description} onChange={e => handleInputChange("description", e.target.value)} placeholder="Nhập mô tả chi tiết" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Ngày khởi hành</Label>
                    <Input id="date" type="date" value={formData.date} onChange={e => handleInputChange("date", e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="price">Giá tour (VND)</Label>
                    <Input id="price" type="number" value={formData.price} onChange={e => handleInputChange("price", e.target.value)} placeholder="Nhập giá" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="image">Link ảnh minh họa</Label>
                  <Input id="image" value={formData.image} onChange={e => handleInputChange("image", e.target.value)} placeholder="Dán link ảnh hoặc để trống" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button type="submit" className="w-full max-w-[200px] h-12 text-lg font-bold rounded-full">Tạo tour</Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
} 