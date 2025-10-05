import { TourDto, TourListDto, TourSearchRequest, TourSearchResponse, CreateTourRequest, UpdateTourRequest, TourStatsDto } from './types/tour';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "https://localhost:7181";

class TourApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem("accessToken");
    
    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // Get all tours with search and pagination
  async getTours(params: TourSearchRequest = {}): Promise<TourSearchResponse> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    return this.request<TourSearchResponse>(`/api/tour?${searchParams.toString()}`);
  }

  // Get a specific tour by ID
  async getTour(id: string): Promise<TourDto> {
    return this.request<TourDto>(`/api/tour/${id}`);
  }

  // Create a new tour
  async createTour(tour: CreateTourRequest): Promise<TourDto> {
    return this.request<TourDto>('/api/tour', {
      method: 'POST',
      body: JSON.stringify(tour),
    });
  }

  // Update a tour
  async updateTour(id: string, tour: UpdateTourRequest): Promise<TourDto> {
    return this.request<TourDto>(`/api/tour/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tour),
    });
  }

  // Delete a tour
  async deleteTour(id: string): Promise<void> {
    return this.request<void>(`/api/tour/${id}`, {
      method: 'DELETE',
    });
  }

  // Get tours by guide
  async getToursByGuide(guideId: string, isActive?: boolean): Promise<TourListDto[]> {
    const params = new URLSearchParams();
    if (isActive !== undefined) {
      params.append('isActive', isActive.toString());
    }
    
    return this.request<TourListDto[]>(`/api/tour/guide/${guideId}?${params.toString()}`);
  }

  // Get my tours (for authenticated user)
  async getMyTours(isActive?: boolean): Promise<TourListDto[]> {
    const params = new URLSearchParams();
    if (isActive !== undefined) {
      params.append('isActive', isActive.toString());
    }
    
    return this.request<TourListDto[]>(`/api/tour/my-tours?${params.toString()}`);
  }

  // Get tour statistics (Admin only)
  async getTourStats(): Promise<TourStatsDto> {
    return this.request<TourStatsDto>('/api/tour/stats');
  }

  // Update tour status (Admin only)
  async updateTourStatus(id: string, status: string): Promise<TourDto> {
    return this.request<TourDto>(`/api/tour/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(status),
    });
  }

  // Get featured tours
  async getFeaturedTours(limit: number = 10): Promise<TourListDto[]> {
    return this.request<TourListDto[]>(`/api/tour/featured?limit=${limit}`);
  }
}

export const tourApi = new TourApiService();
