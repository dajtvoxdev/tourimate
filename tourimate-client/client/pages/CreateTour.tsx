import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { User, ChevronDown } from "lucide-react";
import { toast } from "sonner";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "https://localhost:7181";

export default function CreateTour() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    date: "",
    price: "",
    images: [] as string[],
    shortDescription: "",
    location: "",
    duration: "1",
    maxParticipants: "10",
    category: "General",
    difficulty: "Easy",
  });
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const navigate = useNavigate();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const handleUploadImages = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Bạn cần đăng nhập");
      navigate("/login");
      return;
    }
    if (selectedFiles.length === 0) {
      toast.error("Vui lòng chọn ít nhất một ảnh");
      return;
    }
    const form = new FormData();
    for (const file of selectedFiles) {
      form.append("files", file);
    }
    setUploading(true);
    try {
      const res = await fetch(`${API_BASE}/api/media/uploads`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data || res.statusText);
      const urls: string[] = data.urls || [];
      setFormData((prev) => ({ ...prev, images: urls }));
      toast.success("Tải ảnh lên thành công");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Tải ảnh lên thất bại");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Bạn cần đăng nhập");
      navigate("/login");
      return;
    }
    const payload = {
      title: formData.name,
      description: formData.description,
      shortDescription: formData.shortDescription || formData.description?.slice(0, 160) || "",
      location: formData.location || "",
      duration: parseInt(formData.duration || "1", 10),
      maxParticipants: parseInt(formData.maxParticipants || "10", 10),
      price: Number(formData.price || 0),
      currency: "VND",
      category: formData.category || "General",
      difficulty: formData.difficulty || "Easy",
      imageUrls: formData.images,
      itinerary: null,
      includes: null,
      excludes: null,
      terms: null,
      isFeatured: false,
    } as any;

    try {
      const res = await fetch(`${API_BASE}/api/tour`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data || res.statusText);
      toast.success("Tạo tour thành công");
      navigate(`/admin`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Không thể tạo tour");
    }
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
      <main className="max-w-7xl mx-auto px-4 py-8 pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Hình ảnh minh họa */}
          <div className="hidden lg:block">
            <img src={formData.images[0] || "https://cdn.builder.io/api/v1/image/assets/TEMP/63b4c457c84f25d77787717a687e234d71e49dd0?width=2570"} alt="Tour" className="rounded-[30px] w-full h-[500px] object-cover shadow-xl" />
          </div>
          {/* Right: Card Form */}
          <Card className="w-full max-w-3xl mx-auto shadow-2xl rounded-[34px]">
            <CardHeader>
              <CardTitle className="text-3xl md:text-4xl font-bold text-center">Tạo Tour Mới</CardTitle>
            </CardHeader>
            <form id="create-tour-form" onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="name">Tên tour</Label>
                  <Input id="name" value={formData.name} onChange={e => handleInputChange("name", e.target.value)} placeholder="Nhập tên tour" required />
                </div>
              <div>
                <Label htmlFor="shortDescription">Mô tả ngắn</Label>
                <Input id="shortDescription" value={formData.shortDescription} onChange={e => handleInputChange("shortDescription", e.target.value)} placeholder="Tóm tắt ngắn gọn về tour" />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Địa điểm</Label>
                  <Input id="location" value={formData.location} onChange={e => handleInputChange("location", e.target.value)} placeholder="Ví dụ: Đà Lạt, Lâm Đồng" />
                </div>
                <div>
                  <Label htmlFor="duration">Số ngày</Label>
                  <Input id="duration" type="number" min={1} value={formData.duration} onChange={e => handleInputChange("duration", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxParticipants">Số người tối đa</Label>
                  <Input id="maxParticipants" type="number" min={1} value={formData.maxParticipants} onChange={e => handleInputChange("maxParticipants", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="difficulty">Độ khó</Label>
                  <Input id="difficulty" value={formData.difficulty} onChange={e => handleInputChange("difficulty", e.target.value)} placeholder="Easy / Moderate / Challenging / Expert" />
                </div>
              </div>
                <div>
                <Label className="block mb-2">Ảnh tour (tối đa vài ảnh)</Label>
                <Input id="images" type="file" accept="image/*" multiple onChange={handleFilesSelected} />
                <div className="mt-3 flex flex-wrap gap-3">
                  {formData.images.map((url) => (
                    <img key={url} src={url} alt="preview" className="w-20 h-20 object-cover rounded-lg border" />
                  ))}
                </div>
                <div className="mt-3">
                  <Button type="button" disabled={uploading || selectedFiles.length === 0} onClick={handleUploadImages} className="rounded-full">
                    {uploading ? "Đang tải ảnh..." : "Tải ảnh lên"}
                  </Button>
                </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button type="submit" className="w-full max-w-[200px] h-12 text-lg font-bold rounded-full">Tạo tour</Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Hãy kiểm tra thông tin trước khi lưu
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => navigate(-1)} className="h-11 px-6 rounded-full">Hủy</Button>
            <Button type="submit" form="create-tour-form" className="h-11 px-8 rounded-full">Lưu</Button>
          </div>
        </div>
      </div>
    </div>
  );
} 