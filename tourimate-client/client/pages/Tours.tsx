import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, MapPin, Clock, Star, Users, Eye, ChevronDown, ChevronUp, Calendar as CalendarIcon } from "lucide-react";
import Header from "../components/Header";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SearchableSelect } from "../components/ui/select";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { httpJson, getApiBase } from "../src/lib/http";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "../lib/utils";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Slider } from "../components/ui/slider";
import { useToast } from "../hooks/use-toast";
import { TourListDto, TourSearchRequest, TourSearchResponse, SORT_OPTIONS } from "../types/tour";
import { TourApiService, TourCategoryDto } from "../lib/tourApi";

export default function Tours() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State for tours and loading
  const [tours, setTours] = useState<TourListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  
  // State for categories
  const [categories, setCategories] = useState<TourCategoryDto[]>([]);
  const [provinces, setProvinces] = useState<{ code: number; name: string }[]>([]);
  const [departures, setDepartures] = useState<{ code: number; name: string }[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  
  // State for price range slider
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]); // 0 to 10M VND
  const [maxPrice, setMaxPrice] = useState(10000000); // Maximum price for slider
  
  // State for filters
  const [showFilters, setShowFilters] = useState(false);
  const [searchParams, setSearchParams] = useState<TourSearchRequest>({
    searchTerm: "",
    location: "",
    category: "",
    minPrice: undefined,
    maxPrice: undefined,
    minDuration: undefined,
    maxDuration: undefined,
    isActive: true, // Only show active tours by default
    isFeatured: undefined,
    status: "Approved", // Only show approved tours
    sortBy: "createdat",
    sortDirection: "desc",
    page: 1,
    pageSize: 12
  });

  // Filter options
  const sortOptions = SORT_OPTIONS;

  // Fetch tours from API
  const fetchTours = async () => {
    try {
      setLoading(true);
      const data = await TourApiService.getTours(searchParams);
      setTours(data.tours);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
      
      // Update max price for slider if we have tours
      if (data.tours.length > 0) {
        const maxTourPrice = Math.max(...data.tours.map(tour => tour.price));
        if (maxTourPrice > maxPrice) {
          setMaxPrice(Math.ceil(maxTourPrice / 100000) * 100000); // Round up to nearest 100k
        }
      }
    } catch (error) {
      console.error('Error fetching tours:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách tour. Vui lòng thử lại sau.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const data = await TourApiService.getTourCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh mục tour. Vui lòng thử lại sau.",
        variant: "destructive"
      });
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    fetchTours();
  }, [searchParams]);

  useEffect(() => {
    fetchCategories();
    (async () => {
      try {
        // Load provinces from API
        const provsResp = await httpJson<any[]>(`${getApiBase()}/api/divisions/provinces`, { skipAuth: true });
        const provs = (provsResp || []).map((d: any) => ({
          code: d.code ?? d.Code,
          name: (d.fullName ?? d.FullName ?? d.name ?? d.Name) as string
        }));
        setProvinces(provs);
        // Use provinces list for departure filter as well (province-level)
        setDepartures(provs);
      } catch {}
    })();
  }, []);

  // Sync price range slider with search parameters
  useEffect(() => {
    setPriceRange([
      searchParams.minPrice || 0,
      searchParams.maxPrice || maxPrice
    ]);
  }, [searchParams.minPrice, searchParams.maxPrice, maxPrice]);

  const handleSearch = () => {
    setSearchParams(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (key: keyof TourSearchRequest, value: any) => {
    setSearchParams(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePriceRangeChange = (value: number[]) => {
    setPriceRange([value[0], value[1]]);
    setSearchParams(prev => ({ 
      ...(prev as any), 
      // use availability price filters
      minAvailPrice: value[0] === 0 ? undefined : value[0],
      maxAvailPrice: value[1] === maxPrice ? undefined : value[1],
      page: 1 
    } as any));
  };

  const clearFilters = () => {
    setSearchParams({
      searchTerm: "",
      location: "",
      category: "",
      minAvailPrice: undefined as any,
      maxAvailPrice: undefined as any,
      destinationProvinceCode: undefined as any,
      departureDivisionCode: undefined as any,
      startDate: undefined as any,
      isActive: true,
      isFeatured: undefined,
      status: "Approved",
      sortBy: "createdat",
      sortDirection: "desc",
      page: 1,
      pageSize: 12
    });
    setPriceRange([0, maxPrice]);
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

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Khám phá các tour du lịch</h1>
          <p className="text-gray-600">Tìm kiếm và khám phá những trải nghiệm du lịch tuyệt vời</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          {/* Search Input */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Tìm kiếm tour, địa điểm, hướng dẫn viên..."
                value={searchParams.searchTerm}
                onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
                className="pl-10"
              />
            </div>
            {/* Removed free text location */}
            <Button onClick={handleSearch} className="px-8">
              <Search className="w-4 h-4 mr-2" />
              Tìm kiếm
            </Button>
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Bộ lọc
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
              
              {totalCount > 0 && (
                <span className="text-sm text-gray-600">
                  Tìm thấy {totalCount} tour
                </span>
              )}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sắp xếp:</span>
              <Select
                value={`${searchParams.sortBy}-${searchParams.sortDirection}`}
                onValueChange={(value) => {
                  const [sortBy, sortDirection] = value.split('-');
                  handleFilterChange("sortBy", sortBy);
                  handleFilterChange("sortDirection", sortDirection);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <div key={option.value}>
                      <SelectItem value={`${option.value}-desc`}>
                        {option.label} (Mới → Cũ)
                      </SelectItem>
                      <SelectItem value={`${option.value}-asc`}>
                        {option.label} (Cũ → Mới)
                      </SelectItem>
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Danh mục
                  </label>
                  <Select
                    value={searchParams.category || "all"}
                    onValueChange={(value) => handleFilterChange("category", value === "all" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả danh mục</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Destination Province */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Điểm đến</label>
                  <SearchableSelect
                    value={(searchParams as any).destinationProvinceCode ? String((searchParams as any).destinationProvinceCode) : ""}
                    onValueChange={(value) => handleFilterChange("destinationProvinceCode" as any, value ? Number(value) : undefined)}
                    placeholder="Tất cả tỉnh/thành"
                    searchPlaceholder="Tìm kiếm tỉnh/thành..."
                    options={[{ value: "", label: "Tất cả" }, ...provinces.map(p => ({ value: String(p.code), label: p.name }))]}
                  />
                </div>

                {/* Departure */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Điểm đi</label>
                  <SearchableSelect
                    value={(searchParams as any).departureDivisionCode ? String((searchParams as any).departureDivisionCode) : ""}
                    onValueChange={(value) => handleFilterChange("departureDivisionCode" as any, value ? Number(value) : undefined)}
                    placeholder="Tất cả điểm đi"
                    searchPlaceholder="Tìm kiếm điểm đi..."
                    options={[{ value: "", label: "Tất cả" }, ...departures.map(d => ({ value: String(d.code), label: d.name }))]}
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Ngày khởi hành</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={"w-full justify-start text-left font-normal" + (!startDate ? " text-muted-foreground" : "")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "dd/MM/yyyy", { locale: vi }) : <span>Chọn ngày</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[100]" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(d) => {
                          setStartDate(d);
                          handleFilterChange("startDate" as any, d ? new Date(d.setHours(0,0,0,0)).toISOString() : undefined);
                        }}
                        locale={vi}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Price Range */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Khoảng giá (VND)
                  </label>
                  <div className="space-y-3">
                    <div className="px-3">
                      <Slider
                        value={priceRange}
                        onValueChange={handlePriceRangeChange}
                        max={maxPrice}
                        min={0}
                        step={100000} // 100k VND steps
                        className="w-full"
                      />
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{formatPrice(priceRange[0])}</span>
                      <span>{formatPrice(priceRange[1])}</span>
                    </div>
                  </div>
                </div>

                {/* Removed duration filter */}

                {/* Special Filters */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Đặc biệt
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={searchParams.isFeatured === true}
                        onChange={(e) => handleFilterChange("isFeatured", e.target.checked ? true : undefined)}
                        className="mr-2"
                      />
                      <span className="text-sm">Tour nổi bật</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={clearFilters}>
                  Xóa bộ lọc
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Tours Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
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
        ) : tours.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {tours.map((tour) => (
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
                        {tour.isFeatured && (
                          <Badge className="bg-yellow-500 text-white">Nổi bật</Badge>
                        )}
                        <Badge variant="secondary">
                          {(() => {
                            const match = categories.find(c => c.code === (tour.category as any) || c.name === (tour.category as any));
                            return match ? match.name : tour.category;
                          })()}
                        </Badge>
                      </div>

                      {/* Price (from most recent availability) */}
                      {typeof tour.recentAdultPrice === 'number' && (
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1">
                          <span className="text-xs text-gray-600 mr-1">Chỉ từ</span>
                          <span className="font-bold text-lg text-gray-900">
                            {formatPrice(tour.recentAdultPrice!, 'VND')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Tour Info */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3
                          className="font-semibold text-lg text-gray-900 line-clamp-2 mb-1 hover:underline cursor-pointer"
                          onClick={() => navigate(`/tour/${tour.id}`)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/tour/${tour.id}`); }}
                          aria-label={`Xem chi tiết ${tour.title}`}
                        >
                          {tour.title}
                        </h3>
                        <div
                          className="text-sm text-gray-600 max-h-12 overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]"
                          dangerouslySetInnerHTML={{ __html: tour.shortDescription || "" }}
                        />
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">
                            {tour.location}
                            {tour.wardName ? `, ${tour.wardName}` : ''}
                            {tour.provinceName ? `, ${tour.provinceName}` : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {tour.recentTripTime && tour.recentTripTime.trim().length > 0
                              ? tour.recentTripTime
                              : formatDuration(tour.duration)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span>{tour.averageRating.toFixed(1)} ({tour.totalReviews})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{tour.totalBookings}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{tour.viewCount}</span>
                        </div>
                      </div>

                      <div className="pt-2 space-y-1">
                        <p className="text-xs text-gray-500">Hướng dẫn viên: {tour.tourGuideName}</p>
                        {tour.recentDepartureDivisionName && (
                          <p className="text-xs text-gray-500">Điểm đi: {tour.recentDepartureDivisionName}</p>
                        )}
                      </div>

                      <Separator />

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => navigate(`/tour/${tour.id}`)}
                          className="flex-1"
                        >
                          Chi tiết
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/tour/${tour.id}/book`)}
                          className="flex-1"
                        >
                          Đặt tour
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(searchParams.page - 1)}
                  disabled={searchParams.page <= 1}
                >
                  Trước
                </Button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={searchParams.page === page ? "default" : "outline"}
                      onClick={() => handlePageChange(page)}
                      className="w-10"
                    >
                      {page}
                    </Button>
                  );
                })}
                
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(searchParams.page + 1)}
                  disabled={searchParams.page >= totalPages}
                >
                  Sau
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Không tìm thấy tour nào
            </h3>
            <p className="text-gray-600 mb-4">
              Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn
            </p>
            <Button onClick={clearFilters} variant="outline">
              Xóa bộ lọc
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
