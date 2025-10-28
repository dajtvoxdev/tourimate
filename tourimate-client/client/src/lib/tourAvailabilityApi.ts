import { httpJson, getApiBase } from './http';

// Types for TourAvailability API
export interface TourAvailabilityDto {
  id: string;
  tourId: string;
  tourTitle: string;
  date: string;
  maxParticipants: number;
  bookedParticipants: number;
  isAvailable: boolean;
  availableSpots: number;
  hasAvailableSpots: boolean;
  departureDivisionCode: number;
  departureDivisionName: string;
  vehicle?: string;
  adultPrice: number;
  childPrice: number;
  surcharge: number;
  totalAdultPrice: number;
  totalChildPrice: number;
  tripTime?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTourAvailabilityRequest {
  tourId: string;
  date: string;
  maxParticipants: number;
  isAvailable?: boolean;
  departureDivisionCode: number;
  vehicle?: string;
  adultPrice: number;
  childPrice?: number;
  surcharge?: number;
  tripTime?: string;
  note?: string;
}

export interface UpdateTourAvailabilityRequest {
  date?: string;
  maxParticipants?: number;
  isAvailable?: boolean;
  departureDivisionCode?: number;
  vehicle?: string;
  adultPrice?: number;
  childPrice?: number;
  surcharge?: number;
  tripTime?: string;
  note?: string;
}

export interface TourAvailabilitySearchRequest {
  tourId?: string;
  startDate?: string;
  endDate?: string;
  isAvailable?: boolean;
  minPrice?: number;
  maxPrice?: number;
  departureDivisionCode?: number;
  vehicle?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: string;
}

export interface TourAvailabilitySearchResponse {
  data: TourAvailabilityDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface DivisionDto {
  id: string;
  code: number;
  name: string;
  fullName?: string;
  type: string;
  parentCode?: number;
}

export class TourAvailabilityApiService {
  // Get all tour availabilities with search and pagination
  static async getTourAvailabilities(params: TourAvailabilitySearchRequest = {}): Promise<TourAvailabilitySearchResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.tourId) queryParams.append('tourId', params.tourId);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.isAvailable !== undefined) queryParams.append('isAvailable', params.isAvailable.toString());
    if (params.minPrice !== undefined) queryParams.append('minPrice', params.minPrice.toString());
    if (params.maxPrice !== undefined) queryParams.append('maxPrice', params.maxPrice.toString());
    if (params.departureDivisionCode) queryParams.append('departureDivisionCode', params.departureDivisionCode.toString());
    if (params.vehicle) queryParams.append('vehicle', params.vehicle);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortDirection) queryParams.append('sortDirection', params.sortDirection);

    return httpJson<TourAvailabilitySearchResponse>(`${getApiBase()}/api/touravailability?${queryParams.toString()}`);
  }

  // Get tour availability by ID
  static async getTourAvailability(id: string): Promise<TourAvailabilityDto> {
    return httpJson<TourAvailabilityDto>(`${getApiBase()}/api/touravailability/${id}`);
  }

  // Get tour availabilities by tour ID
  static async getTourAvailabilitiesByTour(tourId: string): Promise<TourAvailabilityDto[]> {
    return httpJson<TourAvailabilityDto[]>(`${getApiBase()}/api/touravailability/tour/${tourId}`);
  }

  // Create new tour availability
  static async createTourAvailability(request: CreateTourAvailabilityRequest): Promise<TourAvailabilityDto> {
    return httpJson<TourAvailabilityDto>(`${getApiBase()}/api/touravailability`, {
      method: 'POST',
      body: JSON.stringify(request),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Update tour availability
  static async updateTourAvailability(id: string, request: UpdateTourAvailabilityRequest): Promise<TourAvailabilityDto> {
    return httpJson<TourAvailabilityDto>(`${getApiBase()}/api/touravailability/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Delete tour availability
  static async deleteTourAvailability(id: string): Promise<void> {
    return httpJson<void>(`${getApiBase()}/api/touravailability/${id}`, {
      method: 'DELETE',
    });
  }

  // Get provinces for dropdown (optimized)
  static async getDivisions(): Promise<DivisionDto[]> {
    return httpJson<DivisionDto[]>(`${getApiBase()}/api/divisions/provinces`, {
      skipAuth: true
    });
  }
}
