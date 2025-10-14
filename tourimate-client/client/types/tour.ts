// Tour-related TypeScript types

export interface TourDto {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  location: string;
  duration: number;
  maxParticipants: number;
  price: number;
  currency: string;
  category: string;
  images?: string;
  imageUrls?: string[];
  itinerary?: string;
  includes?: string;
  excludes?: string;
  terms?: string;
  isActive: boolean;
  isFeatured: boolean;
  status: string;
  divisionCode?: number;
  provinceCode?: number;
  wardCode?: number;
  tourGuideId: string;
  tourGuideName: string;
  tourGuideEmail: string;
  averageRating: number;
  totalReviews: number;
  totalBookings: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TourListDto {
  id: string;
  title: string;
  shortDescription: string;
  location: string;
  duration: number;
  price: number;
  currency: string;
  category: string;
  images?: string;
  imageUrls?: string[];
  isActive: boolean;
  isFeatured: boolean;
  status: string;
  divisionCode?: number;
  provinceCode?: number;
  wardCode?: number;
  tourGuideId: string;
  tourGuideName: string;
  averageRating: number;
  totalReviews: number;
  totalBookings: number;
  viewCount: number;
  createdAt: string;

  // Enriched fields from availability (optional)
  recentAdultPrice?: number;
  recentDepartureDivisionCode?: number;
  recentDepartureDivisionName?: string;
  recentTripTime?: string;
  recentDate?: string;
  provinceName?: string;
  wardName?: string;
}

export interface TourSearchRequest {
  searchTerm: string;
  location: string;
  category: string;
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  status?: string;
  tourGuideId?: string;
  divisionCode?: number;
  provinceCode?: number;
  wardCode?: number;
  // Availability-based filters
  destinationProvinceCode?: number;
  departureDivisionCode?: number;
  startDate?: string;
  minAvailPrice?: number;
  maxAvailPrice?: number;
  sortBy: string;
  sortDirection: string;
  page: number;
  pageSize: number;
}

export interface TourSearchResponse {
  tours: TourListDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateTourRequest {
  title: string;
  description: string;
  shortDescription: string;
  location: string;
  duration: number;
  maxParticipants: number;
  price: number;
  currency: string;
  category: string;
  difficulty: string;
  images?: string;
  imageUrls?: string[];
  itinerary?: string;
  includes?: string;
  excludes?: string;
  terms?: string;
  isFeatured: boolean;
  divisionCode?: number;
  provinceCode?: number;
  wardCode?: number;
}

export interface UpdateTourRequest {
  title?: string;
  description?: string;
  shortDescription?: string;
  location?: string;
  duration?: number;
  maxParticipants?: number;
  price?: number;
  currency?: string;
  category?: string;
  images?: string;
  imageUrls?: string[];
  itinerary?: string;
  includes?: string;
  excludes?: string;
  terms?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  status?: string;
  divisionCode?: number;
  provinceCode?: number;
  wardCode?: number;
}

export interface TourStatsDto {
  totalTours: number;
  activeTours: number;
  pendingTours: number;
  rejectedTours: number;
  featuredTours: number;
  averagePrice: number;
  totalRevenue: number;
  totalBookings: number;
  averageRating: number;
}

// Tour status enum
export enum TourStatus {
  PendingApproval = 'PendingApproval',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Suspended = 'Suspended'
}

// Tour categories
export const TOUR_CATEGORIES = [
  'Adventure',
  'Cultural',
  'Nature',
  'Historical',
  'Food',
  'Beach',
  'Mountain',
  'City',
  'Religious',
  'Wildlife',
  'Photography',
  'Wellness',
  'Education',
  'Family',
  'Luxury',
  'Budget'
] as const;

export type TourCategory = typeof TOUR_CATEGORIES[number];

// Sort options
export const SORT_OPTIONS = [
  { value: 'createdat', label: 'Mới nhất' },
  { value: 'price', label: 'Giá' },
  { value: 'rating', label: 'Đánh giá' },
  { value: 'bookings', label: 'Phổ biến' },
  { value: 'title', label: 'Tên tour' },
  { value: 'duration', label: 'Thời gian' }
] as const;

export type SortOption = typeof SORT_OPTIONS[number]['value'];
