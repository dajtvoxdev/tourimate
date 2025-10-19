// Tour API service functions
import { TourSearchRequest, TourSearchResponse, TourDto } from '../types/tour';
import { httpJson, getApiBase } from '../src/lib/http';

export interface TourCategoryDto {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  code: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class TourApiService {
  // Get all tours with search and filters
  static async getTours(params: TourSearchRequest): Promise<TourSearchResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    return httpJson<TourSearchResponse>(`${getApiBase()}/api/tour?${queryParams.toString()}`, {
      skipAuth: true // Tours listing doesn't require authentication
    });
  }

  // Get tour by ID
  static async getTourById(id: string): Promise<TourDto> {
    return httpJson<TourDto>(`${getApiBase()}/api/tour/${id}`, {
      skipAuth: true // Tour details don't require authentication
    });
  }

  // Get featured tours
  static async getFeaturedTours(limit: number = 10): Promise<TourDto[]> {
    return httpJson<TourDto[]>(`${getApiBase()}/api/tour/featured?limit=${limit}`, {
      skipAuth: true // Featured tours don't require authentication
    });
  }

  // Get tours by guide
  static async getToursByGuide(guideId: string, isActive?: boolean): Promise<TourDto[]> {
    const queryParams = new URLSearchParams();
    if (isActive !== undefined) {
      queryParams.append('isActive', isActive.toString());
    }

    return httpJson<TourDto[]>(`${getApiBase()}/api/tour/guide/${guideId}?${queryParams.toString()}`, {
      skipAuth: true // Public guide tours don't require authentication
    });
  }

  // Get my tours (requires authentication)
  static async getMyTours(isActive?: boolean): Promise<TourDto[]> {
    const queryParams = new URLSearchParams();
    if (isActive !== undefined) {
      queryParams.append('isActive', isActive.toString());
    }

    return httpJson<TourDto[]>(`${getApiBase()}/api/tour/my-tours?${queryParams.toString()}`, {
      skipAuth: false // My tours requires authentication
    });
  }

  // Get all tour categories
  static async getTourCategories(): Promise<TourCategoryDto[]> {
    return httpJson<TourCategoryDto[]>(`${getApiBase()}/api/tourcategories`, {
      skipAuth: true // Tour categories don't require authentication
    });
  }

  // Get tour category by ID
  static async getTourCategoryById(id: string): Promise<TourCategoryDto> {
    return httpJson<TourCategoryDto>(`${getApiBase()}/api/tourcategories/${id}`, {
      skipAuth: true // Tour category details don't require authentication
    });
  }
}
