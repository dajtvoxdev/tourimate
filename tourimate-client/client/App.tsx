import React from "react";
import Login from "./src/features/auth/Login";
import Register from "./src/features/auth/Register";
import ForgotPassword from "./src/features/auth/ForgotPassword";
import "./src/styles.css";
import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import TourHomepage from "./components/TourHomepage";
import TourGuides from "./components/TourGuides";
import TourDetailComponent from "./components/TourDetail";
import Tours from "./pages/Tours";
import TourDetail from "./pages/TourDetail";
import AboutUs from "./components/AboutUs";
import PersonalProfile from "./components/PersonalProfile";
import TourGuideRegistration from "./components/TourGuideRegistration";
import GuideDetail from "./pages/GuideDetail";
import ProductCheckout from "./pages/ProductCheckout";
import AdminTourManagement from "./components/AdminTourManagement";
import AdminDivisions from "./components/AdminDivisions";
import AdminTourCategories from "./components/AdminTourCategories";
import AdminTourGuideManagement from "./components/AdminTourGuideManagement";
import AdminUsers from "./components/AdminUsers";
import AdminGuides from "./components/AdminGuides";
import AdminReviews from "./pages/AdminReviews";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTransactions from "./pages/AdminTransactions";
import AdminBookings from "./pages/AdminBookings";
import AdminOrderManagement from "./pages/AdminOrderManagement";
import AdminRevenue from "./pages/AdminRevenue";
import AdminRefunds from "./pages/AdminRefunds";
import TourGuideOrderManagement from "./pages/TourGuideOrderManagement";
import AdminPricingConfig from "./pages/AdminPricingConfig";
import AdminCostManagement from "./pages/AdminCostManagement";
import TourGuideCostManagement from "./pages/TourGuideCostManagement";
import TourGuideProductManagement from "./pages/TourGuideProductManagement";
import ProductForm from "./pages/ProductForm";
import TourGuidePaymentRequests from "./pages/TourGuidePaymentRequests";
import AdminPaymentRequests from "./pages/AdminPaymentRequests";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import NonAdminProtectedRoute from "./components/NonAdminProtectedRoute";
import TourAvailabilityPage from "./pages/TourAvailabilityPage";
import TourCategoriesPage from "./pages/TourCategoriesPage";
import TourBooking from "./pages/TourBooking";
import PaymentSuccess from "./pages/PaymentSuccess";
import ProductCategoriesPage from "./pages/ProductCategoriesPage";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/home" element={<TourHomepage />} />
          <Route path="/tours" element={<Tours />} />
          <Route path="/tour-guides" element={<TourGuides />} />
          <Route path="/tour/:id" element={<TourDetail />} />
          <Route path="/tour/:id/book" element={<TourBooking />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/profile" element={<PersonalProfile />} />
          <Route
            path="/tour-guide-registration"
            element={
              <ProtectedRoute>
                <TourGuideRegistration />
              </ProtectedRoute>
            }
          />
          <Route path="/guide/:guideId" element={<GuideDetail />} />
          <Route 
            path="/checkout" 
            element={
              <ProtectedRoute>
                <ProductCheckout />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/cart" 
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/tours" 
            element={
              <AdminProtectedRoute>
                <AdminTourManagement />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/divisions" 
            element={
              <AdminProtectedRoute>
                <AdminDivisions />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/tour-categories" 
            element={
              <AdminProtectedRoute>
                <AdminTourCategories />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/tour-guide-applications" 
            element={
              <AdminProtectedRoute>
                <AdminTourGuideManagement />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <AdminProtectedRoute>
                <AdminUsers />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/guides" 
            element={
              <AdminProtectedRoute>
                <AdminGuides />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/reviews" 
            element={
              <AdminProtectedRoute>
                <AdminReviews />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/transactions" 
            element={
              <AdminProtectedRoute>
                <AdminTransactions />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/bookings" 
            element={
              <AdminProtectedRoute>
                <AdminBookings />
              </AdminProtectedRoute>
            } 
          />
          {/* Friendly shortcuts for filtered bookings */}
          <Route path="/admin/bookings/pending" element={<Navigate to="/admin/bookings?status=pendingpayment" replace />} />
          <Route path="/admin/bookings/confirmed" element={<Navigate to="/admin/bookings?status=confirmed" replace />} />
          <Route 
            path="/admin/orders" 
            element={
              <AdminProtectedRoute>
                <AdminOrderManagement />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/revenue" 
            element={
              <AdminProtectedRoute>
                <AdminRevenue />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/refunds" 
            element={
              <AdminProtectedRoute>
                <AdminRefunds />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/pricing-config" 
            element={
              <AdminProtectedRoute>
                <AdminPricingConfig />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/cost-management" 
            element={
              <AdminProtectedRoute>
                <AdminCostManagement />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/payment-requests" 
            element={
              <AdminProtectedRoute>
                <AdminPaymentRequests />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/my-payment-requests" 
            element={
              <ProtectedRoute>
                <TourGuidePaymentRequests />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/products" 
            element={
              <ProtectedRoute>
                <TourGuideProductManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/product/create" 
            element={
              <ProtectedRoute>
                <ProductForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/product/:id/edit" 
            element={
              <ProtectedRoute>
                <ProductForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/my-orders" 
            element={
              <ProtectedRoute>
                <TourGuideOrderManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/cost-management" 
            element={
              <ProtectedRoute>
                <TourGuideCostManagement />
              </ProtectedRoute>
            } 
          />
        <Route
          path="/admin/tours/:tourId/availability"
          element={
            <AdminProtectedRoute>
              <TourAvailabilityPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/tour-categories"
          element={
            <AdminProtectedRoute>
              <TourCategoriesPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/product-categories"
          element={
            <AdminProtectedRoute>
              <ProductCategoriesPage />
            </AdminProtectedRoute>
          }
        />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
