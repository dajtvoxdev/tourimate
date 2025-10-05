# TouriMate API Endpoints Documentation

## Base URL
```
Production: https://api.tourimate.com/api/v1
Development: https://localhost:7000/api/v1
```

## Authentication
Most endpoints require JWT token in the Authorization header:
```
Authorization: Bearer {jwt_token}
```

## Response Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `500` - Internal Server Error

---

## 1. Authentication & User Management

### 1.1 User Registration
**POST** `/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "phoneNumber": "+84901234567",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "Customer", // Customer, TourGuide
  "acceptEmailMarketing": false
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "message": "Registration successful. Please verify your phone number.",
    "otpSent": true
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 1.2 Send OTP
**POST** `/auth/send-otp`

**Request Body:**
```json
{
  "phoneNumber": "+84901234567",
  "purpose": "registration" // registration, password_reset, phone_verification
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "OTP sent successfully",
    "expiresIn": 300,
    "canResendAfter": 60
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 1.3 Verify OTP
**POST** `/auth/verify-otp`

**Request Body:**
```json
{
  "phoneNumber": "+84901234567",
  "otp": "123456",
  "purpose": "registration"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "verified": true,
    "message": "Phone number verified successfully"
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 1.4 User Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "emailOrPhone": "user@example.com",
  "password": "Password123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "Customer",
      "avatar": "https://cdn.tourimate.com/avatars/user.jpg"
    }
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 1.5 Refresh Token
**POST** `/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 1.6 Forgot Password
**POST** `/auth/forgot-password`

**Request Body:**
```json
{
  "phoneNumber": "+84901234567"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "OTP sent to your phone number for password reset",
    "resetToken": "temp_token_123"
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 1.7 Reset Password
**POST** `/auth/reset-password`

**Request Body:**
```json
{
  "resetToken": "temp_token_123",
  "otp": "123456",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Password reset successfully"
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 1.8 Get User Profile
**GET** `/users/profile`
*Requires Authentication*

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "phoneNumber": "+84901234567",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "https://cdn.tourimate.com/avatars/user.jpg",
    "role": "Customer",
    "isPhoneVerified": true,
    "acceptEmailMarketing": false,
    "createdAt": "2024-01-01T10:00:00Z",
    "notificationSettings": {
      "emailNotifications": true,
      "smsNotifications": false,
      "pushNotifications": true,
      "marketingEmails": false
    }
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 1.9 Update User Profile
**PUT** `/users/profile`
*Requires Authentication*

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+84901234567",
  "acceptEmailMarketing": true,
  "notificationSettings": {
    "emailNotifications": true,
    "smsNotifications": false,
    "pushNotifications": true,
    "marketingEmails": true
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Profile updated successfully"
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 1.10 Upload Avatar
**POST** `/users/avatar`
*Requires Authentication*
*Content-Type: multipart/form-data*

**Request Body:**
```
avatar: [image file]
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "avatarUrl": "https://cdn.tourimate.com/avatars/user_123.jpg",
    "message": "Avatar uploaded successfully"
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

---

## 2. Tour Management

### 2.1 Get Featured Tours
**GET** `/tours/featured`

**Query Parameters:**
- `limit` (optional): Number of tours to return (default: 10)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "tour-123",
      "title": "Amazing Ha Long Bay Adventure",
      "shortDescription": "Explore the stunning limestone karsts...",
      "location": "Ha Long Bay, Vietnam",
      "duration": 3,
      "price": 1500000,
      "currency": "VND",
      "category": "Adventure",
      "averageRating": 4.8,
      "totalReviews": 156,
      "images": [
        "https://cdn.tourimate.com/tours/tour-123/image1.jpg"
      ],
      "tourGuide": {
        "id": "guide-123",
        "firstName": "Nguyen",
        "lastName": "Van A",
        "avatar": "https://cdn.tourimate.com/guides/guide-123.jpg",
        "averageRating": 4.9
      },
      "isFeatured": true,
      "nextAvailableDate": "2024-02-01T00:00:00Z"
    }
  ],
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 2.2 Search Tours
**GET** `/tours`

**Query Parameters:**
- `location` (optional): Filter by destination
- `price_min` (optional): Minimum price
- `price_max` (optional): Maximum price
- `duration` (optional): Tour duration in days
- `date_from` (optional): Available from date (YYYY-MM-DD)
- `date_to` (optional): Available to date (YYYY-MM-DD)
- `category` (optional): Tour category
- `rating_min` (optional): Minimum rating (1-5)
- `sort_by` (optional): price_asc, price_desc, rating_desc, date_desc, popularity
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "tour-123",
      "title": "Amazing Ha Long Bay Adventure",
      "shortDescription": "Explore the stunning limestone karsts...",
      "location": "Ha Long Bay, Vietnam",
      "duration": 3,
      "price": 1500000,
      "currency": "VND",
      "category": "Adventure",
      "averageRating": 4.8,
      "totalReviews": 156,
      "images": [
        "https://cdn.tourimate.com/tours/tour-123/image1.jpg"
      ],
      "tourGuide": {
        "id": "guide-123",
        "firstName": "Nguyen",
        "lastName": "Van A",
        "avatar": "https://cdn.tourimate.com/guides/guide-123.jpg"
      },
      "nextAvailableDate": "2024-02-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 2.3 Get Tour Details
**GET** `/tours/{id}`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "tour-123",
    "title": "Amazing Ha Long Bay Adventure",
    "description": "Detailed tour description...",
    "shortDescription": "Explore the stunning limestone karsts...",
    "location": "Ha Long Bay, Vietnam",
    "duration": 3,
    "maxParticipants": 20,
    "price": 1500000,
    "currency": "VND",
    "category": "Adventure",
    "difficulty": "Moderate",
    "images": [
      "https://cdn.tourimate.com/tours/tour-123/image1.jpg",
      "https://cdn.tourimate.com/tours/tour-123/image2.jpg"
    ],
    "itinerary": [
      {
        "day": 1,
        "title": "Departure and Cruise",
        "description": "Depart from Hanoi...",
        "activities": ["Boarding", "Lunch", "Cave exploration"]
      }
    ],
    "includes": ["Accommodation", "Meals", "Transportation"],
    "excludes": ["Personal expenses", "Tips"],
    "terms": "Cancellation policy...",
    "averageRating": 4.8,
    "totalReviews": 156,
    "tourGuide": {
      "id": "guide-123",
      "firstName": "Nguyen",
      "lastName": "Van A",
      "avatar": "https://cdn.tourimate.com/guides/guide-123.jpg",
      "bio": "Experienced tour guide...",
      "languages": ["Vietnamese", "English"],
      "averageRating": 4.9,
      "totalTours": 45,
      "yearsExperience": 8
    },
    "availability": [
      {
        "date": "2024-02-01",
        "available": true,
        "spotsLeft": 5
      }
    ],
    "reviews": {
      "summary": {
        "5": 120,
        "4": 30,
        "3": 5,
        "2": 1,
        "1": 0
      },
      "recent": [
        {
          "id": "review-123",
          "user": {
            "firstName": "John",
            "lastName": "D.",
            "avatar": "https://cdn.tourimate.com/avatars/user.jpg"
          },
          "rating": 5,
          "title": "Amazing experience!",
          "content": "This tour was absolutely fantastic...",
          "images": ["https://cdn.tourimate.com/reviews/review-123.jpg"],
          "createdAt": "2024-01-15T10:00:00Z",
          "verified": true
        }
      ]
    }
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 2.4 Book Tour
**POST** `/bookings/tours`
*Requires Authentication*

**Request Body:**
```json
{
  "tourId": "tour-123",
  "tourDate": "2024-02-01",
  "participants": 2,
  "participantDetails": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "age": 30,
      "specialRequests": "Vegetarian meals"
    }
  ],
  "contactInfo": {
    "email": "john@example.com",
    "phone": "+84901234567"
  },
  "paymentMethod": "credit_card"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "bookingId": "booking-123",
    "bookingNumber": "TB2024001",
    "totalAmount": 3000000,
    "currency": "VND",
    "status": "pending_payment",
    "paymentUrl": "https://payment.tourimate.com/pay/booking-123",
    "expiresAt": "2024-01-01T11:00:00Z"
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 2.5 Get User Tour Bookings
**GET** `/users/bookings/tours`
*Requires Authentication*

**Query Parameters:**
- `status` (optional): pending, confirmed, cancelled, completed
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "booking-123",
      "bookingNumber": "TB2024001",
      "tour": {
        "id": "tour-123",
        "title": "Amazing Ha Long Bay Adventure",
        "image": "https://cdn.tourimate.com/tours/tour-123/image1.jpg"
      },
      "tourDate": "2024-02-01T00:00:00Z",
      "participants": 2,
      "totalAmount": 3000000,
      "currency": "VND",
      "status": "confirmed",
      "paymentStatus": "paid",
      "bookingDate": "2024-01-01T10:00:00Z",
      "canCancel": true,
      "canReview": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 2.6 Cancel Tour Booking
**PUT** `/bookings/tours/{id}/cancel`
*Requires Authentication*

**Request Body:**
```json
{
  "reason": "Personal reasons",
  "requestRefund": true
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "cancelled",
    "refundAmount": 2400000,
    "refundStatus": "processing",
    "message": "Booking cancelled successfully. Refund will be processed within 5-7 business days."
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 2.7 Add Tour Review
**POST** `/tours/{id}/reviews`
*Requires Authentication*

**Request Body:**
```json
{
  "rating": 5,
  "title": "Amazing experience!",
  "content": "This tour was absolutely fantastic. The guide was knowledgeable...",
  "images": ["base64_image_data_1", "base64_image_data_2"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "reviewId": "review-123",
    "message": "Review submitted successfully"
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 2.8 Get Tour Reviews
**GET** `/tours/{id}/reviews`

**Query Parameters:**
- `rating` (optional): Filter by rating (1-5)
- `sort_by` (optional): newest, oldest, rating_high, rating_low, helpful
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "review-123",
      "user": {
        "firstName": "John",
        "lastName": "D.",
        "avatar": "https://cdn.tourimate.com/avatars/user.jpg"
      },
      "rating": 5,
      "title": "Amazing experience!",
      "content": "This tour was absolutely fantastic...",
      "images": ["https://cdn.tourimate.com/reviews/review-123.jpg"],
      "helpfulVotes": 15,
      "verified": true,
      "createdAt": "2024-01-15T10:00:00Z",
      "reply": {
        "content": "Thank you for your wonderful review!",
        "author": "Tour Guide",
        "createdAt": "2024-01-16T09:00:00Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

---

## 3. Product Management

### 3.1 Get Featured Products
**GET** `/products/featured`

**Query Parameters:**
- `limit` (optional): Number of products to return (default: 10)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "product-123",
      "name": "Organic Vietnamese Coffee",
      "shortDescription": "Premium arabica coffee from Da Lat highlands...",
      "category": "Food & Beverages",
      "brand": "Highland Coffee Co.",
      "region": "Da Lat, Vietnam",
      "price": 250000,
      "currency": "VND",
      "originalPrice": 300000,
      "discount": 17,
      "averageRating": 4.7,
      "totalReviews": 89,
      "images": [
        "https://cdn.tourimate.com/products/product-123/image1.jpg"
      ],
      "vendor": {
        "id": "vendor-123",
        "name": "Highland Coffee Co.",
        "avatar": "https://cdn.tourimate.com/vendors/vendor-123.jpg"
      },
      "stock": 150,
      "isInStock": true,
      "isFeatured": true
    }
  ],
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 3.2 Search Products
**GET** `/products`

**Query Parameters:**
- `category` (optional): Product category
- `region` (optional): Geographic region
- `price_min` (optional): Minimum price
- `price_max` (optional): Maximum price
- `brand` (optional): Product brand/maker
- `rating_min` (optional): Minimum rating (1-5)
- `in_stock` (optional): true/false
- `search` (optional): Search term
- `sort_by` (optional): price_asc, price_desc, rating_desc, newest, popularity
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "product-123",
      "name": "Organic Vietnamese Coffee",
      "shortDescription": "Premium arabica coffee...",
      "category": "Food & Beverages",
      "brand": "Highland Coffee Co.",
      "region": "Da Lat, Vietnam",
      "price": 250000,
      "currency": "VND",
      "originalPrice": 300000,
      "discount": 17,
      "averageRating": 4.7,
      "totalReviews": 89,
      "images": [
        "https://cdn.tourimate.com/products/product-123/image1.jpg"
      ],
      "vendor": {
        "id": "vendor-123",
        "name": "Highland Coffee Co."
      },
      "stock": 150,
      "isInStock": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 250,
    "totalPages": 13,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 3.3 Get Product Details
**GET** `/products/{id}`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "product-123",
    "name": "Organic Vietnamese Coffee",
    "description": "Detailed product description...",
    "shortDescription": "Premium arabica coffee...",
    "category": "Food & Beverages",
    "brand": "Highland Coffee Co.",
    "region": "Da Lat, Vietnam",
    "price": 250000,
    "currency": "VND",
    "originalPrice": 300000,
    "discount": 17,
    "images": [
      "https://cdn.tourimate.com/products/product-123/image1.jpg",
      "https://cdn.tourimate.com/products/product-123/image2.jpg"
    ],
    "specifications": {
      "weight": "500g",
      "origin": "Da Lat, Vietnam",
      "roastLevel": "Medium",
      "packaging": "Vacuum sealed bag"
    },
    "ingredients": ["100% Arabica Coffee Beans"],
    "nutritionFacts": {
      "servingSize": "1 cup (240ml)",
      "calories": 2,
      "caffeine": "95mg"
    },
    "averageRating": 4.7,
    "totalReviews": 89,
    "vendor": {
      "id": "vendor-123",
      "name": "Highland Coffee Co.",
      "avatar": "https://cdn.tourimate.com/vendors/vendor-123.jpg",
      "description": "Family-owned coffee business...",
      "location": "Da Lat, Vietnam",
      "establishedYear": 1995,
      "totalProducts": 25,
      "averageRating": 4.8
    },
    "stock": 150,
    "isInStock": true,
    "shipping": {
      "domesticFee": 30000,
      "internationalFee": 150000,
      "estimatedDays": "3-5 business days"
    },
    "reviews": {
      "summary": {
        "5": 65,
        "4": 20,
        "3": 3,
        "2": 1,
        "1": 0
      },
      "recent": [
        {
          "id": "review-456",
          "user": {
            "firstName": "Maria",
            "lastName": "N.",
            "avatar": "https://cdn.tourimate.com/avatars/user2.jpg"
          },
          "rating": 5,
          "title": "Excellent coffee!",
          "content": "The best Vietnamese coffee I've ever tasted...",
          "images": ["https://cdn.tourimate.com/reviews/review-456.jpg"],
          "verified": true,
          "createdAt": "2024-01-10T14:30:00Z"
        }
      ]
    },
    "relatedProducts": [
      {
        "id": "product-124",
        "name": "Traditional Phin Filter",
        "price": 85000,
        "image": "https://cdn.tourimate.com/products/product-124/image1.jpg"
      }
    ]
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 3.4 Add to Cart
**POST** `/cart/items`
*Requires Authentication*

**Request Body:**
```json
{
  "productId": "product-123",
  "quantity": 2
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "cartItemId": "cart-item-123",
    "message": "Product added to cart successfully",
    "cartSummary": {
      "totalItems": 3,
      "totalAmount": 750000,
      "currency": "VND"
    }
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 3.5 Get Cart
**GET** `/cart`
*Requires Authentication*

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "cart-item-123",
        "product": {
          "id": "product-123",
          "name": "Organic Vietnamese Coffee",
          "price": 250000,
          "image": "https://cdn.tourimate.com/products/product-123/image1.jpg",
          "stock": 150
        },
        "quantity": 2,
        "subtotal": 500000
      }
    ],
    "summary": {
      "subtotal": 500000,
      "shippingFee": 30000,
      "tax": 53000,
      "total": 583000,
      "currency": "VND",
      "totalItems": 2
    }
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 3.6 Update Cart Item
**PUT** `/cart/items/{id}`
*Requires Authentication*

**Request Body:**
```json
{
  "quantity": 3
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Cart updated successfully",
    "cartSummary": {
      "totalItems": 3,
      "totalAmount": 750000,
      "currency": "VND"
    }
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 3.7 Remove from Cart
**DELETE** `/cart/items/{id}`
*Requires Authentication*

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Item removed from cart successfully"
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 3.8 Create Order
**POST** `/orders`
*Requires Authentication*

**Request Body:**
```json
{
  "shippingAddress": {
    "fullName": "John Doe",
    "phoneNumber": "+84901234567",
    "street": "123 Main Street",
    "ward": "Ward 1",
    "district": "District 1",
    "city": "Ho Chi Minh City",
    "country": "Vietnam",
    "postalCode": "700000"
  },
  "paymentMethod": "credit_card",
  "note": "Please deliver in the morning"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "orderId": "order-123",
    "orderNumber": "OM2024001",
    "totalAmount": 583000,
    "currency": "VND",
    "status": "pending_payment",
    "paymentUrl": "https://payment.tourimate.com/pay/order-123",
    "estimatedDelivery": "2024-01-08T00:00:00Z"
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 3.9 Get User Orders
**GET** `/users/orders`
*Requires Authentication*

**Query Parameters:**
- `status` (optional): pending, processing, shipped, delivered, cancelled
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "order-123",
      "orderNumber": "OM2024001",
      "status": "delivered",
      "totalAmount": 583000,
      "currency": "VND",
      "orderDate": "2024-01-01T10:00:00Z",
      "deliveredDate": "2024-01-05T14:30:00Z",
      "items": [
        {
          "product": {
            "id": "product-123",
            "name": "Organic Vietnamese Coffee",
            "image": "https://cdn.tourimate.com/products/product-123/image1.jpg"
          },
          "quantity": 2,
          "price": 250000,
          "subtotal": 500000
        }
      ],
      "trackingNumber": "TN123456789",
      "canReview": true,
      "canReturn": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 3.10 Add Product Review
**POST** `/products/{id}/reviews`
*Requires Authentication*

**Request Body:**
```json
{
  "orderId": "order-123",
  "rating": 5,
  "title": "Excellent quality!",
  "content": "This coffee exceeded my expectations...",
  "images": ["base64_image_data_1"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "reviewId": "review-456",
    "message": "Review submitted successfully"
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

---

## 4. Tour Guide Management

### 4.1 Apply to Become Tour Guide
**POST** `/tour-guides/apply`
*Requires Authentication*

**Request Body:**
```json
{
  "personalInfo": {
    "dateOfBirth": "1985-05-15",
    "nationalId": "123456789",
    "address": "123 Main St, Ho Chi Minh City",
    "bio": "Experienced tour guide with 5 years..."
  },
  "qualifications": {
    "languages": ["Vietnamese", "English", "Chinese"],
    "specialties": ["Cultural Tours", "Adventure Tours"],
    "experience": "5 years of guiding experience..."
  },
  "documents": {
    "nationalIdFront": "base64_image_data",
    "nationalIdBack": "base64_image_data",
    "tourGuideLicense": "base64_image_data",
    "certificates": ["base64_image_data"]
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "applicationId": "app-123",
    "status": "pending_review",
    "message": "Application submitted successfully. We will review and contact you within 3-5 business days."
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 4.2 Get Tour Guide Application Status
**GET** `/tour-guides/application-status`
*Requires Authentication*

**Response (200):**
```json
{
  "success": true,
  "data": {
    "applicationId": "app-123",
    "status": "approved",
    "submittedAt": "2024-01-01T10:00:00Z",
    "reviewedAt": "2024-01-03T15:30:00Z",
    "feedback": "Application approved. Welcome to TouriMate!",
    "nextSteps": [
      "Complete profile setup",
      "Create your first tour",
      "Complete orientation course"
    ]
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 4.3 Create Tour (Tour Guide)
**POST** `/tour-guides/tours`
*Requires Authentication & Tour Guide Role*

**Request Body:**
```json
{
  "title": "Cultural Walking Tour of Old Quarter",
  "description": "Explore the historic Old Quarter...",
  "shortDescription": "2-hour walking tour through history...",
  "location": "Old Quarter, Hanoi",
  "duration": 1,
  "maxParticipants": 15,
  "price": 500000,
  "category": "Cultural",
  "difficulty": "Easy",
  "images": ["base64_image_data_1", "base64_image_data_2"],
  "itinerary": [
    {
      "day": 1,
      "title": "Old Quarter Exploration",
      "description": "Walk through ancient streets...",
      "activities": ["Historical sites", "Local markets", "Street food"]
    }
  ],
  "includes": ["Professional guide", "Bottled water"],
  "excludes": ["Food and drinks", "Transportation"],
  "terms": "Cancellation 24 hours in advance...",
  "availability": [
    {
      "date": "2024-02-01",
      "timeSlots": ["09:00", "14:00"]
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "tourId": "tour-456",
    "status": "pending_approval",
    "message": "Tour created successfully and submitted for review."
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 4.4 Get Tour Guide Tours
**GET** `/tour-guides/tours`
*Requires Authentication & Tour Guide Role*

**Query Parameters:**
- `status` (optional): draft, pending_approval, approved, rejected, active, inactive
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "tour-456",
      "title": "Cultural Walking Tour of Old Quarter",
      "location": "Old Quarter, Hanoi",
      "duration": 1,
      "price": 500000,
      "status": "approved",
      "totalBookings": 25,
      "totalRevenue": 12500000,
      "averageRating": 4.8,
      "totalReviews": 18,
      "createdAt": "2024-01-01T10:00:00Z",
      "lastModified": "2024-01-02T14:20:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 4.5 Update Tour (Tour Guide)
**PUT** `/tour-guides/tours/{id}`
*Requires Authentication & Tour Guide Role*

**Request Body:** (Same as Create Tour)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Tour updated successfully",
    "requiresReapproval": true
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 4.6 Request Tour Promotion
**POST** `/tour-guides/tours/{id}/promote`
*Requires Authentication & Tour Guide Role*

**Request Body:**
```json
{
  "duration": 30,
  "promotionType": "featured",
  "paymentMethod": "credit_card"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "promotionId": "promo-123",
    "cost": 2000000,
    "currency": "VND",
    "paymentUrl": "https://payment.tourimate.com/pay/promo-123",
    "startDate": "2024-02-01T00:00:00Z",
    "endDate": "2024-03-02T00:00:00Z"
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 4.7 Report Negative Review
**POST** `/tour-guides/report-review`
*Requires Authentication & Tour Guide Role*

**Request Body:**
```json
{
  "reviewId": "review-789",
  "reason": "inappropriate_content",
  "description": "This review contains false information...",
  "evidence": ["base64_image_data"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "reportId": "report-123",
    "status": "submitted",
    "message": "Report submitted successfully. We will investigate within 48 hours."
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 4.8 Create OCOP Product (Tour Guide)
**POST** `/tour-guides/products`
*Requires Authentication & Tour Guide Role*

**Request Body:**
```json
{
  "name": "Handmade Ceramic Vase",
  "description": "Beautiful handcrafted ceramic vase...",
  "shortDescription": "Traditional Vietnamese ceramic art...",
  "category": "Handicrafts",
  "brand": "Local Artisan",
  "region": "Bat Trang, Hanoi",
  "price": 750000,
  "stock": 20,
  "images": ["base64_image_data_1", "base64_image_data_2"],
  "specifications": {
    "material": "Ceramic",
    "dimensions": "20cm x 15cm",
    "weight": "800g",
    "color": "Blue and White"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "productId": "product-789",
    "status": "pending_approval",
    "message": "Product created successfully and submitted for review."
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 4.9 Get Tour Guide Products
**GET** `/tour-guides/products`
*Requires Authentication & Tour Guide Role*

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "product-789",
      "name": "Handmade Ceramic Vase",
      "category": "Handicrafts",
      "price": 750000,
      "stock": 20,
      "status": "approved",
      "totalSales": 5,
      "totalRevenue": 3750000,
      "averageRating": 4.9,
      "totalReviews": 3,
      "createdAt": "2024-01-01T10:00:00Z"
    }
  ],
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 4.10 Get Tour Guide Revenue
**GET** `/tour-guides/revenue`
*Requires Authentication & Tour Guide Role*

**Query Parameters:**
- `period` (optional): daily, weekly, monthly, yearly
- `start_date` (optional): Start date (YYYY-MM-DD)
- `end_date` (optional): End date (YYYY-MM-DD)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRevenue": 50000000,
      "commission": 7500000,
      "netEarnings": 42500000,
      "currency": "VND",
      "period": "monthly"
    },
    "breakdown": {
      "tours": {
        "revenue": 35000000,
        "commission": 5250000,
        "netEarnings": 29750000,
        "bookings": 25
      },
      "products": {
        "revenue": 15000000,
        "commission": 2250000,
        "netEarnings": 12750000,
        "orders": 20
      }
    },
    "chartData": [
      {
        "date": "2024-01-01",
        "revenue": 1500000,
        "earnings": 1275000
      }
    ],
    "pendingPayouts": 5000000,
    "nextPayoutDate": "2024-02-01T00:00:00Z"
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

---

## 5. Admin Management

### 5.1 Get Admin Dashboard
**GET** `/admin/dashboard`
*Requires Authentication & Admin Role*

**Response (200):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": 5420,
      "totalTourGuides": 156,
      "totalTours": 234,
      "totalProducts": 1890,
      "totalBookings": 3450,
      "totalOrders": 8920,
      "totalRevenue": 1500000000,
      "monthlyGrowth": 15.5
    },
    "recentActivity": [
      {
        "type": "tour_guide_application",
        "description": "New tour guide application from John Doe",
        "timestamp": "2024-01-01T10:00:00Z"
      }
    ],
    "pendingApprovals": {
      "tourGuideApplications": 12,
      "tours": 8,
      "products": 15,
      "reports": 3
    }
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 5.2 Get All Users (Admin)
**GET** `/admin/users`
*Requires Authentication & Admin Role*

**Query Parameters:**
- `role` (optional): Customer, TourGuide
- `status` (optional): active, suspended, inactive
- `search` (optional): Search by name or email
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "user-123",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "Customer",
      "status": "active",
      "isEmailVerified": true,
      "isPhoneVerified": true,
      "totalBookings": 5,
      "totalSpent": 12500000,
      "createdAt": "2024-01-01T10:00:00Z",
      "lastLoginAt": "2024-01-15T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 5420,
    "totalPages": 109,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 5.3 Update User Status (Admin)
**PUT** `/admin/users/{id}/status`
*Requires Authentication & Admin Role*

**Request Body:**
```json
{
  "status": "suspended",
  "reason": "Violation of terms of service"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "User status updated successfully"
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 5.4 Get Tour Guide Applications (Admin)
**GET** `/admin/tour-guide-applications`
*Requires Authentication & Admin Role*

**Query Parameters:**
- `status` (optional): pending_review, approved, rejected
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "app-123",
      "applicant": {
        "id": "user-456",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@example.com"
      },
      "status": "pending_review",
      "submittedAt": "2024-01-01T10:00:00Z",
      "personalInfo": {
        "dateOfBirth": "1985-05-15",
        "nationalId": "123456789",
        "address": "123 Main St, Ho Chi Minh City"
      },
      "qualifications": {
        "languages": ["Vietnamese", "English"],
        "experience": "5 years of guiding experience..."
      },
      "documents": {
        "nationalIdFront": "https://cdn.tourimate.com/docs/app-123/id-front.jpg",
        "nationalIdBack": "https://cdn.tourimate.com/docs/app-123/id-back.jpg",
        "tourGuideLicense": "https://cdn.tourimate.com/docs/app-123/license.jpg"
      }
    }
  ],
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 5.5 Review Tour Guide Application (Admin)
**PUT** `/admin/tour-guide-applications/{id}`
*Requires Authentication & Admin Role*

**Request Body:**
```json
{
  "status": "approved",
  "feedback": "Application approved. Welcome to TouriMate!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Application reviewed successfully",
    "notificationSent": true
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 5.6 Get All Tours (Admin)
**GET** `/admin/tours`
*Requires Authentication & Admin Role*

**Query Parameters:**
- `status` (optional): pending_approval, approved, rejected, active, inactive
- `tour_guide` (optional): Tour guide ID
- `search` (optional): Search by title or location
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response (200):** (Similar structure to tour listing with admin-specific fields)

### 5.7 Approve/Reject Tour (Admin)
**PUT** `/admin/tours/{id}/status`
*Requires Authentication & Admin Role*

**Request Body:**
```json
{
  "status": "approved",
  "feedback": "Tour approved for listing"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Tour status updated successfully"
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### 5.8 Get Revenue Analytics (Admin)
**GET** `/admin/revenue`
*Requires Authentication & Admin Role*

**Query Parameters:**
- `period` (optional): daily, weekly, monthly, yearly
- `start_date` (optional): Start date
- `end_date` (optional): End date

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRevenue": 2500000000,
      "platformFees": 375000000,
      "tourGuideEarnings": 1593750000,
      "vendorEarnings": 531250000,
      "currency": "VND",
      "period": "monthly"
    },
    "breakdown": {
      "tours": {
        "revenue": 1750000000,
        "commission": 262500000,
        "bookings": 1250
      },
      "products": {
        "revenue": 750000000,
        "commission": 112500000,
        "orders": 2100
      }
    },
    "chartData": [
      {
        "date": "2024-01-01",
        "revenue": 85000000,
        "commission": 12750000
      }
    ],
    "topPerformers": {
      "tourGuides": [
        {
          "id": "guide-123",
          "name": "Nguyen Van A",
          "revenue": 15000000,
          "bookings": 45
        }
      ],
      "tours": [
        {
          "id": "tour-123",
          "title": "Ha Long Bay Adventure",
          "revenue": 25000000,
          "bookings": 50
        }
      ]
    }
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

---

## Error Handling

### Common Error Codes

- `VALIDATION_ERROR` - Request validation failed
- `AUTHENTICATION_REQUIRED` - User not authenticated
- `AUTHORIZATION_FAILED` - Insufficient permissions
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `DUPLICATE_RESOURCE` - Resource already exists
- `OTP_EXPIRED` - OTP has expired
- `OTP_INVALID` - Invalid OTP code
- `PAYMENT_FAILED` - Payment processing failed
- `INSUFFICIENT_STOCK` - Product out of stock
- `BOOKING_UNAVAILABLE` - Tour date not available
- `RATE_LIMITED` - Too many requests

### Error Response Examples

**Validation Error (422):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": ["Email is required"],
      "password": ["Password must be at least 8 characters"]
    }
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

**Authentication Required (401):**
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "Authentication token is required"
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

**Resource Not Found (404):**
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Tour not found"
  },
  "timestamp": "2024-01-01T10:00:00Z"
}
```

---

## Rate Limiting

- Authentication endpoints: 5 requests per minute per IP
- OTP endpoints: 3 requests per hour per phone number
- Search endpoints: 100 requests per minute per user
- General API: 1000 requests per hour per user

## Versioning

API uses URL versioning: `/api/v1/`

## Pagination

All list endpoints support pagination with these parameters:
- `page`: Page number (starts from 1)
- `limit`: Items per page (max 100, default 20)

## File Uploads

- Maximum file size: 10MB for images, 50MB for documents
- Supported image formats: JPEG, PNG, WebP
- Supported document formats: PDF, DOC, DOCX
- Images are automatically optimized and resized

This comprehensive API documentation covers all the main endpoints needed for the TouriMate platform. Each endpoint includes detailed request/response schemas, authentication requirements, and error handling information.
