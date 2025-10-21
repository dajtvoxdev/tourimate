import React, { useState } from "react";
import { Star, X, Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmojiTextarea } from "@/components/ui/emoji-textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { httpJson, getApiBase } from "@/src/lib/http";
import { toast } from "sonner";

interface ReviewFormProps {
  tourId: string;
  onReviewSubmitted: () => void;
  onCancel: () => void;
}

export function ReviewForm({ tourId, onReviewSubmitted, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleRatingClick = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const handleRatingHover = (hoveredRating: number) => {
    setHoveredRating(hoveredRating);
  };

  const handleRatingLeave = () => {
    setHoveredRating(0);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages: string[] = [];
      Array.from(files).forEach((file) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              newImages.push(e.target.result as string);
              if (newImages.length === Array.from(files).length) {
                setImages(prev => [...prev, ...newImages]);
              }
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error("Vui lòng chọn đánh giá");
      return;
    }

    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung đánh giá");
      return;
    }

    try {
      setSubmitting(true);
      
      const reviewData = {
        tourId,
        rating,
        title: title.trim() || null,
        content: content.trim(),
        images: images.length > 0 ? images : null
      };

      await httpJson(`${getApiBase()}/api/reviews`, {
        method: "POST",
        body: JSON.stringify(reviewData)
      });

      toast.success("Đánh giá đã được gửi thành công!");
      onReviewSubmitted();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast.error(error.message || "Không thể gửi đánh giá. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starRating = index + 1;
      const isActive = starRating <= (hoveredRating || rating);
      
      return (
        <button
          key={index}
          type="button"
          className="focus:outline-none"
          onClick={() => handleRatingClick(starRating)}
          onMouseEnter={() => handleRatingHover(starRating)}
          onMouseLeave={handleRatingLeave}
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              isActive ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        </button>
      );
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Viết đánh giá</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div className="space-y-2">
            <Label>Đánh giá *</Label>
            <div className="flex items-center gap-1">
              {renderStars()}
              <span className="ml-2 text-sm text-gray-600">
                {rating > 0 && (
                  rating === 1 ? "Rất tệ" :
                  rating === 2 ? "Tệ" :
                  rating === 3 ? "Bình thường" :
                  rating === 4 ? "Tốt" : "Rất tốt"
                )}
              </span>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Tiêu đề (tùy chọn)</Label>
            <Input
              id="title"
              placeholder="Nhập tiêu đề cho đánh giá của bạn..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Nội dung đánh giá *</Label>
            <EmojiTextarea
              placeholder="Chia sẻ trải nghiệm của bạn về tour này..."
              value={content}
              onChange={setContent}
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-gray-500">
              {content.length}/1000 ký tự
            </p>
          </div>

          {/* Images */}
          <div className="space-y-2">
            <Label>Hình ảnh (tùy chọn)</Label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="images"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Label
                  htmlFor="images"
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <Upload className="w-4 h-4" />
                  Chọn hình ảnh
                </Label>
                <span className="text-xs text-gray-500">
                  Tối đa 5 hình ảnh
                </span>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Review image ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

         
          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={submitting || rating === 0 || !content.trim()}
              className="flex-1"
            >
              {submitting ? "Đang gửi..." : "Gửi đánh giá"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
