import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Star, MapPin, Clock } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { TourDto } from "../types/tour";
import { TourApiService } from "../lib/tourApi";
import { useAuth } from "../src/hooks/useAuth";

interface FeaturedToursProps {
  limit?: number;
  showTitle?: boolean;
}

export default function FeaturedTours({ limit = 6, showTitle = true }: FeaturedToursProps) {
  const navigate = useNavigate();
  const [featuredTours, setFeaturedTours] = useState<TourDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    fetchFeaturedTours();
  }, [limit]);

  const fetchFeaturedTours = async () => {
    try {
      setLoading(true);
      const tours = await TourApiService.getFeaturedTours(limit);
      setFeaturedTours(tours);
    } catch (error) {
      console.error('Error fetching featured tours:', error);
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

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(featuredTours.length / 2));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(featuredTours.length / 2)) % Math.ceil(featuredTours.length / 2));
  };

  if (loading) {
    return (
      <section className="py-8 md:py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: limit }).map((_, index) => (
                <Card key={index}>
                  <CardContent className="p-0">
                    <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (featuredTours.length === 0) {
    return null;
  }

  return (
    <section className="py-8 md:py-12 bg-white">
      <div className="container mx-auto px-4">
        {showTitle && (
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Tour nổi bật</h2>
            <p className="text-gray-600">Những tour du lịch được yêu thích nhất</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredTours.map((tour) => (
            <Card key={tour.id} className="group hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-0">
                {/* Tour Image */}
                <div className="relative h-48 overflow-hidden rounded-t-lg">
                  {tour.imageUrls && tour.imageUrls.length > 0 ? (
                    <img
                      src={tour.imageUrls[0]}
                      alt={tour.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">Không có hình ảnh</span>
                    </div>
                  )}
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className="bg-yellow-500 text-white">Nổi bật</Badge>
                    <Badge variant="secondary">{tour.category}</Badge>
                  </div>

                  {/* Price */}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1">
                    <span className="font-bold text-lg text-gray-900">
                      {formatPrice(tour.price, tour.currency)}
                    </span>
                  </div>
                </div>

                {/* Tour Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 mb-1">
                      {tour.title}
                    </h3>
                    <div 
                      className="text-sm text-gray-600 line-clamp-2 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: tour.shortDescription }}
                    />
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{tour.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(tour.duration)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span>{tour.averageRating.toFixed(1)} ({tour.totalReviews})</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-xs text-gray-500">
                      Hướng dẫn viên: {tour.tourGuideName}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => navigate(`/tour/${tour.id}`)}
                      className="flex-1"
                    >
                      Chi tiết
                    </Button>
                    {!(user && user.role === "TourGuide" && tour.tourGuideId === user.id) && (
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/tour/${tour.id}/book`)}
                        className="flex-1"
                      >
                        Đặt tour
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All Tours Button */}
        <div className="text-center mt-8">
          <Button
            onClick={() => navigate('/tours')}
            variant="outline"
            size="lg"
          >
            Xem tất cả tour
          </Button>
        </div>
      </div>
    </section>
  );
}

