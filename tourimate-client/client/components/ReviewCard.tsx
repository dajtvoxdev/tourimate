import React, { useState } from "react";
import { Star, ThumbsUp, MessageCircle, Calendar, User, CheckCircle, Flag } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { EmojiTextarea } from "@/components/ui/emoji-textarea";
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

interface ReviewCardProps {
  review: Review;
  onVoteHelpful: (reviewId: string) => void;
  onReply?: (reviewId: string) => void;
}

export function ReviewCard({ review, onVoteHelpful, onReply }: ReviewCardProps) {
  const [showReplies, setShowReplies] = useState(false);
  const [voting, setVoting] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reporting, setReporting] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replying, setReplying] = useState(false);
  const [replies, setReplies] = useState<ReviewReply[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const handleVoteHelpful = async () => {
    try {
      setVoting(true);
      await onVoteHelpful(review.id);
    } catch (error) {
      console.error("Error voting helpful:", error);
    } finally {
      setVoting(false);
    }
  };

  const handleReportReview = async () => {
    try {
      setReporting(true);
      await httpJson(`${getApiBase()}/api/reviews/${review.id}/report`, {
        method: "POST",
        body: JSON.stringify({
          reason: reportReason || "Inappropriate content",
          description: reportDescription,
        }),
      });
      toast.success("Báo cáo đánh giá thành công");
      setShowReportDialog(false);
      setReportReason("");
      setReportDescription("");
    } catch (error: any) {
      console.error("Error reporting review:", error);
      toast.error(error.message || "Không thể báo cáo đánh giá");
    } finally {
      setReporting(false);
    }
  };

  const handleReplyToReview = async () => {
    if (!replyContent.trim()) {
      toast.error("Vui lòng nhập nội dung trả lời");
      return;
    }

    try {
      setReplying(true);
      await httpJson(`${getApiBase()}/api/reviews/${review.id}/reply`, {
        method: "POST",
        body: JSON.stringify({
          content: replyContent.trim(),
        }),
      });
      toast.success("Trả lời đánh giá thành công");
      setShowReplyInput(false);
      setReplyContent("");
      // Refresh replies
      if (showReplies) {
        fetchReplies();
      }
    } catch (error: any) {
      console.error("Error replying to review:", error);
      toast.error(error.message || "Không thể trả lời đánh giá");
    } finally {
      setReplying(false);
    }
  };

  const fetchReplies = async () => {
    try {
      setLoadingReplies(true);
      const response = await httpJson<ReviewReply[]>(
        `${getApiBase()}/api/reviews/${review.id}/replies`
      );
      setReplies(response);
    } catch (error) {
      console.error("Error fetching replies:", error);
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleToggleReplies = async () => {
    if (!showReplies && replies.length === 0) {
      await fetchReplies();
    }
    setShowReplies(!showReplies);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const reviewImages = review.images ? JSON.parse(review.images) : [];

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={review.user.avatar} />
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {getUserInitials(review.user.firstName, review.user.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm">
                  {review.user.firstName} {review.user.lastName}
                </h4>
                {review.isVerified && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(review.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {renderStars(review.rating)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {review.title && (
          <h5 className="font-medium text-gray-900 mb-2">{review.title}</h5>
        )}
        
        <p className="text-gray-700 text-sm leading-relaxed mb-3">
          {review.content}
        </p>

        {/* Review Images */}
        {reviewImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
            {reviewImages.map((image: string, index: number) => (
              <img
                key={index}
                src={image}
                alt={`Review image ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg"
              />
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVoteHelpful}
              disabled={voting}
              className="text-gray-600 hover:text-blue-600"
            >
              <ThumbsUp className="w-4 h-4 mr-1" />
              Hữu ích ({review.helpfulVotes})
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="text-gray-600 hover:text-blue-600"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              {showReplyInput ? 'Hủy' : 'Trả lời'}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReportDialog(true)}
              className="text-gray-600 hover:text-red-600"
            >
              <Flag className="w-4 h-4 mr-1" />
              Báo cáo
            </Button>
          </div>

          {review.replyCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleReplies}
              disabled={loadingReplies}
              className="text-blue-600 hover:text-blue-700"
            >
              {loadingReplies ? 'Đang tải...' : showReplies ? 'Ẩn' : 'Xem'} {review.replyCount} trả lời
            </Button>
          )}
        </div>

        {/* Report Dialog */}
        <AlertDialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Báo cáo đánh giá</AlertDialogTitle>
              <AlertDialogDescription>
                Vui lòng cho chúng tôi biết lý do bạn báo cáo đánh giá này.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Lý do</label>
                <select
                  className="w-full mt-1 border rounded-md p-2"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                >
                  <option value="">Chọn lý do</option>
                  <option value="Inappropriate content">Nội dung không phù hợp</option>
                  <option value="Spam">Spam</option>
                  <option value="Fake review">Đánh giá giả mạo</option>
                  <option value="Offensive language">Ngôn ngữ xúc phạm</option>
                  <option value="Other">Khác</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Mô tả chi tiết (tùy chọn)</label>
                <Textarea
                  placeholder="Nhập mô tả chi tiết về vấn đề..."
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={reporting}>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReportReview}
                disabled={reporting}
                className="bg-red-600 hover:bg-red-700"
              >
                {reporting ? "Đang gửi..." : "Báo cáo"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reply Input */}
        {showReplyInput && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Viết phản hồi của bạn
                </label>
                <EmojiTextarea
                  placeholder="Nhập phản hồi của bạn..."
                  value={replyContent}
                  onChange={setReplyContent}
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowReplyInput(false);
                    setReplyContent("");
                  }}
                  disabled={replying}
                >
                  Hủy
                </Button>
                <Button
                  size="sm"
                  onClick={handleReplyToReview}
                  disabled={replying || !replyContent.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {replying ? "Đang gửi..." : "Gửi phản hồi"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Replies */}
        {showReplies && (
          <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-100">
            {loadingReplies ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Đang tải phản hồi...</p>
              </div>
            ) : replies.length > 0 ? (
              replies.map((reply) => (
                <div key={reply.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                        {getUserInitials(reply.replyUser.firstName, reply.replyUser.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">
                      {reply.replyUser.firstName} {reply.replyUser.lastName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(reply.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 ml-8">
                    {reply.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">Chưa có phản hồi nào</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

