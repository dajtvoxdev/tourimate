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
  difficulty: string;
  images?: string;
  itinerary?: string;
  includes?: string;
  excludes?: string;
  terms?: string;
  isActive: boolean;
  isFeatured: boolean;
  status: string;
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
  difficulty: string;
  images?: string;
  isActive: boolean;
  isFeatured: boolean;
  status: string;
  tourGuideId: string;
  tourGuideName: string;
  averageRating: number;
  totalReviews: number;
  totalBookings: number;
  viewCount: number;
  createdAt: string;
}

export interface TourSearchRequest {
  searchTerm?: string;
  location?: string;
  category?: string;
  difficulty?: string;
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  status?: string;
  tourGuideId?: string;
  sortBy?: string;
  sortDirection?: string;
  page?: number;
  pageSize?: number;
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
  itinerary?: string;
  includes?: string;
  excludes?: string;
  terms?: string;
  isFeatured: boolean;
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
  difficulty?: string;
  images?: string;
  itinerary?: string;
  includes?: string;
  excludes?: string;
  terms?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  status?: string;
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
