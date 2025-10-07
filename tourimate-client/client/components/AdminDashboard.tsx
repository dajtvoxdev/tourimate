import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AdminLayout from "./AdminLayout";
import { tourApi } from "../src/lib/tourApi";
import { TourListDto, TourStatsDto } from "../src/lib/types/tour";
import { 
  Users, 
  MapPin, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Star,
  Eye,
  Edit,
  Trash2,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [tourStats, setTourStats] = useState<TourStatsDto | null>(null);
  const [recentTours, setRecentTours] = useState<TourListDto[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, toursData] = await Promise.all([
        tourApi.getTourStats(),
        tourApi.getTours({ page: 1, pageSize: 5, sortBy: "createdat", sortDirection: "desc" })
      ]);
      
      setTourStats(statsData);
      setRecentTours(toursData.tours);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Không thể tải dữ liệu dashboard");
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { 
      title: "Tổng tour", 
      value: tourStats?.totalTours.toString() || "0", 
      icon: MapPin, 
      change: "+5%" 
    },
    { 
      title: "Tour đang hoạt động", 
      value: tourStats?.activeTours.toString() || "0", 
      icon: MapPin, 
      change: "+5%" 
    },
    { 
      title: "Doanh thu", 
      value: `${tourStats?.totalRevenue.toLocaleString('vi-VN')} VND` || "0 VND", 
      icon: DollarSign, 
      change: "+8%" 
    },
    { 
      title: "Đặt tour", 
      value: tourStats?.totalBookings.toString() || "0", 
      icon: TrendingUp, 
      change: "+15%" 
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <Badge variant="default">Hoạt động</Badge>;
      case 'pendingapproval':
        return <Badge variant="secondary">Chờ duyệt</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Từ chối</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const recentUsers = [
    {
      id: 1,
      name: "Nguyễn Thị Lan",
      email: "lan@example.com",
      role: "Du khách",
      joinDate: "2024-01-15",
      avatar: "",
    },
    {
      id: 2,
      name: "Trần Văn Minh",
      email: "minh@example.com",
      role: "Hướng dẫn viên",
      joinDate: "2024-01-10",
      avatar: "",
    },
    {
      id: 3,
      name: "Lê Thị Hoa",
      email: "hoa@example.com",
      role: "Du khách",
      joinDate: "2024-01-08",
      avatar: "",
    },
  ];

  return (
    <AdminLayout>
      <div className="max-w-9xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bảng điều khiển</h1>
          <p className="text-gray-600 mt-2">Quản lý nền tảng tour của bạn</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stat.change} so với tháng trước
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="tours" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tours">Tour</TabsTrigger>
            <TabsTrigger value="users">Người dùng</TabsTrigger>
            <TabsTrigger value="analytics">Thống kê</TabsTrigger>
          </TabsList>

          <TabsContent value="tours" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quản lý Tour</CardTitle>
                <CardDescription>
                  Quản lý tất cả tour trên nền tảng
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên Tour</TableHead>
                      <TableHead>Hướng dẫn viên</TableHead>
                      <TableHead>Đặt tour</TableHead>
                      <TableHead>Đánh giá</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          <p className="mt-2 text-gray-500">Đang tải dữ liệu...</p>
                        </TableCell>
                      </TableRow>
                    ) : recentTours.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          Không có tour nào
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentTours.map((tour) => (
                        <TableRow key={tour.id}>
                          <TableCell className="font-medium">{tour.title}</TableCell>
                          <TableCell>{tour.tourGuideName}</TableCell>
                          <TableCell>{tour.totalBookings}</TableCell>
                          <TableCell className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-500 mr-1" />
                            {tour.averageRating.toFixed(1)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(tour.status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quản lý Người dùng</CardTitle>
                <CardDescription>
                  Quản lý người dùng và hướng dẫn viên trên nền tảng
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Người dùng</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Vai trò</TableHead>
                      <TableHead>Ngày tham gia</TableHead>
                      <TableHead>Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "Hướng dẫn viên" ? "default" : "secondary"}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.joinDate}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tổng quan Doanh thu</CardTitle>
                  <CardDescription>
                    Xu hướng doanh thu hàng tháng
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    Biểu đồ - tích hợp với thư viện biểu đồ
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tour Phổ biến</CardTitle>
                  <CardDescription>
                    Tour được đặt nhiều nhất trong tháng này
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loading ? (
                      <div className="text-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        <p className="mt-2 text-gray-500">Đang tải...</p>
                      </div>
                    ) : recentTours.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">Không có tour nào</p>
                    ) : (
                      recentTours.slice(0, 3).map((tour, index) => (
                        <div key={tour.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{tour.title}</p>
                              <p className="text-sm text-gray-500">{tour.tourGuideName}</p>
                            </div>
                          </div>
                          <Badge variant="outline">{tour.totalBookings} đặt tour</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
