import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { MapPin, Star } from "lucide-react";
import { TourApiService } from "../lib/tourApi";
import { TourDto } from "../types/tour";
import { httpJson, getApiBase } from "../src/lib/http";

type GuideProfile = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  avatar?: string;
  bioHtml: string;
  location: string;
  averageRating: number;
  totalReviews: number;
  totalActiveTours: number;
  createdAt: string;
  updatedAt: string;
};

export default function GuideDetail() {
  const { guideId } = useParams<{ guideId: string }>();
  const navigate = useNavigate();

  const [guide, setGuide] = useState<GuideProfile | null>(null);
  const [tours, setTours] = useState<TourDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!guideId) return;
      try {
        setLoading(true);
        const profile = await httpJson<GuideProfile>(`${getApiBase()}/api/guides/${guideId}`, { skipAuth: true });
        setGuide(profile);
        const guideTours = await TourApiService.getToursByGuide(guideId, true);
        setTours(guideTours || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [guideId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
            <div className="h-64 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p className="text-gray-600">Không tìm thấy thông tin hướng dẫn viên.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Overview */}
        <div className="bg-white rounded-xl border shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <img
              src={guide.avatar || "https://via.placeholder.com/160"}
              alt={guide.fullName}
              className="w-32 h-32 rounded-full object-cover border"
            />
            <div className="flex-1 space-y-2">
              <h1 className="text-2xl font-bold">{guide.fullName}</h1>
              <div className="flex items-center gap-3 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{guide.location || "Chưa cập nhật"}</span>
                <span className="inline-flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  {guide.averageRating?.toFixed(1) || "0.0"} ({guide.totalReviews})
                </span>
                <span>• {guide.totalActiveTours} tour đang hoạt động</span>
              </div>
              <div className="text-sm text-gray-600">
                {guide.email}{guide.phoneNumber ? ` • ${guide.phoneNumber}` : ""}
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        {guide.bioHtml && (
          <div className="bg-white rounded-xl border shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-3">Giới thiệu</h2>
            <div className="prose max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: guide.bioHtml }} />
          </div>
        )}

        {/* Tours Grid */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Các tour của hướng dẫn viên</h2>
            <button
              className="text-sm text-blue-600 hover:underline"
              onClick={() => navigate(`/tours?guideId=${guide.id}`)}
            >
              Xem tất cả
            </button>
          </div>
          {tours.length === 0 ? (
            <p className="text-gray-600">Chưa có tour nào.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tours.map((t) => (
                <div key={t.id} className="border rounded-lg overflow-hidden hover:shadow-sm transition-shadow bg-white">
                  <div className="h-40 bg-gray-100">
                    {t.imageUrls && t.imageUrls.length > 0 ? (
                      <img src={t.imageUrls[0]} alt={t.title} className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="font-semibold line-clamp-2">{t.title}</div>
                    <div className="text-sm text-gray-600 line-clamp-2" dangerouslySetInnerHTML={{ __html: t.shortDescription }} />
                    <button className="w-full mt-2 border rounded-md py-2 text-sm" onClick={() => navigate(`/tour/${t.id}`)}>
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}