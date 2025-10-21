import React, { useState, useEffect } from "react";
import { Star, MessageSquare, Plus, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ReviewCard } from "./ReviewCard";
import { ReviewForm } from "./ReviewForm";
import { httpJson, getApiBase } from "@/src/lib/http";
import { toast } from "sonner";

interface ReviewUser {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

interface ReviewReply {
  id: string;
  content: string;
  createdAt: string;
  replyUser: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface Review {
  id: string;
  rating: number;
  title?: string;
  content: string;
  images?: string;
  helpfulVotes: number;
  createdAt: string;
  isVerified: boolean;
  user: ReviewUser;
  replyCount: number;
  replies: ReviewReply[];
}

interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

interface ReviewsSectionProps {
  tourId: string;
  averageRating: number;
  totalReviews: number;
  onRatingUpdate?: (averageRating: number, totalReviews: number) => void;
}

export function ReviewsSection({ tourId, averageRating, totalReviews, onRatingUpdate }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);
  const [reviewEligibility, setReviewEligibility] = useState<{
    canReview: boolean;
    reason: string;
    message: string;
    completedBooking?: any;
  } | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
    checkReviewEligibility();
  }, [tourId, currentPage]);

  const checkReviewEligibility = async () => {
    try {
      setEligibilityLoading(true);
      const response = await httpJson<{
        canReview: boolean;
        reason: string;
        message: string;
        completedBooking?: any;
      }>(`${getApiBase()}/api/reviews/tour/${tourId}/eligibility`);
      
      setReviewEligibility(response);
    } catch (error) {
      console.error("Error checking review eligibility:", error);
      setReviewEligibility({
        canReview: false,
        reason: "error",
        message: "Không thể kiểm tra quyền đánh giá"
      });
    } finally {
      setEligibilityLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await httpJson<ReviewsResponse>(
        `${getApiBase()}/api/reviews/tour/${tourId}?page=${currentPage}&pageSize=5`,
        { skipAuth: true }
      );
      
      setReviews(response.reviews);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Không thể tải đánh giá");
    } finally {
      setLoading(false);
    }
  };

  const handleVoteHelpful = async (reviewId: string) => {
    try {
      await httpJson(`${getApiBase()}/api/reviews/${reviewId}/helpful`, {
        method: "POST"
      });
      
      // Update local state
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, helpfulVotes: review.helpfulVotes + 1 }
          : review
      ));
      
      toast.success("Cảm ơn bạn đã đánh giá!");
    } catch (error: any) {
      console.error("Error voting helpful:", error);
      toast.error(error.message || "Không thể đánh giá hữu ích");
    }
  };

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    setCurrentPage(1);
    fetchReviews();
    checkReviewEligibility(); // Refresh eligibility after submission
    
    // Update parent component with new rating
    if (onRatingUpdate) {
      // We could fetch the updated rating here, but for now just increment total
      onRatingUpdate(averageRating, totalReviews + 1);
    }
    
    toast.success("Đánh giá của bạn đã được gửi thành công!");
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    };
    
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`${sizeClasses[size]} ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  const distribution = getRatingDistribution();

  return (
    <div className="space-y-6">
      {/* Reviews Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Đánh giá ({totalReviews})
              </CardTitle>
            </div>
            {eligibilityLoading ? (
              <Button disabled className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Đang kiểm tra...
              </Button>
            ) : reviewEligibility?.canReview ? (
              <Button
                onClick={() => setShowReviewForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Viết đánh giá
              </Button>
            ) : (
              <div className="text-right">
                <Button disabled variant="outline" className="flex items-center gap-2 mb-2">
                  <Plus className="w-4 h-4" />
                  Viết đánh giá
                </Button>
                
                {reviewEligibility?.reason === "not_completed" && (
                  <div className="text-xs text-gray-500 mt-1 space-y-1">
                  </div>
                )}
                {reviewEligibility?.reason === "not_authenticated" && (
                  <p className="text-xs text-gray-500 mt-1">
                    Vui lòng đăng nhập để đánh giá tour này
                  </p>
                )}
                {reviewEligibility?.reason === "already_reviewed" && (
                  <p className="text-xs text-gray-500 mt-1">
                    Cảm ơn bạn đã đánh giá tour này
                  </p>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {averageRating.toFixed(1)}
              </div>
              <div className="flex items-center justify-center gap-1 mb-2">
                {renderStars(Math.round(averageRating), 'lg')}
              </div>
              <p className="text-sm text-gray-600">
                Dựa trên {totalReviews} đánh giá
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm w-8">{rating}</span>
                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{
                        width: `${totalReviews > 0 ? (distribution[rating as keyof typeof distribution] / totalReviews) * 100 : 0}%`
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8">
                    {distribution[rating as keyof typeof distribution]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Form */}
      {showReviewForm && reviewEligibility?.canReview && (
        <ReviewForm
          tourId={tourId}
          onReviewSubmitted={handleReviewSubmitted}
          onCancel={() => setShowReviewForm(false)}
        />
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-24" />
                      <div className="h-3 bg-gray-200 rounded w-16" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <>
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onVoteHelpful={handleVoteHelpful}
              />
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Trước
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                    const page = index + 1;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Sau
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Chưa có đánh giá nào
              </h3>
              <p className="text-gray-600 mb-4">
                Hãy là người đầu tiên chia sẻ trải nghiệm về tour này!
              </p>
              <Button onClick={() => setShowReviewForm(true)}>
                Viết đánh giá đầu tiên
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
