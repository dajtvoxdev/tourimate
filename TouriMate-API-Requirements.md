# TouriMate Backend API - Requirements & Specifications

## Project Overview

TouriMate is a comprehensive tourism platform that connects tourists with tour guides, offers tours and local products (OCOP), and provides a complete booking and payment system. The platform serves four main user types: Customers, Tour Guides, Products Vendors, and Administrators.

## System Architecture

### Technology Stack
- **Backend**: ASP.NET Core 8.0 Web API
- **Database**: SQL Server (Entity Framework Core)
- **Authentication**: JWT with OTP verification
- **Payment**: Online payment integration
- **File Storage**: Cloud storage for images/documents
- **SMS Service**: OTP verification via SMS

### User Roles
1. **Customer** - Books tours, purchases products, leaves reviews
2. **Tour Guide** - Creates and manages tours, sells OCOP products
3. **Admin** - Manages the entire platform, users, content, and revenue
4. **Guest** - Browse content without authentication

## Core Modules

### 1. User Authentication & Management Module

#### 1.1 User Registration
- **Endpoint**: `POST /api/auth/register`
- **Features**:
  - Email/phone registration
  - OTP verification via SMS
  - Password requirements
  - Profile setup (name, avatar, contact info)
  - Role assignment (Customer/Tour Guide)

#### 1.2 User Login
- **Endpoint**: `POST /api/auth/login`
- **Features**:
  - Email/phone + password authentication
  - JWT token generation
  - Refresh token mechanism
  - Account lockout after failed attempts

#### 1.3 Password Reset
- **Endpoint**: `POST /api/auth/forgot-password`
- **Features**:
  - OTP-based password reset via SMS
  - Secure token generation
  - Password update endpoint

#### 1.4 Profile Management
- **Endpoints**: 
  - `GET /api/users/profile`
  - `PUT /api/users/profile`
- **Features**:
  - View/update personal information
  - Avatar upload
  - Contact preferences
  - Notification settings

#### 1.5 OTP Service
- **Endpoints**:
  - `POST /api/auth/send-otp`
  - `POST /api/auth/verify-otp`
- **Features**:
  - SMS OTP generation
  - OTP validation
  - Rate limiting
  - Expiration handling

### 2. Tour Management Module

#### 2.1 Featured Tours
- **Endpoint**: `GET /api/tours/featured`
- **Features**:
  - Curated list of popular tours
  - Admin-promoted tours
  - Seasonal highlights
  - Rating-based selection

#### 2.2 Tour Listing & Search
- **Endpoint**: `GET /api/tours`
- **Query Parameters**:
  - `location` - Filter by destination
  - `price_min`, `price_max` - Price range
  - `duration` - Tour duration
  - `date_from`, `date_to` - Availability dates
  - `category` - Tour category/type
  - `rating_min` - Minimum rating
  - `sort_by` - Sort options (price, rating, date, popularity)
  - `page`, `limit` - Pagination

#### 2.3 Tour Details
- **Endpoint**: `GET /api/tours/{id}`
- **Features**:
  - Complete tour information
  - Itinerary details
  - Pricing and availability
  - Tour guide information
  - Reviews and ratings
  - Photo gallery
  - Terms and conditions

#### 2.4 Tour Booking
- **Endpoint**: `POST /api/bookings/tours`
- **Features**:
  - Date and participant selection
  - Price calculation
  - Customer information
  - Special requirements
  - Payment processing
  - Booking confirmation
  - Email/SMS notifications

#### 2.5 Tour Reviews & Rating
- **Endpoints**:
  - `POST /api/tours/{id}/reviews`
  - `GET /api/tours/{id}/reviews`
- **Features**:
  - 5-star rating system
  - Written reviews
  - Photo uploads
  - Review moderation
  - Reply to reviews (tour guide)

#### 2.6 Booking History
- **Endpoint**: `GET /api/users/bookings/tours`
- **Features**:
  - Past and upcoming bookings
  - Booking status tracking
  - Cancellation options
  - Refund requests
  - Download receipts/tickets

### 3. Product Management Module (OCOP Products)

#### 3.1 Featured Products
- **Endpoint**: `GET /api/products/featured`
- **Features**:
  - Highlighted local products
  - Seasonal products
  - Best sellers
  - New arrivals

#### 3.2 Product Listing & Search
- **Endpoint**: `GET /api/products`
- **Query Parameters**:
  - `category` - Product category
  - `region` - Geographic region
  - `price_min`, `price_max` - Price range
  - `brand` - Product brand/maker
  - `rating_min` - Minimum rating
  - `in_stock` - Availability filter
  - `sort_by` - Sort options
  - `page`, `limit` - Pagination

#### 3.3 Product Details
- **Endpoint**: `GET /api/products/{id}`
- **Features**:
  - Complete product information
  - Multiple product images
  - Specifications and ingredients
  - Vendor information
  - Customer reviews
  - Related products
  - Stock availability

#### 3.4 Product Ordering
- **Endpoint**: `POST /api/orders`
- **Features**:
  - Shopping cart functionality
  - Quantity selection
  - Shipping address
  - Payment processing
  - Order confirmation
  - Inventory management

#### 3.5 Product Reviews & Rating
- **Endpoints**:
  - `POST /api/products/{id}/reviews`
  - `GET /api/products/{id}/reviews`
- **Features**:
  - Product rating system
  - Detailed reviews
  - Photo/video uploads
  - Verified purchase badges
  - Helpful votes

#### 3.6 Order History
- **Endpoint**: `GET /api/users/orders`
- **Features**:
  - Order tracking
  - Delivery status
  - Return/refund requests
  - Reorder functionality
  - Download invoices

### 4. Tour Guide Management Module

#### 4.1 Tour Guide Registration
- **Endpoint**: `POST /api/tour-guides/apply`
- **Features**:
  - Application form submission
  - Document upload (ID, certificates)
  - Background verification
  - Admin approval workflow
  - Status tracking

#### 4.2 Tour Creation & Management
- **Endpoints**:
  - `POST /api/tour-guides/tours`
  - `GET /api/tour-guides/tours`
  - `PUT /api/tour-guides/tours/{id}`
  - `DELETE /api/tour-guides/tours/{id}`
- **Features**:
  - Tour information input
  - Itinerary builder
  - Pricing setup
  - Photo/video uploads
  - Availability calendar
  - Tour status management

#### 4.3 Tour Promotion Requests
- **Endpoint**: `POST /api/tour-guides/promote-tour`
- **Features**:
  - Featured tour requests
  - Payment for promotion
  - Campaign duration
  - Promotion analytics
  - Approval process

#### 4.4 Negative Review Reports
- **Endpoint**: `POST /api/tour-guides/report-review`
- **Features**:
  - Report inappropriate reviews
  - Evidence submission
  - Admin investigation
  - Resolution tracking

#### 4.5 OCOP Product Management
- **Endpoints**:
  - `POST /api/tour-guides/products`
  - `GET /api/tour-guides/products`
  - `PUT /api/tour-guides/products/{id}`
- **Features**:
  - Product listing creation
  - Inventory management
  - Pricing updates
  - Product promotion
  - Sales analytics

#### 4.6 Revenue Management
- **Endpoint**: `GET /api/tour-guides/revenue`
- **Features**:
  - Earnings dashboard
  - Commission breakdown
  - Payment history
  - Tax reporting
  - Payout requests

### 5. Admin Management Module

#### 5.1 Product Management
- **Endpoints**:
  - `GET /api/admin/products`
  - `POST /api/admin/products`
  - `PUT /api/admin/products/{id}`
  - `DELETE /api/admin/products/{id}`
- **Features**:
  - Create admin products
  - Manage tour guide products
  - Approve/reject listings
  - Content moderation
  - Inventory oversight

#### 5.2 Tour Management
- **Endpoints**:
  - `GET /api/admin/tours`
  - `POST /api/admin/tours`
  - `PUT /api/admin/tours/{id}`
  - `DELETE /api/admin/tours/{id}`
- **Features**:
  - Create admin tours
  - Manage tour guide tours
  - Approval workflows
  - Quality control
  - Featured tour selection

#### 5.3 Content Moderation
- **Endpoints**:
  - `GET /api/admin/reviews`
  - `PUT /api/admin/reviews/{id}/status`
  - `GET /api/admin/reports`
- **Features**:
  - Review moderation
  - Comment management
  - Report handling
  - Content policy enforcement
  - User warnings/suspensions

#### 5.4 Revenue Management
- **Endpoint**: `GET /api/admin/revenue`
- **Features**:
  - Platform revenue analytics
  - Commission tracking
  - Financial reporting
  - Payment reconciliation
  - Tax management

#### 5.5 User Account Management
- **Endpoints**:
  - `GET /api/admin/users`
  - `PUT /api/admin/users/{id}/status`
  - `GET /api/admin/tour-guide-applications`
  - `PUT /api/admin/tour-guide-applications/{id}`
- **Features**:
  - User account oversight
  - Account suspension/activation
  - Tour guide application review
  - Role management
  - User analytics

## Data Models

### User Entity
```
- Id (Guid)
- Email (string, unique)
- PhoneNumber (string, unique)
- PasswordHash (string)
- FirstName (string)
- LastName (string)
- Avatar (string, URL)
- Role (enum: Customer, TourGuide, Admin)
- IsEmailVerified (bool)
- IsPhoneVerified (bool)
- IsActive (bool)
- CreatedAt (DateTime)
- UpdatedAt (DateTime)
```

### Tour Entity
```
- Id (Guid)
- Title (string)
- Description (text)
- ShortDescription (string)
- Location (string)
- Duration (int, days)
- MaxParticipants (int)
- Price (decimal)
- Currency (string)
- Category (string)
- Difficulty (enum)
- Images (List<string>)
- Itinerary (text)
- Includes (text)
- Excludes (text)
- Terms (text)
- IsActive (bool)
- IsFeatured (bool)
- TourGuideId (Guid)
- AverageRating (decimal)
- TotalReviews (int)
- CreatedAt (DateTime)
- UpdatedAt (DateTime)
```

### Product Entity
```
- Id (Guid)
- Name (string)
- Description (text)
- ShortDescription (string)
- Category (string)
- Brand (string)
- Region (string)
- Price (decimal)
- Currency (string)
- Stock (int)
- Images (List<string>)
- Specifications (text)
- IsActive (bool)
- IsFeatured (bool)
- VendorId (Guid)
- AverageRating (decimal)
- TotalReviews (int)
- CreatedAt (DateTime)
- UpdatedAt (DateTime)
```

### Booking Entity
```
- Id (Guid)
- TourId (Guid)
- CustomerId (Guid)
- BookingDate (DateTime)
- TourDate (DateTime)
- Participants (int)
- TotalAmount (decimal)
- Status (enum: Pending, Confirmed, Cancelled, Completed)
- PaymentStatus (enum: Pending, Paid, Refunded)
- PaymentId (string)
- SpecialRequests (text)
- CreatedAt (DateTime)
- UpdatedAt (DateTime)
```

### Order Entity
```
- Id (Guid)
- CustomerId (Guid)
- OrderNumber (string, unique)
- TotalAmount (decimal)
- Status (enum: Pending, Processing, Shipped, Delivered, Cancelled)
- PaymentStatus (enum: Pending, Paid, Refunded)
- PaymentId (string)
- ShippingAddress (text)
- TrackingNumber (string)
- CreatedAt (DateTime)
- UpdatedAt (DateTime)
```

### Review Entity
```
- Id (Guid)
- UserId (Guid)
- EntityId (Guid) // Tour or Product ID
- EntityType (enum: Tour, Product)
- Rating (int, 1-5)
- Title (string)
- Content (text)
- Images (List<string>)
- IsVerified (bool)
- Status (enum: Pending, Approved, Rejected)
- CreatedAt (DateTime)
- UpdatedAt (DateTime)
```

## Security & Authentication

### JWT Token Strategy
- Access tokens (15 minutes expiry)
- Refresh tokens (7 days expiry)
- Token blacklisting for logout
- Role-based authorization

### OTP Security
- 6-digit numeric codes
- 5-minute expiration
- Rate limiting (max 3 requests per hour per phone)
- Secure random generation

### Data Protection
- HTTPS enforcement
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configuration

## Payment Integration

### Supported Payment Methods
- Credit/Debit cards
- Digital wallets
- Bank transfers
- Popular Vietnamese payment gateways (VNPay, Momo, ZaloPay)

### Payment Security
- PCI DSS compliance
- Secure payment tokenization
- Fraud detection
- Refund management

## API Response Standards

### Success Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Pagination Format
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Performance & Scalability

### Caching Strategy
- Redis for session storage
- Response caching for static content
- Database query optimization
- CDN for image delivery

### Database Optimization
- Proper indexing strategy
- Query optimization
- Connection pooling
- Read replicas for scaling

### Monitoring & Logging
- Application Performance Monitoring (APM)
- Structured logging
- Error tracking
- Health check endpoints

## Development Standards

### Code Quality
- Clean Architecture principles
- SOLID principles
- Unit testing (minimum 80% coverage)
- Integration testing
- Code review requirements

### Documentation
- OpenAPI/Swagger documentation
- Code comments
- README files
- Deployment guides

### Version Control
- Git flow branching strategy
- Semantic versioning
- Automated CI/CD pipeline
- Environment-specific configurations

## Deployment Architecture

### Infrastructure
- Cloud hosting (Azure/AWS)
- Container deployment (Docker)
- Load balancing
- Auto-scaling groups
- Database clustering

### Environments
- Development
- Staging
- Production
- Monitoring and alerting

This specification provides a comprehensive foundation for developing the TouriMate backend API system. Each module should be developed incrementally with proper testing and documentation.
