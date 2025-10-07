import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  ChevronDown,
  LogOut,
  Upload,
  X,
  Check,
  MapPin,
  Star,
  Award,
  FileText,
  Camera,
  Phone,
  Mail,
  Calendar,
  ArrowLeft,
  Send,
} from "lucide-react";

interface FormData {
  // Personal Information
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  address: string;
  idNumber: string;

  // Professional Information
  experience: string;
  languages: string[];
  specializations: string[];
  certifications: string;
  introduction: string;

  // Documents
  avatar: File | null;
  idCard: File | null;
  certificates: File[];
}

export default function TourGuideRegistration() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    birthDate: "",
    address: "",
    idNumber: "",
    experience: "",
    languages: [],
    specializations: [],
    certifications: "",
    introduction: "",
    avatar: null,
    idCard: null,
    certificates: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleLogout = () => {
    navigate("/");
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const availableLanguages = [
    "Tiếng Việt",
    "English",
    "中文 (Chinese)",
    "한국어 (Korean)",
    "日本語 (Japanese)",
    "Français",
    "Deutsch",
    "Español",
  ];

  const availableSpecializations = [
    "Văn hóa - Lịch sử",
    "Thiên nhiên - Sinh thái",
    "Ẩm thực",
    "Phiêu lưu - Mạo hiểm",
    "Nghỉ dưỡng",
    "Du lịch tâm linh",
    "Nhiếp ảnh",
    "Du lịch gia đình",
  ];

  const handleInputChange = (
    field: keyof FormData,
    value: string | string[] | File | File[],
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleLanguageToggle = (language: string) => {
    const currentLanguages = formData.languages;
    if (currentLanguages.includes(language)) {
      handleInputChange(
        "languages",
        currentLanguages.filter((l) => l !== language),
      );
    } else {
      handleInputChange("languages", [...currentLanguages, language]);
    }
  };

  const handleSpecializationToggle = (specialization: string) => {
    const currentSpecs = formData.specializations;
    if (currentSpecs.includes(specialization)) {
      handleInputChange(
        "specializations",
        currentSpecs.filter((s) => s !== specialization),
      );
    } else {
      handleInputChange("specializations", [...currentSpecs, specialization]);
    }
  };

  const handleFileUpload = (field: keyof FormData, file: File) => {
    handleInputChange(field, file);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.fullName) newErrors.fullName = "Vui lòng nhập họ tên";
      if (!formData.email) newErrors.email = "Vui lòng nhập email";
      if (!formData.phone) newErrors.phone = "Vui lòng nhập số điện thoại";
      if (!formData.birthDate) newErrors.birthDate = "Vui lòng chọn ngày sinh";
      if (!formData.address) newErrors.address = "Vui lòng nhập địa chỉ";
      if (!formData.idNumber) newErrors.idNumber = "Vui lòng nhập CCCD/CMND";
    } else if (step === 2) {
      if (!formData.experience)
        newErrors.experience = "Vui lòng chọn kinh nghiệm";
      if (formData.languages.length === 0)
        newErrors.languages = "Vui lòng chọn ít nhất một ngôn ngữ";
      if (formData.specializations.length === 0)
        newErrors.specializations = "Vui lòng chọn ít nhất một chuyên môn";
      if (!formData.introduction)
        newErrors.introduction = "Vui lòng viết giới thiệu bản thân";
    } else if (step === 3) {
      if (!formData.avatar) newErrors.avatar = "Vui lòng tải lên ảnh đại diện";
      if (!formData.idCard) newErrors.idCard = "Vui lòng tải lên ảnh CCCD/CMND";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    if (validateStep(currentStep)) {
      alert("Đăng ký thành công! Chúng tôi sẽ liên hệ với bạn trong 24h.");
      navigate("/tour-guides");
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-4 mb-8">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
              step <= currentStep ? "bg-tour-blue" : "bg-gray-300"
            }`}
          >
            {step < currentStep ? <Check className="w-5 h-5" /> : step}
          </div>
          {step < 3 && (
            <div
              className={`w-16 h-1 mx-2 ${step < currentStep ? "bg-tour-blue" : "bg-gray-300"}`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="font-itim text-2xl md:text-3xl text-black text-center mb-8">
        Thông tin cá nhân
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block font-nunito text-lg font-medium text-black mb-2">
            Họ và tên *
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => handleInputChange("fullName", e.target.value)}
            className={`w-full p-4 border rounded-[15px] font-nunito text-lg focus:outline-none focus:ring-2 focus:ring-tour-blue ${
              errors.fullName ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Nhập họ và tên đầy đủ"
          />
          {errors.fullName && (
            <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
          )}
        </div>

        <div>
          <label className="block font-nunito text-lg font-medium text-black mb-2">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className={`w-full p-4 border rounded-[15px] font-nunito text-lg focus:outline-none focus:ring-2 focus:ring-tour-blue ${
              errors.email ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="example@email.com"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block font-nunito text-lg font-medium text-black mb-2">
            Số điện thoại *
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            className={`w-full p-4 border rounded-[15px] font-nunito text-lg focus:outline-none focus:ring-2 focus:ring-tour-blue ${
              errors.phone ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="+84 123 456 789"
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
          )}
        </div>

        <div>
          <label className="block font-nunito text-lg font-medium text-black mb-2">
            Ngày sinh *
          </label>
          <input
            type="date"
            value={formData.birthDate}
            onChange={(e) => handleInputChange("birthDate", e.target.value)}
            className={`w-full p-4 border rounded-[15px] font-nunito text-lg focus:outline-none focus:ring-2 focus:ring-tour-blue ${
              errors.birthDate ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.birthDate && (
            <p className="text-red-500 text-sm mt-1">{errors.birthDate}</p>
          )}
        </div>

        <div>
          <label className="block font-nunito text-lg font-medium text-black mb-2">
            CCCD/CMND *
          </label>
          <input
            type="text"
            value={formData.idNumber}
            onChange={(e) => handleInputChange("idNumber", e.target.value)}
            className={`w-full p-4 border rounded-[15px] font-nunito text-lg focus:outline-none focus:ring-2 focus:ring-tour-blue ${
              errors.idNumber ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="123456789012"
          />
          {errors.idNumber && (
            <p className="text-red-500 text-sm mt-1">{errors.idNumber}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block font-nunito text-lg font-medium text-black mb-2">
            Địa chỉ *
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
            className={`w-full p-4 border rounded-[15px] font-nunito text-lg focus:outline-none focus:ring-2 focus:ring-tour-blue ${
              errors.address ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
          />
          {errors.address && (
            <p className="text-red-500 text-sm mt-1">{errors.address}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      <h3 className="font-itim text-2xl md:text-3xl text-black text-center mb-8">
        Thông tin chuyên môn
      </h3>

      <div>
        <label className="block font-nunito text-lg font-medium text-black mb-4">
          Kinh nghiệm làm hướng dẫn viên *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {["Mới bắt đầu", "1-2 năm", "3-5 năm", "5+ năm"].map((exp) => (
            <button
              key={exp}
              onClick={() => handleInputChange("experience", exp)}
              className={`p-3 rounded-[15px] border-2 transition-colors duration-200 ${
                formData.experience === exp
                  ? "border-tour-blue bg-tour-light-blue text-tour-blue"
                  : "border-gray-300 hover:border-tour-blue"
              }`}
            >
              <span className="font-nunito font-medium">{exp}</span>
            </button>
          ))}
        </div>
        {errors.experience && (
          <p className="text-red-500 text-sm mt-1">{errors.experience}</p>
        )}
      </div>

      <div>
        <label className="block font-nunito text-lg font-medium text-black mb-4">
          Ngôn ngữ bạn có thể sử dụng *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {availableLanguages.map((language) => (
            <button
              key={language}
              onClick={() => handleLanguageToggle(language)}
              className={`p-3 rounded-[15px] border-2 transition-colors duration-200 ${
                formData.languages.includes(language)
                  ? "border-tour-blue bg-tour-light-blue text-tour-blue"
                  : "border-gray-300 hover:border-tour-blue"
              }`}
            >
              <span className="font-nunito font-medium">{language}</span>
            </button>
          ))}
        </div>
        {errors.languages && (
          <p className="text-red-500 text-sm mt-1">{errors.languages}</p>
        )}
      </div>

      <div>
        <label className="block font-nunito text-lg font-medium text-black mb-4">
          Chuyên môn *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {availableSpecializations.map((spec) => (
            <button
              key={spec}
              onClick={() => handleSpecializationToggle(spec)}
              className={`p-3 rounded-[15px] border-2 transition-colors duration-200 ${
                formData.specializations.includes(spec)
                  ? "border-tour-blue bg-tour-light-blue text-tour-blue"
                  : "border-gray-300 hover:border-tour-blue"
              }`}
            >
              <span className="font-nunito font-medium">{spec}</span>
            </button>
          ))}
        </div>
        {errors.specializations && (
          <p className="text-red-500 text-sm mt-1">{errors.specializations}</p>
        )}
      </div>

      <div>
        <label className="block font-nunito text-lg font-medium text-black mb-2">
          Chứng chỉ/Bằng cấp liên quan (nếu có)
        </label>
        <textarea
          value={formData.certifications}
          onChange={(e) => handleInputChange("certifications", e.target.value)}
          rows={3}
          className="w-full p-4 border border-gray-300 rounded-[15px] font-nunito text-lg focus:outline-none focus:ring-2 focus:ring-tour-blue"
          placeholder="Ví dụ: Chứng chỉ hướng dẫn viên du lịch quốc gia, bằng tiếng Anh IELTS 7.0..."
        />
      </div>

      <div>
        <label className="block font-nunito text-lg font-medium text-black mb-2">
          Giới thiệu bản thân *
        </label>
        <textarea
          value={formData.introduction}
          onChange={(e) => handleInputChange("introduction", e.target.value)}
          rows={5}
          className={`w-full p-4 border rounded-[15px] font-nunito text-lg focus:outline-none focus:ring-2 focus:ring-tour-blue ${
            errors.introduction ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Hãy giới thiệu về bản thân, kinh nghiệm làm việc, và lý do bạn muốn trở thành hướng dẫn viên..."
        />
        {errors.introduction && (
          <p className="text-red-500 text-sm mt-1">{errors.introduction}</p>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      <h3 className="font-itim text-2xl md:text-3xl text-black text-center mb-8">
        Tài liệu xác thực
      </h3>

      <div>
        <label className="block font-nunito text-lg font-medium text-black mb-4">
          Ảnh đại diện *
        </label>
        <div
          className={`border-2 border-dashed rounded-[20px] p-8 text-center transition-colors duration-200 ${
            errors.avatar
              ? "border-red-500 bg-red-50"
              : "border-gray-300 hover:border-tour-blue"
          }`}
        >
          {formData.avatar ? (
            <div className="space-y-4">
              <img
                src={URL.createObjectURL(formData.avatar)}
                alt="Avatar preview"
                className="w-32 h-32 rounded-full object-cover mx-auto"
              />
              <p className="font-nunito text-lg text-gray-700">
                {formData.avatar.name}
              </p>
              <button
                onClick={() => handleInputChange("avatar", null)}
                className="text-red-500 hover:text-red-700 transition-colors duration-200"
              >
                <X className="w-5 h-5 mx-auto" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <Camera className="w-16 h-16 text-gray-400 mx-auto" />
              <div>
                <p className="font-nunito text-lg text-gray-700 mb-2">
                  Tải lên ảnh đại diện
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload("avatar", file);
                  }}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className="bg-tour-blue hover:bg-tour-teal text-white px-6 py-3 rounded-[15px] cursor-pointer transition-colors duration-200 inline-block"
                >
                  Chọn ảnh
                </label>
              </div>
            </div>
          )}
        </div>
        {errors.avatar && (
          <p className="text-red-500 text-sm mt-1">{errors.avatar}</p>
        )}
      </div>

      <div>
        <label className="block font-nunito text-lg font-medium text-black mb-4">
          Ảnh CCCD/CMND (mặt trước) *
        </label>
        <div
          className={`border-2 border-dashed rounded-[20px] p-8 text-center transition-colors duration-200 ${
            errors.idCard
              ? "border-red-500 bg-red-50"
              : "border-gray-300 hover:border-tour-blue"
          }`}
        >
          {formData.idCard ? (
            <div className="space-y-4">
              <img
                src={URL.createObjectURL(formData.idCard)}
                alt="ID card preview"
                className="max-w-xs mx-auto rounded-[15px]"
              />
              <p className="font-nunito text-lg text-gray-700">
                {formData.idCard.name}
              </p>
              <button
                onClick={() => handleInputChange("idCard", null)}
                className="text-red-500 hover:text-red-700 transition-colors duration-200"
              >
                <X className="w-5 h-5 mx-auto" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <FileText className="w-16 h-16 text-gray-400 mx-auto" />
              <div>
                <p className="font-nunito text-lg text-gray-700 mb-2">
                  Tải lên ảnh CCCD/CMND
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload("idCard", file);
                  }}
                  className="hidden"
                  id="idcard-upload"
                />
                <label
                  htmlFor="idcard-upload"
                  className="bg-tour-blue hover:bg-tour-teal text-white px-6 py-3 rounded-[15px] cursor-pointer transition-colors duration-200 inline-block"
                >
                  Chọn ảnh
                </label>
              </div>
            </div>
          )}
        </div>
        {errors.idCard && (
          <p className="text-red-500 text-sm mt-1">{errors.idCard}</p>
        )}
      </div>

      <div>
        <label className="block font-nunito text-lg font-medium text-black mb-4">
          Chứng chỉ/Bằng cấp (nếu có)
        </label>
        <div className="border-2 border-dashed border-gray-300 hover:border-tour-blue rounded-[20px] p-8 text-center transition-colors duration-200">
          <div className="space-y-4">
            <Upload className="w-16 h-16 text-gray-400 mx-auto" />
            <div>
              <p className="font-nunito text-lg text-gray-700 mb-2">
                Tải lên các chứng chỉ
              </p>
              <input
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  handleInputChange("certificates", files);
                }}
                className="hidden"
                id="certificates-upload"
              />
              <label
                htmlFor="certificates-upload"
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-[15px] cursor-pointer transition-colors duration-200 inline-block"
              >
                Chọn tệp
              </label>
            </div>
          </div>
        </div>
        {formData.certificates.length > 0 && (
          <div className="mt-4">
            <h4 className="font-nunito text-lg font-medium mb-2">
              Tệp đã chọn:
            </h4>
            <div className="space-y-2">
              {formData.certificates.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-100 p-3 rounded-[10px]"
                >
                  <span className="font-nunito text-sm">{file.name}</span>
                  <button
                    onClick={() => {
                      const newFiles = formData.certificates.filter(
                        (_, i) => i !== index,
                      );
                      handleInputChange("certificates", newFiles);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
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
              <button
                onClick={() => handleNavigation("/about")}
                className="bg-gray-200 hover:bg-tour-teal transition-colors duration-200 px-6 py-2 rounded-2xl"
              >
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

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="font-josefin text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-4">
            Đăng kí làm hướng dẫn viên
          </h1>
          <p className="font-nunito text-lg md:text-xl text-gray-700 max-w-2xl mx-auto">
            Tham gia đội ngũ hướng dẫn viên chuyên nghiệp và chia sẻ tình yêu
            với du lịch Việt Nam
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-[30px] shadow-xl p-6 md:p-8 lg:p-12">
          {renderStepIndicator()}

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-12">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`flex items-center space-x-2 px-6 py-3 rounded-[15px] transition-colors duration-200 ${
                currentStep === 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-500 hover:bg-gray-600 text-white"
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-nunito font-medium">Quay lại</span>
            </button>

            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                className="flex items-center space-x-2 bg-tour-blue hover:bg-tour-teal text-white px-6 py-3 rounded-[15px] transition-colors duration-200"
              >
                <span className="font-nunito font-medium">Tiếp theo</span>
                <ArrowLeft className="w-5 h-5 rotate-180" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-[15px] transition-colors duration-200"
              >
                <Send className="w-5 h-5" />
                <span className="font-nunito font-medium">Gửi đăng ký</span>
              </button>
            )}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-12 bg-gradient-to-r from-tour-light-blue to-tour-teal rounded-[30px] p-8">
          <h3 className="font-itim text-2xl md:text-3xl text-center text-white mb-8">
            Tại sao nên trở thành hướng dẫn viên?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center text-white">
              <div className="bg-white bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8" />
              </div>
              <h4 className="font-nunito text-xl font-bold mb-2">
                Thu nhập hấp dẫn
              </h4>
              <p className="font-nunito">
                Kiếm thêm thu nhập từ đam mê du lịch của bạn
              </p>
            </div>
            <div className="text-center text-white">
              <div className="bg-white bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8" />
              </div>
              <h4 className="font-nunito text-xl font-bold mb-2">
                Khám phá đất nước
              </h4>
              <p className="font-nunito">
                Du lịch khắp Việt Nam cùng với khách hàng
              </p>
            </div>
            <div className="text-center text-white">
              <div className="bg-white bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8" />
              </div>
              <h4 className="font-nunito text-xl font-bold mb-2">
                Phát triển bản thân
              </h4>
              <p className="font-nunito">
                Nâng cao kỹ năng giao tiếp và chuyên môn
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-300 py-12 md:py-20 mt-12">
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
