import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  MapPin, 
  Clock, 
  Star, 
  Users, 
  Eye, 
  Calendar, 
  User, 
  Phone, 
  Mail,
  ArrowLeft,
  Share2,
  Heart,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  AlertCircle
} from "lucide-react";
import Header from "../components/Header";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useToast } from "../hooks/use-toast";
import { TourDto } from "../types/tour";
import { TourApiService, TourCategoryDto } from "../lib/tourApi";
import { TourAvailabilityApiService, TourAvailabilityDto } from "../src/lib/tourAvailabilityApi";

export default function TourDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [tour, setTour] = useState<TourDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isBookmark, setIsBookmark] = useState(false);
  const [availabilities, setAvailabilities] = useState<TourAvailabilityDto[]>([]);
  const [recentAvailability, setRecentAvailability] = useState<TourAvailabilityDto | null>(null);
  const [categories, setCategories] = useState<TourCategoryDto[]>([]);

  useEffect(() => {
    if (id) {
      fetchTourDetail(id);
    }
  }, [id]);

  useEffect(() => {
    // Load categories for mapping code -> name
    (async () => {
      try {
        const data = await TourApiService.getTourCategories();
        setCategories(data || []);
      } catch {}
    })();
  }, []);

  const fetchTourDetail = async (tourId: string) => {
    try {
      setLoading(true);
      const data = await TourApiService.getTourById(tourId);
      setTour(data);
      // Load tour availabilities and pick most recent upcoming
      const avails = await TourAvailabilityApiService.getTourAvailabilitiesByTour(tourId);
      setAvailabilities(avails || []);
      const today = new Date();
      const upcoming = (avails || [])
        .filter(a => a.isAvailable && new Date(a.date) >= new Date(today.toDateString()))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setRecentAvailability(upcoming[0] || null);
    } catch (error) {
      console.error('Error fetching tour details:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải chi tiết tour. Vui lòng thử lại sau.",
        variant: "destructive"
      });
      navigate('/tours');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string = "VND") => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency === 'VND' ? 'VND' : currency,
    }).format(price);
  };

  const formatDuration = (duration: number) => {
    if (duration < 24) {
      return `${duration} giờ`;
    }
    const days = Math.floor(duration / 24);
    const hours = duration % 24;
    if (hours === 0) {
      return `${days} ngày`;
    }
    return `${days} ngày ${hours} giờ`;
  };

  const handleBookTour = () => {
    if (tour) {
      navigate(`/tour/${tour.id}/book`);
    }
  };

  const handleShareTour = async () => {
    if (tour && navigator.share) {
      try {
        await navigator.share({
          title: tour.title,
          text: tour.shortDescription,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Đã sao chép",
        description: "Link tour đã được sao chép vào clipboard",
      });
    }
  };

  const handleToggleBookmark = () => {
    setIsBookmark(!isBookmark);
    toast({
      title: isBookmark ? "Đã bỏ lưu" : "Đã lưu",
      description: isBookmark ? "Tour đã được bỏ khỏi danh sách yêu thích" : "Tour đã được thêm vào danh sách yêu thích",
    });
  };

  const nextImage = () => {
    if (tour?.imageUrls && tour.imageUrls.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === tour.imageUrls!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (tour?.imageUrls && tour.imageUrls.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? tour.imageUrls!.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-96 bg-gray-200 rounded-lg mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
              <div className="space-y-4">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
                <div className="h-32 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Không tìm thấy tour
            </h3>
            <p className="text-gray-600 mb-4">
              Tour bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
            </p>
            <Button onClick={() => navigate('/tours')}>
              Quay lại danh sách tour
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/tours')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại danh sách tour
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tour Images */}
            {tour.imageUrls && tour.imageUrls.length > 0 && (
              <Card>
                <CardContent className="p-0">
                  <div className="relative h-96 overflow-hidden rounded-t-lg">
                    <img
                      src={tour.imageUrls[currentImageIndex]}
                      alt={tour.title}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Navigation Arrows */}
                    {tour.imageUrls.length > 1 && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                          onClick={prevImage}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                          onClick={nextImage}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </>
                    )}

                    {/* Image Counter */}
                    {tour.imageUrls.length > 1 && (
                      <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                        {currentImageIndex + 1} / {tour.imageUrls.length}
                      </div>
                    )}
                  </div>

                  {/* Image Thumbnails */}
                  {tour.imageUrls.length > 1 && (
                    <div className="p-4 flex gap-2 overflow-x-auto">
                      {tour.imageUrls.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                            index === currentImageIndex 
                              ? 'border-blue-500' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${tour.title} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tour Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">
                        {(() => {
                          const match = categories.find(c => c.code === (tour.category as any) || c.name === (tour.category as any));
                          return match ? match.name : tour.category;
                        })()}
                      </Badge>
                      {tour.isFeatured && (
                        <Badge className="bg-yellow-500 text-white">Nổi bật</Badge>
                      )}
                    </div>
                    <CardTitle className="text-2xl font-bold">{tour.title}</CardTitle>
                    <div className="text-gray-600 mt-2 prose max-w-none" dangerouslySetInnerHTML={{ __html: tour.shortDescription }} />
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleToggleBookmark}
                    >
                      <Heart className={`w-4 h-4 ${isBookmark ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleShareTour}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Địa điểm</p>
                      <p className="font-medium">{tour.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Thời gian</p>
                      <p className="font-medium">{recentAvailability?.tripTime || formatDuration(tour.duration)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Số người</p>
                      <p className="font-medium">Tối đa {tour.maxParticipants}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    <div>
                      <p className="text-sm text-gray-500">Đánh giá</p>
                      <p className="font-medium">{tour.averageRating.toFixed(1)} ({tour.totalReviews})</p>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Tour Details Tabs */}
                <Tabs defaultValue="description" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="description">Mô tả</TabsTrigger>
                    <TabsTrigger value="itinerary">Lịch trình</TabsTrigger>
                    <TabsTrigger value="details">Chi tiết</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="description" className="mt-6">
                    <div className="prose max-w-none text-gray-700 leading-relaxed">
                      <div dangerouslySetInnerHTML={{ __html: tour.description }} />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="itinerary" className="mt-6">
                    {(() => {
                      if (!tour.itinerary) return <p className="text-gray-500 italic">Chưa có thông tin lịch trình</p>;
                      try {
                        const parsed = JSON.parse(tour.itinerary);
                        if (Array.isArray(parsed)) {
                          return (
                            <div className="space-y-4">
                              {parsed.map((item: any, idx: number) => (
                                <div key={idx} className="border rounded-lg p-4">
                                  <div className="font-semibold mb-1">Ngày {item.day ?? idx + 1}: {item.title || ''}</div>
                                  {item.description ? (
                                    <div className="prose max-w-none text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: String(item.description) }} />
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          );
                        }
                      } catch {}
                      return (
                        <div className="prose max-w-none text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: tour.itinerary }} />
                      );
                    })()}
                  </TabsContent>
                  
                  <TabsContent value="details" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          Bao gồm
                        </h4>
                        {(() => {
                          if (!tour.includes) return <p className="text-gray-500 italic">Chưa có thông tin</p>;
                          try {
                            const parsed = JSON.parse(tour.includes);
                            if (Array.isArray(parsed)) {
                              return (
                                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                                  {parsed.map((x: any, i: number) => (
                                    <li key={i}>{String(x)}</li>
                                  ))}
                                </ul>
                              );
                            }
                          } catch {}
                          return <div className="prose max-w-none text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: tour.includes }} />;
                        })()}
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <X className="w-4 h-4 text-red-500" />
                          Không bao gồm
                        </h4>
                        {(() => {
                          if (!tour.excludes) return <p className="text-gray-500 italic">Chưa có thông tin</p>;
                          try {
                            const parsed = JSON.parse(tour.excludes);
                            if (Array.isArray(parsed)) {
                              return (
                                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                                  {parsed.map((x: any, i: number) => (
                                    <li key={i}>{String(x)}</li>
                                  ))}
                                </ul>
                              );
                            }
                          } catch {}
                          return <div className="prose max-w-none text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: tour.excludes }} />;
                        })()}
                      </div>
                    </div>
                    
                    {tour.terms && (
                      <div className="mt-6">
                        <h4 className="font-semibold mb-3">Điều khoản và điều kiện</h4>
                        <div className="prose max-w-none text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: tour.terms }} />
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-xl">Đặt tour</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {formatPrice(tour.price, tour.currency)}
                  </div>
                  <p className="text-sm text-gray-500">Giá cho mỗi người</p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Đánh giá trung bình</span>
                    <span className="font-medium">{tour.averageRating.toFixed(1)}/5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Số đánh giá</span>
                    <span className="font-medium">{tour.totalReviews}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Số lượt đặt</span>
                    <span className="font-medium">{tour.totalBookings}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Lượt xem</span>
                    <span className="font-medium">{tour.viewCount}</span>
                  </div>
                </div>

                <Button 
                  onClick={handleBookTour}
                  className="w-full"
                  size="lg"
                >
                  Đặt tour ngay
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Đặt tour và thanh toán sau. Hủy miễn phí 24h trước ngày khởi hành.
                </p>
              </CardContent>
            </Card>

            {/* Upcoming Availabilities */}
            {availabilities && availabilities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lịch khởi hành</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(availabilities
                    .slice()
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .filter(a => a.isAvailable)
                  ).slice(0, 8).map((a) => (
                    <div key={a.id} className="flex items-center justify-between gap-3 border rounded-md p-3">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {new Date(a.date).toLocaleDateString('vi-VN')}
                        </div>
                        <div className="text-xs text-gray-500">
                          Điểm đi: {a.departureDivisionName}
                        </div>
                        {a.tripTime && (
                          <div className="text-xs text-gray-500">Thời gian: {a.tripTime}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Chỉ từ</div>
                        <div className="font-semibold text-blue-600">
                          {formatPrice(a.adultPrice, 'VND')}
                        </div>
                        <Button size="sm" className="mt-2" onClick={() => navigate(`/tour/${tour.id}/book`)}>
                          Chọn
                        </Button>
                      </div>
                    </div>
                  ))}
                  {availabilities.filter(a => a.isAvailable).length === 0 && (
                    <div className="text-sm text-gray-500">Chưa có lịch khởi hành khả dụng</div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tour Guide Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Hướng dẫn viên</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-semibold">{tour.tourGuideName}</p>
                    <p className="text-sm text-gray-500">Hướng dẫn viên</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">{tour.tourGuideEmail}</span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate(`/guide/${tour.tourGuideId}`)}
                >
                  Xem hồ sơ
                </Button>
              </CardContent>
            </Card>

            {/* Removed Tour Stats card */}
          </div>
        </div>
      </div>
    </div>
  );
}
