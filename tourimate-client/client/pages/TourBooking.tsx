import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { User, MapPin, Calendar, Star, CreditCard, ArrowLeft, Users, Clock, ChevronRight, Home, Copy, Check } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PaymentDialog } from "@/components/PaymentDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/src/hooks/useAuth";
import { tourApi } from "@/src/lib/tourApi";
import { TourAvailabilityApiService } from "@/src/lib/tourAvailabilityApi";
import { httpJson, getApiBase } from "@/src/lib/http";

interface TourAvailability {
  id: string;
  date: string;
  adultPrice: number;
  childPrice: number;
  maxParticipants: number;
  bookedParticipants: number;
  departureDivisionCode: number;
  departureDivisionName: string;
  tripTime?: string;
  vehicle?: string;
  notes?: string;
}

interface Tour {
  id: string;
  title: string;
  shortDescription: string;
  location: string;
  category: string;
  imageUrls?: string[];
  tourGuideId: string;
  tourGuideName: string;
  tourGuideAvatar?: string;
  tourGuideRating?: number;
  tourGuideTotalReviews?: number;
}

interface ExistingBooking {
  id: string;
  bookingNumber: string;
  status: string;
  totalAmount: number;
  adultCount: number;
  childCount: number;
  contactInfo: string;
  specialRequests?: string;
  createdAt: string;
  tour: {
    id: string;
    title: string;
    images?: string;
    location: string;
  };
  tourAvailability: {
    id: string;
    date: string;
    adultPrice: number;
    childPrice: number;
    departurePoint?: string;
    vehicle?: string;
    tripTime?: string;
  };
}

const TourBooking: React.FC = () => {
  const { id: tourId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  const [tour, setTour] = useState<Tour | null>(null);
  const [availabilities, setAvailabilities] = useState<TourAvailability[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<TourAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllAvailabilities, setShowAllAvailabilities] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [bookingNumber, setBookingNumber] = useState<string>("");
  const [bookingId, setBookingId] = useState<string>("");
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [adminBanking, setAdminBanking] = useState<{
    account: string;
    bankName: string;
    qrCodeUrl: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [existingBooking, setExistingBooking] = useState<ExistingBooking | null>(null);
  const [bookingData, setBookingData] = useState({
    adultCount: 1,
    childCount: 0,
    contactName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "",
    contactEmail: user?.email || "",
    contactPhone: user?.phoneNumber || "",
    specialRequests: ""
  });

  useEffect(() => {
    // Check authentication first
    if (!user) {
      toast.error("Vui lòng đăng nhập để đặt tour");
      const currentUrl = window.location.pathname + window.location.search;
      navigate(`/login?returnUrl=${encodeURIComponent(currentUrl)}`);
      return;
    }

    const loadData = async () => {
      if (!tourId) return;
      
      try {
        setLoading(true);
        
        const availabilityId = searchParams.get('availability');
        const bookingNumber = searchParams.get('booking');
        
        const [tourData, availabilitiesData, categoriesData, bankingData] = await Promise.all([
          tourApi.getTour(tourId),
          TourAvailabilityApiService.getTourAvailabilities({ tourId }),
          httpJson<any[]>(`${getApiBase()}/api/tourcategories`, { skipAuth: true }),
          httpJson<{ account: string; bankName: string; qrCodeUrl: string }>(`${getApiBase()}/api/payment/admin-banking`, { skipAuth: true })
        ]);
        
        let bookingDataResult: ExistingBooking | null = null;
        if (bookingNumber) {
          try {
            bookingDataResult = await httpJson<ExistingBooking>(`${getApiBase()}/api/bookings/${bookingNumber}`);
          } catch (error) {
            console.error("Error fetching booking data:", error);
          }
        }
        
        // Filter future availabilities only
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const startOfTomorrow = new Date(startOfToday);
        startOfTomorrow.setDate(startOfToday.getDate() + 1);
        const futureAvailabilities = (availabilitiesData.data || []).filter((a: TourAvailability) => new Date(a.date) >= startOfTomorrow);
        
        setTour(tourData);
        setAvailabilities(futureAvailabilities);
        setCategories(categoriesData);
        setAdminBanking(bankingData);
        
        if (user && user.role === "TourGuide" && tourData.tourGuideId === user.id) {
          toast.error("Bạn không thể đặt tour của chính mình");
          navigate(`/tour/${tourId}`);
          return;
        }
        
        if (bookingDataResult) {
          setExistingBooking(bookingDataResult);
          const contactInfo = JSON.parse(bookingDataResult.contactInfo);
          setBookingData({
            adultCount: bookingDataResult.adultCount,
            childCount: bookingDataResult.childCount,
            contactName: contactInfo.Name || contactInfo.name || "",
            contactEmail: contactInfo.Email || contactInfo.email || "",
            contactPhone: contactInfo.Phone || contactInfo.phone || "",
            specialRequests: bookingDataResult.specialRequests || ""
          });
        }
        
        if (availabilityId) {
          const targetAvailability = futureAvailabilities.find(av => av.id === availabilityId);
          if (targetAvailability) {
            setSelectedAvailability(targetAvailability);
          }
        } else if (futureAvailabilities.length > 0) {
          setSelectedAvailability(futureAvailabilities[0]);
        }
      } catch (error) {
        console.error("Error loading tour data:", error);
        toast.error("Không thể tải thông tin tour");
        navigate("/tours");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tourId, navigate, searchParams, user]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Vui lòng đăng nhập để đặt tour");
      const currentUrl = window.location.pathname + window.location.search;
      navigate(`/login?returnUrl=${encodeURIComponent(currentUrl)}`);
      return;
    }
    
    if (user.role === "TourGuide" && tour && tour.tourGuideId === user.id) {
      toast.error("Bạn không thể đặt tour của chính mình");
      return;
    }
    
    if (!selectedAvailability) {
      toast.error("Vui lòng chọn ngày khởi hành");
      return;
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfToday.getDate() + 1);
    if (new Date(selectedAvailability.date) < startOfTomorrow) {
      toast.error("Ngày khởi hành không còn khả dụng");
      return;
    }
    
    if (bookingData.adultCount + bookingData.childCount === 0) {
      toast.error("Vui lòng chọn số lượng khách");
      return;
    }

    if (!bookingData.contactName || !bookingData.contactEmail || !bookingData.contactPhone) {
      toast.error("Vui lòng điền đầy đủ thông tin liên hệ");
      return;
    }

    const totalPrice = (selectedAvailability.adultPrice * bookingData.adultCount) + 
                      (selectedAvailability.childPrice * bookingData.childCount);

    setTotalAmount(totalPrice);
    setShowConfirmDialog(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedAvailability || !tour) return;

    try {
      setIsProcessing(true);
      setShowConfirmDialog(false);

      let bookingResponse: { bookingNumber: string };

      if (existingBooking) {
        const bookingPayload = {
          tourId: tour.id,
          tourAvailabilityId: selectedAvailability.id,
          adultCount: bookingData.adultCount,
          childCount: bookingData.childCount,
          contactName: bookingData.contactName,
          contactEmail: bookingData.contactEmail,
          contactPhone: bookingData.contactPhone,
          specialRequests: bookingData.specialRequests,
          totalAmount: totalAmount
        };

        bookingResponse = await httpJson<{ bookingNumber: string }>(
          `${getApiBase()}/api/bookings/${existingBooking.id}`,
          {
            method: 'PUT',
            body: JSON.stringify(bookingPayload)
          }
        );
      } else {
        const bookingPayload = {
          tourId: tour.id,
          tourAvailabilityId: selectedAvailability.id,
          adultCount: bookingData.adultCount,
          childCount: bookingData.childCount,
          contactName: bookingData.contactName,
          contactEmail: bookingData.contactEmail,
          contactPhone: bookingData.contactPhone,
          specialRequests: bookingData.specialRequests,
          totalAmount: totalAmount
        };

        bookingResponse = await httpJson<{ bookingNumber: string }>(
          `${getApiBase()}/api/bookings`,
          {
            method: 'POST',
            body: JSON.stringify(bookingPayload)
          }
        );
      }

      setBookingNumber(bookingResponse.bookingNumber);

      // fetch booking id for redirect to success page later
      try {
        const booking = await httpJson<ExistingBooking>(`${getApiBase()}/api/bookings/${bookingResponse.bookingNumber}`);
        setBookingId(booking.id);
      } catch {}

      setShowQRDialog(true);
      toast.success("Đặt tour thành công! Vui lòng thanh toán để hoàn tất.");

    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error("Có lỗi xảy ra khi đặt tour. Vui lòng thử lại.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto poll for payment status when QR dialog is open
  useEffect(() => {
    // removed polling; prefer SignalR on PaymentProcessing page
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryName = (categoryCode: string) => {
    const category = categories.find(c => c.code === categoryCode);
    return category ? category.name : categoryCode;
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success("Đã sao chép vào clipboard");
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Không thể sao chép");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Cần đăng nhập</h2>
          <p className="text-gray-600 mb-4">Vui lòng đăng nhập để đặt tour</p>
          <Button onClick={() => {
            const currentUrl = window.location.pathname + window.location.search;
            navigate(`/login?returnUrl=${encodeURIComponent(currentUrl)}`);
          }}>
            Đăng nhập
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin tour...</p>
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy tour</h1>
          <Button onClick={() => navigate("/tours")}>Quay lại danh sách tour</Button>
        </div>
      </div>
    );
  }

  const hasFutureAvailabilities = availabilities.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-2 py-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Home className="h-4 w-4" />
              <span className="text-sm">Trang chủ</span>
            </button>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <button
              onClick={() => navigate("/tours")}
              className="text-gray-500 hover:text-gray-700 transition-colors text-sm"
            >
              Tours
            </button>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <button
              onClick={() => navigate(`/tour/${tourId}`)}
              className="text-gray-500 hover:text-gray-700 transition-colors text-sm"
            >
              {tour?.title || "Tour"}
            </button>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span className="text-gray-900 font-medium text-sm">Đặt tour</span>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tour Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Thông tin tour</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-4">
                  {tour.imageUrls && tour.imageUrls.length > 0 && (
                    <img
                      src={tour.imageUrls[0]}
                      alt={tour.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900">{tour.title}</h2>
                    <p className="text-gray-600 mt-1">{tour.location}</p>
                    <Badge variant="secondary" className="mt-2">{getCategoryName(tour.category)}</Badge>
                  </div>
                </div>
                <div 
                  className="text-gray-700 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: tour.shortDescription }}
                />
              </CardContent>
            </Card>

            {/* Tour Guide Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Hướng dẫn viên</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  {tour.tourGuideAvatar && (
                    <img
                      src={tour.tourGuideAvatar}
                      alt={tour.tourGuideName}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{tour.tourGuideName}</h3>
                    {tour.tourGuideRating && (
                      <div className="flex items-center space-x-2 mt-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm text-gray-600">
                          {tour.tourGuideRating} ({tour.tourGuideTotalReviews} đánh giá)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Form */}
            <Card>
              <CardHeader>
                <CardTitle>Thông tin đặt tour</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBooking} className="space-y-6">
                  {/* Date Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Label>Ngày khởi hành *</Label>
                      {availabilities.length > 6 && (
                        <Dialog open={showAllAvailabilities} onOpenChange={setShowAllAvailabilities}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Xem tất cả ({availabilities.length})
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Tất cả ngày khởi hành</DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                              {availabilities.map((availability) => (
                                <Card
                                  key={availability.id}
                                  className={`cursor-pointer transition-all ${
                                    selectedAvailability?.id === availability.id
                                      ? 'ring-2 ring-blue-500 bg-blue-50'
                                      : 'hover:shadow-md'
                                  }`}
                                  onClick={() => {
                                    setSelectedAvailability(availability);
                                    setShowAllAvailabilities(false);
                                  }}
                                >
                                  <CardContent className="p-4">
                                    <div className="space-y-2">
                                      <div className="flex items-center space-x-2">
                                        <Calendar className="h-4 w-4 text-blue-600" />
                                        <span className="font-medium text-sm">
                                          {formatDate(availability.date)}
                                        </span>
                                      </div>
                                      <div className="text-lg font-semibold text-blue-600">
                                        {formatPrice(availability.adultPrice)}
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        <div>Điểm khởi hành: {availability.departureDivisionName}</div>
                                        {availability.tripTime && <div>Thời gian: {availability.tripTime}</div>}
                                        {availability.vehicle && <div>Phương tiện: {availability.vehicle}</div>}
                                      </div>
                                      <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>
                                          {availability.bookedParticipants}/{availability.maxParticipants} người
                                        </span>
                                        <Badge variant={availability.bookedParticipants >= availability.maxParticipants ? "destructive" : "secondary"}>
                                          {availability.bookedParticipants >= availability.maxParticipants ? "Hết chỗ" : "Còn chỗ"}
                                        </Badge>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availabilities.slice(0, 6).map((availability) => (
                        <Card
                          key={availability.id}
                          className={`cursor-pointer transition-all ${
                            selectedAvailability?.id === availability.id
                              ? 'ring-2 ring-blue-500 bg-blue-50'
                              : 'hover:shadow-md'
                          }`}
                          onClick={() => setSelectedAvailability(availability)}
                        >
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-sm">
                                  {formatDate(availability.date)}
                                </span>
                              </div>
                              <div className="text-lg font-semibold text-blue-600">
                                {formatPrice(availability.adultPrice)}
                              </div>
                              <div className="text-xs text-gray-600">
                                <div>Điểm khởi hành: {availability.departureDivisionName}</div>
                                {availability.tripTime && <div>Thời gian: {availability.tripTime}</div>}
                                {availability.vehicle && <div>Phương tiện: {availability.vehicle}</div>}
                              </div>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>
                                  {availability.bookedParticipants}/{availability.maxParticipants} người
                                </span>
                                <Badge variant={availability.bookedParticipants >= availability.maxParticipants ? "destructive" : "secondary"}>
                                  {availability.bookedParticipants >= availability.maxParticipants ? "Hết chỗ" : "Còn chỗ"}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {!hasFutureAvailabilities && (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Không có ngày khởi hành khả dụng</p>
                      </div>
                    )}
                  </div>

                  {/* Participant Count */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="adultCount">Số người lớn *</Label>
                      <Input
                        id="adultCount"
                        type="number"
                        min="1"
                        value={bookingData.adultCount}
                        onChange={(e) => setBookingData(prev => ({
                          ...prev,
                          adultCount: parseInt(e.target.value) || 1
                        }))}
                        disabled={!hasFutureAvailabilities}
                      />
                    </div>
                    <div>
                      <Label htmlFor="childCount">Số trẻ em</Label>
                      <Input
                        id="childCount"
                        type="number"
                        min="0"
                        value={bookingData.childCount}
                        onChange={(e) => setBookingData(prev => ({
                          ...prev,
                          childCount: parseInt(e.target.value) || 0
                        }))}
                        disabled={!hasFutureAvailabilities}
                      />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Thông tin liên hệ</h3>
                    <div>
                      <Label htmlFor="contactName">Họ và tên *</Label>
                      <Input
                        id="contactName"
                        value={bookingData.contactName}
                        onChange={(e) => setBookingData(prev => ({
                          ...prev,
                          contactName: e.target.value
                        }))}
                        required
                        disabled={!hasFutureAvailabilities}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactEmail">Email *</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={bookingData.contactEmail}
                        onChange={(e) => setBookingData(prev => ({
                          ...prev,
                          contactEmail: e.target.value
                        }))}
                        required
                        disabled={!hasFutureAvailabilities}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactPhone">Số điện thoại *</Label>
                      <Input
                        id="contactPhone"
                        value={bookingData.contactPhone}
                        onChange={(e) => setBookingData(prev => ({
                          ...prev,
                          contactPhone: e.target.value
                        }))}
                        required
                        disabled={!hasFutureAvailabilities}
                      />
                    </div>
                    <div>
                      <Label htmlFor="specialRequests">Yêu cầu đặc biệt</Label>
                      <Input
                        id="specialRequests"
                        value={bookingData.specialRequests}
                        onChange={(e) => setBookingData(prev => ({
                          ...prev,
                          specialRequests: e.target.value
                        }))}
                        placeholder="Nhập yêu cầu đặc biệt (nếu có)"
                        disabled={!hasFutureAvailabilities}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={!hasFutureAvailabilities}>
                    {hasFutureAvailabilities ? 'Tiếp tục thanh toán' : 'Không có ngày khởi hành khả dụng'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Tóm tắt đặt tour</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedAvailability && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Ngày khởi hành:</span>
                        <span className="text-sm font-medium">{formatDate(selectedAvailability.date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Điểm khởi hành:</span>
                        <span className="text-sm font-medium">{selectedAvailability.departureDivisionName}</span>
                      </div>
                      {selectedAvailability.tripTime && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Thời gian:</span>
                          <span className="text-sm font-medium">{selectedAvailability.tripTime}</span>
                        </div>
                      )}
                      {selectedAvailability.vehicle && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Phương tiện:</span>
                          <span className="text-sm font-medium">{selectedAvailability.vehicle}</span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Người lớn ({bookingData.adultCount}):</span>
                        <span className="text-sm font-medium">
                          {formatPrice(selectedAvailability.adultPrice * bookingData.adultCount)}
                        </span>
                      </div>
                      {bookingData.childCount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Trẻ em ({bookingData.childCount}):</span>
                          <span className="text-sm font-medium">
                            {formatPrice(selectedAvailability.childPrice * bookingData.childCount)}
                          </span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="flex justify-between text-lg font-semibold">
                      <span>Tổng cộng:</span>
                      <span className="text-blue-600">
                        {formatPrice(
                          (selectedAvailability.adultPrice * bookingData.adultCount) +
                          (selectedAvailability.childPrice * bookingData.childCount)
                        )}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận đặt tour</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn đặt tour này không? Sau khi xác nhận, bạn sẽ được chuyển đến trang thanh toán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Tour:</span>
                <span className="text-sm font-medium">{tour?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Ngày khởi hành:</span>
                <span className="text-sm font-medium">
                  {selectedAvailability ? formatDate(selectedAvailability.date) : ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Số khách:</span>
                <span className="text-sm font-medium">
                  {bookingData.adultCount} người lớn, {bookingData.childCount} trẻ em
                </span>
              </div>
              <div className="flex justify-between text-lg font-semibold">
                <span>Tổng cộng:</span>
                <span className="text-blue-600">{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBooking} disabled={isProcessing}>
              {isProcessing ? "Đang xử lý..." : "Xác nhận đặt tour"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Code Payment Dialog */}
      <PaymentDialog
        open={showQRDialog}
        onOpenChange={setShowQRDialog}
        bookingNumber={bookingNumber}
        totalAmount={totalAmount}
        adminBanking={adminBanking}
      />
      <Footer />
    </div>
  );
};

export default TourBooking;
