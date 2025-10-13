import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  X,
  Check,
  MapPin,
  Star,
  Award,
  FileText,
  Camera,
  ArrowLeft,
  Send,
  Calendar as CalendarIcon,
} from "lucide-react";
import Header from "./Header";
import { useAuth } from "@/src/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SearchableSelect } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Spinner, LoadingButton } from "@/components/ui/spinner";
// HTTP wrapper with automatic token refresh
const httpWithRefresh = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");
  
  let response = await fetch(url, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  // Auto refresh on 401
  if (response.status === 401 && refreshToken) {
    try {
      const refreshed = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (refreshed.ok) {
        const data = await refreshed.json();
        localStorage.setItem("accessToken", data.accessToken);
        // Retry with new token
        response = await fetch(url, {
          ...options,
          headers: {
            Authorization: `Bearer ${data.accessToken}`,
            ...(options.headers || {}),
          },
        });
      } else {
        // Refresh failed, clear auth and redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("refreshTokenExpiresAt");
        window.location.href = "/login";
      }
    } catch {
      // Refresh failed, clear auth and redirect to login
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("refreshTokenExpiresAt");
      window.location.href = "/login";
    }
  }

  return response;
};

interface FormData {
  // Personal Information
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  address: string;
  idNumber: string;
  provinceCode: number | null;
  wardCode: number | null;

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

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7181";

export default function TourGuideRegistration() {
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [wardsLoading, setWardsLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [applicationLoading, setApplicationLoading] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    birthDate: "",
    address: "",
    idNumber: "",
    provinceCode: null,
    wardCode: null,
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

  // Load provinces
  const loadProvinces = async () => {
    try {
      const res = await httpWithRefresh(`${API_BASE}/api/divisions`);
      if (res.ok) {
        const data = await res.json();
        const provinces = (data || []).filter((d: any) => (d.parentCode ?? d.ParentCode) == null);
        setProvinces(provinces.map((d: any) => ({ code: d.code ?? d.Code, name: d.name ?? d.Name })));
      }
    } catch (e) {
      console.error("Failed to load provinces:", e);
    }
  };

  // Load wards for selected province
  const loadWards = async (provinceCode: number) => {
    try {
      setWardsLoading(true);
      const res = await httpWithRefresh(`${API_BASE}/api/divisions/wards?provinceCode=${provinceCode}`);
      if (res.ok) {
        const data = await res.json();
        setWards((data || []).map((d: any) => ({ code: d.code ?? d.Code, name: d.name ?? d.Name })));
      } else {
        setWards([]);
      }
    } catch {
      setWards([]);
    } finally {
      setWardsLoading(false);
    }
  };

  // Check for existing application
  const checkExistingApplication = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      
      const response = await httpWithRefresh(`${API_BASE}/api/auth/tour-guide-application`);
      if (response.ok) {
        const data = await response.json();
        setExistingApplication(data);
        
        // Always load existing data for display, regardless of editability
        try {
          const applicationData = JSON.parse(data.applicationData);
          const documents = data.documents ? JSON.parse(data.documents) : [];
          
          setFormData(prev => ({
            ...prev,
            ...applicationData,
            // Convert back to proper types
            languages: Array.isArray(applicationData.languages) ? applicationData.languages : [],
            specializations: Array.isArray(applicationData.specializations) ? applicationData.specializations : [],
            // Handle documents - first item is avatar, second is idCard, rest are certificates
            avatar: documents[0] || null,
            idCard: documents[1] || null,
            certificates: documents.slice(2) || [],
          }));
          
          // Load wards for the selected province and then set the wardCode
          if (applicationData.provinceCode) {
            const wardCode = applicationData.wardCode;
            loadWards(applicationData.provinceCode).then(() => {
              // Set the wardCode after wards are loaded
              if (wardCode) {
                setFormData(prev => ({ ...prev, wardCode }));
              }
            });
          }
        } catch (e) {
          console.error("Failed to parse existing application data:", e);
        }
      } else if (response.status === 404) {
        // No existing application
        setExistingApplication(null);
        // Auto-fill from profile since no existing application
        autoFillFromProfile();
      }
    } catch (error) {
      console.error("Failed to check existing application:", error);
    } finally {
      setApplicationLoading(false);
    }
  };

  // Auto-fill form from user profile (only when no existing application)
  const autoFillFromProfile = () => {
    if (!user) return;
    
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    setFormData(prev => ({
      ...prev,
      fullName,
      email: user.email || "",
      phone: user.phoneNumber || "",
      birthDate: user.dateOfBirth || "",
      address: user.address || "",
      provinceCode: (user as any).provinceCode || null,
    }));
  };

  // Auto-fill form from existing tour guide application
  const autoFillFromApplication = (applicationData: any) => {
    try {
      const data = typeof applicationData === 'string' ? JSON.parse(applicationData) : applicationData;
      
      setFormData(prev => ({
        ...prev,
        fullName: data.fullName || "",
        email: data.email || "",
        phone: data.phone || "",
        birthDate: data.birthDate || "",
        address: data.address || "",
        provinceCode: data.provinceCode || null,
        wardCode: data.wardCode || null,
        experience: data.experience || "",
        languages: data.languages || [],
        specializations: data.specializations || [],
        avatar: data.avatar || null,
        idCard: data.idCard || null,
        certificates: data.certificates || null,
      }));
    } catch (error) {
      console.error("Failed to parse application data:", error);
      // Fallback to profile data if application data is invalid
      autoFillFromProfile();
    }
  };

  // Load initial data
  useEffect(() => {
    const initializeData = async () => {
      setApplicationLoading(true);
      await loadProvinces();
      await checkExistingApplication();
    };
    
    initializeData();
  }, [user]);


  // Load wards when province changes
  useEffect(() => {
    if (formData.provinceCode) {
      loadWards(formData.provinceCode);
      // Reset ward when province changes (this will be overridden if loading from existing application)
      setFormData(prev => ({ ...prev, wardCode: null }));
    } else {
      setWards([]);
    }
  }, [formData.provinceCode]);

  // Redirect admin users to admin dashboard
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-[30px] shadow-xl p-8 text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h1 className="font-josefin text-3xl md:text-4xl font-bold text-black mb-4">
                Không thể đăng ký làm hướng dẫn viên
              </h1>
              <p className="font-nunito text-lg md:text-xl text-gray-700 mb-8">
                Bạn đã là quản trị viên của hệ thống và không thể đăng ký làm hướng dẫn viên.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate("/admin")}
                  className="bg-tour-blue hover:bg-tour-teal text-white px-8 py-3 rounded-[15px] font-nunito font-bold transition-colors duration-200"
                >
                  Về trang quản trị
                </button>
                <button
                  onClick={() => navigate("/tour-guides")}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-[15px] font-nunito font-bold transition-colors duration-200"
                >
                  Xem hướng dẫn viên
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
    value: string | string[] | File | File[] | number | null,
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
      if (!formData.provinceCode) newErrors.provinceCode = "Vui lòng chọn tỉnh/thành phố";
      if (!formData.wardCode) newErrors.wardCode = "Vui lòng chọn phường/xã";
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

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Bạn cần đăng nhập để đăng ký làm hướng dẫn viên");
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      // Prepare application data
      const applicationData = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        birthDate: formData.birthDate,
        address: formData.address,
        idNumber: formData.idNumber,
        provinceCode: formData.provinceCode,
        wardCode: formData.wardCode,
        experience: formData.experience,
        languages: formData.languages,
        specializations: formData.specializations,
        certifications: formData.certifications,
        introduction: formData.introduction,
      };

      // Handle documents - preserve existing URLs and upload new files
      const documentUrls: string[] = [];
      
      // Handle avatar - if it's a string (existing URL), use it directly; if File, upload it
      if (formData.avatar) {
        if (typeof formData.avatar === 'string') {
          documentUrls.push(formData.avatar);
        } else {
          const avatarFormData = new FormData();
          avatarFormData.append("file", formData.avatar);
          const avatarRes = await httpWithRefresh(`${API_BASE}/api/media/upload`, {
            method: "POST",
            body: avatarFormData,
          });
          if (avatarRes.ok) {
            const avatarData = await avatarRes.json();
            documentUrls.push(avatarData.url);
          }
        }
      }

      // Handle ID card - if it's a string (existing URL), use it directly; if File, upload it
      if (formData.idCard) {
        if (typeof formData.idCard === 'string') {
          documentUrls.push(formData.idCard);
        } else {
          const idCardFormData = new FormData();
          idCardFormData.append("file", formData.idCard);
          const idCardRes = await httpWithRefresh(`${API_BASE}/api/media/upload`, {
            method: "POST",
            body: idCardFormData,
          });
          if (idCardRes.ok) {
            const idCardData = await idCardRes.json();
            documentUrls.push(idCardData.url);
          }
        }
      }

      // Handle certificates - preserve existing URLs and upload new files
      for (const cert of formData.certificates) {
        if (typeof cert === 'string') {
          // Existing URL, use it directly
          documentUrls.push(cert);
        } else {
          // New file, upload it
          const certFormData = new FormData();
          certFormData.append("file", cert);
          const certRes = await httpWithRefresh(`${API_BASE}/api/media/upload`, {
            method: "POST",
            body: certFormData,
          });
          if (certRes.ok) {
            const certData = await certRes.json();
            documentUrls.push(certData.url);
          }
        }
      }

      // Submit application
      const submitRes = await httpWithRefresh(`${API_BASE}/api/auth/tour-guide-application`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationData: JSON.stringify(applicationData),
          documents: JSON.stringify(documentUrls),
        }),
      });

      if (!submitRes.ok) {
        const errorText = await submitRes.text();
        throw new Error(errorText || submitRes.statusText);
      }

      toast.success("Đăng ký thành công! Chúng tôi sẽ liên hệ với bạn trong 24h.");
      navigate("/tour-guides");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Check if user can submit
  const canSubmit = () => {
    if (!existingApplication) return true; // New application
    return existingApplication.status === "allow_edit" || existingApplication.status === "rejected";
  };

  // Get submit button text
  const getSubmitButtonText = () => {
    if (!existingApplication) return "Gửi đăng ký";
    if (existingApplication.status === "rejected") return "Gửi lại đăng ký";
    if (existingApplication.status === "allow_edit") return "Cập nhật đăng ký";
    return "Gửi đăng ký";
  };

  const renderApplicationStatus = () => {
    if (applicationLoading) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <Spinner size="sm" className="text-blue-600" />
            <span className="text-blue-800 font-medium">Đang kiểm tra trạng thái đơn đăng ký...</span>
          </div>
        </div>
      );
    }

    if (!existingApplication) {
      return null;
    }

    const statusConfig = {
      pending_review: {
        color: "yellow",
        icon: "⏳",
        message: "Đơn đăng ký đang chờ xem xét. Bạn không thể chỉnh sửa lúc này.",
        canEdit: false
      },
      approved: {
        color: "green", 
        icon: "✅",
        message: "Đơn đăng ký đã được phê duyệt. Bạn đã trở thành hướng dẫn viên!",
        canEdit: false
      },
      rejected: {
        color: "red",
        icon: "❌", 
        message: "Đơn đăng ký bị từ chối. Bạn có thể chỉnh sửa và gửi lại.",
        canEdit: true
      },
      allow_edit: {
        color: "blue",
        icon: "✏️",
        message: "Bạn có thể chỉnh sửa đơn đăng ký. Hãy cập nhật thông tin và gửi lại.",
        canEdit: true
      }
    };

    const config = statusConfig[existingApplication.status as keyof typeof statusConfig] || statusConfig.pending_review;
    const colorClasses = {
      yellow: "bg-yellow-50 border-yellow-200 text-yellow-800",
      green: "bg-green-50 border-green-200 text-green-800", 
      red: "bg-red-50 border-red-200 text-red-800",
      blue: "bg-blue-50 border-blue-200 text-blue-800"
    };

    return (
      <div className={`${colorClasses[config.color]} border rounded-lg p-4 mb-6`}>
        <div className="flex items-center gap-3">
          <span className="text-xl">{config.icon}</span>
          <div>
            <span className="font-medium">{config.message}</span>
            {existingApplication.feedback && (
              <div className="mt-2 text-sm opacity-90">
                <strong>Phản hồi:</strong> {existingApplication.feedback}
              </div>
            )}
          </div>
        </div>
      </div>
    );
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
            Họ và tên <span className="text-red-500">*</span>
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
            Email <span className="text-red-500">*</span>
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
            Số điện thoại <span className="text-red-500">*</span>
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
            Ngày sinh <span className="text-red-500">*</span>
          </label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal p-4 h-auto rounded-[15px] font-nunito text-lg border",
                  !formData.birthDate && "text-muted-foreground",
                  errors.birthDate && "border-red-500"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.birthDate ? (
                  format(new Date(formData.birthDate), "dd/MM/yyyy", { locale: vi })
                ) : (
                  <span>Chọn ngày sinh</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.birthDate ? new Date(formData.birthDate) : undefined}
                onSelect={(date) => {
                  if (date) {
                    handleInputChange("birthDate", format(date, "yyyy-MM-dd"));
                    setCalendarOpen(false);
                  }
                }}
                disabled={(date) =>
                  date > new Date() || date < new Date("1900-01-01")
                }
                initialFocus
                locale={vi}
              />
            </PopoverContent>
          </Popover>
          {errors.birthDate && (
            <p className="text-red-500 text-sm mt-1">{errors.birthDate}</p>
          )}
        </div>

        <div>
          <label className="block font-nunito text-lg font-medium text-black mb-2">
            CCCD/CMND <span className="text-red-500">*</span>
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

        <div>
          <Label className="block font-nunito text-lg font-medium text-black mb-2">
            Tỉnh/Thành phố <span className="text-red-500">*</span>
          </Label>
          <SearchableSelect 
            value={formData.provinceCode?.toString() || ""} 
            onValueChange={(value) => handleInputChange("provinceCode", value ? Number(value) : null)}
            placeholder="Chọn tỉnh/thành phố"
            searchPlaceholder="Tìm kiếm tỉnh/thành..."
            options={provinces.map(p => ({ value: p.code.toString(), label: p.name }))}
            className={`w-full p-4 border rounded-[15px] font-nunito text-lg focus:outline-none focus:ring-2 focus:ring-tour-blue !h-auto ${
              errors.provinceCode ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.provinceCode && (
            <p className="text-red-500 text-sm mt-1">{errors.provinceCode}</p>
          )}
        </div>

        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="block font-nunito text-lg font-medium text-black mb-2">
              Phường/Xã <span className="text-red-500">*</span>
            </Label>
            <SearchableSelect 
              value={formData.wardCode?.toString() || ""} 
              onValueChange={(value) => handleInputChange("wardCode", value ? Number(value) : null)}
              placeholder={!formData.provinceCode ? "Chọn tỉnh trước" : (wardsLoading ? "Đang tải..." : "Chọn phường/xã")}
              searchPlaceholder="Tìm kiếm phường/xã..."
              options={wards.map(w => ({ value: w.code.toString(), label: w.name }))}
              disabled={!formData.provinceCode || wardsLoading}
              className={`w-full p-4 border rounded-[15px] font-nunito text-lg focus:outline-none focus:ring-2 focus:ring-tour-blue !h-auto ${
                errors.wardCode ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.wardCode && (
              <p className="text-red-500 text-sm mt-1">{errors.wardCode}</p>
            )}
          </div>

          <div>
          <label className="block font-nunito text-lg font-medium text-black mb-2">
              Địa chỉ chi tiết <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
            className={`w-full p-4 border rounded-[15px] font-nunito text-lg focus:outline-none focus:ring-2 focus:ring-tour-blue ${
              errors.address ? "border-red-500" : "border-gray-300"
            }`}
              placeholder="Số nhà, đường (địa chỉ chi tiết)"
          />
          {errors.address && (
            <p className="text-red-500 text-sm mt-1">{errors.address}</p>
          )}
          </div>
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
          Kinh nghiệm làm hướng dẫn viên <span className="text-red-500">*</span>
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
          Ngôn ngữ bạn có thể sử dụng <span className="text-red-500">*</span>
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
          Chuyên môn <span className="text-red-500">*</span>
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
          Giới thiệu bản thân <span className="text-red-500">*</span>
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
          Ảnh đại diện <span className="text-red-500">*</span>
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
              <div className="w-full aspect-[5/3]">
              <img
                src={typeof formData.avatar === 'string' ? formData.avatar : URL.createObjectURL(formData.avatar)}
                alt="Avatar preview"
                  className="w-full h-full rounded-[15px] object-cover border"
              />
              </div>
              <p className="font-nunito text-lg text-gray-700">
                {typeof formData.avatar === 'string' ? 'Avatar đã tải lên' : formData.avatar.name}
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
          Ảnh CCCD/CMND (mặt trước) <span className="text-red-500">*</span>
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
              <div className="w-full aspect-[5/3]">
              <img
                src={typeof formData.idCard === 'string' ? formData.idCard : URL.createObjectURL(formData.idCard)}
                alt="ID card preview"
                  className="w-full h-full rounded-[15px] object-cover border"
              />
              </div>
              <p className="font-nunito text-lg text-gray-700">
                {typeof formData.idCard === 'string' ? 'Ảnh CCCD/CMND đã tải lên' : formData.idCard.name}
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
                  // Filter to only allow images and PDFs
                  const allowedFiles = files.filter(file => {
                    const isImage = file.type.startsWith('image/');
                    const isPDF = file.type === 'application/pdf';
                    return isImage || isPDF;
                  });
                  handleInputChange("certificates", allowedFiles);
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
                  <span className="font-nunito text-sm">
                    {typeof file === 'string' ? `Tệp ${index + 1} đã tải lên` : file.name}
                  </span>
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
      <Header />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-black hover:text-tour-blue transition-colors duration-200"
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="font-nunito text-lg font-medium">Quay lại</span>
          </button>
        </div>

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

        {/* Application Status */}
        {renderApplicationStatus()}

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
              <LoadingButton
                onClick={handleSubmit}
                loading={loading}
                loadingText="Đang xử lý..."
                disabled={loading || !canSubmit()}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-[15px] transition-colors duration-200"
              >
                <Send className="w-5 h-5" />
                <span className="font-nunito font-medium">
                  {getSubmitButtonText()}
                </span>
              </LoadingButton>
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
