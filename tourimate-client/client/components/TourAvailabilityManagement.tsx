import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar as CalendarIcon, 
  MapPin, 
  Car, 
  Users, 
  DollarSign,
  Clock,
  FileText,
  Loader2,
  Check,
  X,
  ChevronLeft
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { TourAvailabilityApiService, TourAvailabilityDto, CreateTourAvailabilityRequest, UpdateTourAvailabilityRequest, DivisionDto } from "../src/lib/tourAvailabilityApi";
import { toast } from "sonner";

interface TourAvailabilityManagementProps {
  tourId: string;
  tourTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

const TourAvailabilityManagement: React.FC<TourAvailabilityManagementProps> = ({
  tourId,
  tourTitle,
  isOpen,
  onClose
}) => {
  const [availabilities, setAvailabilities] = useState<TourAvailabilityDto[]>([]);
  const [divisions, setDivisions] = useState<DivisionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedAvailability, setSelectedAvailability] = useState<TourAvailabilityDto | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState<CreateTourAvailabilityRequest>({
    tourId,
    date: new Date().toISOString().split('T')[0],
    maxParticipants: 20,
    isAvailable: true,
    departureDivisionCode: 0,
    vehicle: "",
    adultPrice: 0,
    childPrice: 0,
    surcharge: 0,
    tripTime: "",
    note: ""
  });

  // Vehicle suggestions
  const vehicleSuggestions = [
    "Bus 45 chỗ",
    "Bus 29 chỗ", 
    "Bus 16 chỗ",
    "Xe máy",
    "Xe đạp",
    "Tàu hỏa",
    "Máy bay",
    "Xe du lịch",
    "Thuyền",
    "Ca nô"
  ];

  // Trip time states
  const [tripDays, setTripDays] = useState<number>(1);
  const [tripNights, setTripNights] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, tourId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [availabilitiesData, divisionsData] = await Promise.all([
        TourAvailabilityApiService.getTourAvailabilitiesByTour(tourId),
        TourAvailabilityApiService.getDivisions()
      ]);
      setAvailabilities(availabilitiesData);
      setDivisions(divisionsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tourId,
      date: new Date().toISOString().split('T')[0],
      maxParticipants: 20,
      isAvailable: true,
      departureDivisionCode: 0,
      vehicle: "",
      adultPrice: 0,
      childPrice: 0,
      surcharge: 0,
      tripTime: "",
      note: ""
    });
    setTripDays(1);
    setTripNights(0);
  };

  const handleCreate = async () => {
    try {
      setEditLoading(true);
      await TourAvailabilityApiService.createTourAvailability(formData);
      toast.success("Tạo lịch trình thành công");
      setIsCreateOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error("Error creating tour availability:", error);
      toast.error("Không thể tạo lịch trình");
    } finally {
      setEditLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedAvailability) return;
    
    try {
      setEditLoading(true);
      const updateData: UpdateTourAvailabilityRequest = {
        date: formData.date,
        maxParticipants: formData.maxParticipants,
        isAvailable: formData.isAvailable,
        departureDivisionCode: formData.departureDivisionCode,
        vehicle: formData.vehicle,
        adultPrice: formData.adultPrice,
        childPrice: formData.childPrice,
        surcharge: formData.surcharge,
        tripTime: formData.tripTime,
        note: formData.note
      };
      
      await TourAvailabilityApiService.updateTourAvailability(selectedAvailability.id, updateData);
      toast.success("Cập nhật lịch trình thành công");
      setIsEditOpen(false);
      setSelectedAvailability(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error("Error updating tour availability:", error);
      toast.error("Không thể cập nhật lịch trình");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await TourAvailabilityApiService.deleteTourAvailability(id);
      toast.success("Xóa lịch trình thành công");
      loadData();
    } catch (error) {
      console.error("Error deleting tour availability:", error);
      toast.error("Không thể xóa lịch trình");
    }
  };

  const openEditDialog = (availability: TourAvailabilityDto) => {
    setSelectedAvailability(availability);
    setFormData({
      tourId,
      date: availability.date.split('T')[0],
      maxParticipants: availability.maxParticipants,
      isAvailable: availability.isAvailable,
      departureDivisionCode: availability.departureDivisionCode,
      vehicle: availability.vehicle || "",
      adultPrice: availability.adultPrice,
      childPrice: availability.childPrice,
      surcharge: availability.surcharge,
      tripTime: availability.tripTime || "",
      note: availability.note || ""
    });
    
    // Parse trip time for days and nights
    const tripTimeMatch = availability.tripTime?.match(/(\d+)\s*ngày\s*(\d+)\s*đêm/i);
    if (tripTimeMatch) {
      setTripDays(parseInt(tripTimeMatch[1]));
      setTripNights(parseInt(tripTimeMatch[2]));
    } else {
      setTripDays(1);
      setTripNights(0);
    }
    
    setIsEditOpen(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };


  // Helper functions for price input formatting
  const formatPriceInput = (value: string) => {
    const digits = value.replace(/[^0-9]/g, "");
    return digits ? new Intl.NumberFormat('vi-VN').format(parseInt(digits)) : "";
  };

  const parsePriceInput = (value: string) => {
    const digits = value.replace(/[^0-9]/g, "");
    return digits ? parseInt(digits) : 0;
  };

  // Update trip time when days/nights change
  useEffect(() => {
    if (tripDays > 0 || tripNights > 0) {
      let tripTimeText = "";
      if (tripDays > 0) tripTimeText += `${tripDays} ngày`;
      if (tripNights > 0) tripTimeText += ` ${tripNights} đêm`;
      setFormData(prev => ({ ...prev, tripTime: tripTimeText.trim() }));
    }
  }, [tripDays, tripNights]);

  const getAvailabilityBadge = (availability: TourAvailabilityDto) => {
    if (!availability.isAvailable) {
      return <Badge variant="destructive">Không khả dụng</Badge>;
    }
    if (availability.hasAvailableSpots) {
      return <Badge variant="default">Có chỗ trống</Badge>;
    }
    return <Badge variant="secondary">Hết chỗ</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-20xl w-[90vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Quản lý Lịch trình</DialogTitle>
          <DialogDescription>
            Quản lý lịch trình và giá cho tour: <strong>{tourTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Left side - List of availabilities */}
          <div className="flex-[0.6] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Danh sách Lịch trình ({availabilities.length})</h3>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm mới
              </Button>
            </div>

            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Đang tải dữ liệu...</span>
                </div>
              ) : availabilities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Chưa có lịch trình nào</p>
                  <p className="text-sm">Nhấn "Thêm mới" để tạo lịch trình đầu tiên</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availabilities.map((availability) => (
                    <Card key={availability.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-4 w-4 text-blue-500" />
                              <span className="font-medium">{format(new Date(availability.date), 'dd/MM/yyyy')}</span>
                            </div>
                            {getAvailabilityBadge(availability)}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{availability.departureDivisionName}</span>
                            </div>
                            {availability.vehicle && (
                              <div className="flex items-center gap-1">
                                <Car className="h-4 w-4" />
                                <span>{availability.vehicle}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{availability.bookedParticipants}/{availability.maxParticipants}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              <span>{formatPrice(availability.totalAdultPrice)}</span>
                            </div>
                          </div>
                          
                          {availability.tripTime && (
                            <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>{availability.tripTime}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(availability)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xóa lịch trình?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Hành động này không thể hoàn tác. Lịch trình sẽ bị xóa vĩnh viễn.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(availability.id)}>Xóa</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Separator orientation="vertical" />

          {/* Right side - Form */}
          <div className="flex-[0.4] flex flex-col">
            <h3 className="text-lg font-semibold mb-4">Thông tin Lịch trình</h3>
            <div className="flex-1 overflow-auto space-y-4 pb-6">
              <div>
                <Label htmlFor="date">Ngày khởi hành</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? (
                        format(new Date(formData.date), "dd/MM/yyyy", { locale: vi })
                      ) : (
                        <span>Chọn ngày khởi hành</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[100]" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.date ? new Date(formData.date) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setFormData(prev => ({ 
                            ...prev, 
                            date: format(date, "yyyy-MM-dd")
                          }));
                        }
                      }}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                      locale={vi}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="maxParticipants">Số người tối đa</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div>
                <Label htmlFor="departureDivision">Điểm khởi hành</Label>
                <Select
                  value={formData.departureDivisionCode.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, departureDivisionCode: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn điểm khởi hành" />
                  </SelectTrigger>
                  <SelectContent>
                    {divisions.filter(d => d.type === "Province").map((division) => (
                      <SelectItem key={division.code} value={division.code.toString()}>
                        {division.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="vehicle">Phương tiện</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {formData.vehicle || "Chọn phương tiện..."}
                      <ChevronLeft className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 z-[100]">
                    <Command>
                      <CommandInput placeholder="Tìm kiếm phương tiện..." />
                      <CommandList>
                        <CommandEmpty>Không tìm thấy phương tiện.</CommandEmpty>
                        <CommandGroup>
                          {vehicleSuggestions.map((vehicle) => (
                            <CommandItem
                              key={vehicle}
                              value={vehicle}
                              onSelect={(currentValue) => {
                                setFormData(prev => ({ ...prev, vehicle: currentValue }));
                              }}
                            >
                              {vehicle}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="adultPrice">Giá người lớn (VND)</Label>
                  <Input
                    id="adultPrice"
                    placeholder="Nhập giá..."
                    value={formatPriceInput(formData.adultPrice.toString())}
                    onChange={(e) => setFormData(prev => ({ ...prev, adultPrice: parsePriceInput(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="childPrice">Giá trẻ em (VND)</Label>
                  <Input
                    id="childPrice"
                    placeholder="Nhập giá..."
                    value={formatPriceInput(formData.childPrice.toString())}
                    onChange={(e) => setFormData(prev => ({ ...prev, childPrice: parsePriceInput(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="surcharge">Phụ thu (VND)</Label>
                  <Input
                    id="surcharge"
                    placeholder="Nhập phụ thu..."
                    value={formatPriceInput(formData.surcharge.toString())}
                    onChange={(e) => setFormData(prev => ({ ...prev, surcharge: parsePriceInput(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tripDays">Số ngày</Label>
                  <Input
                    id="tripDays"
                    type="number"
                    min="0"
                    value={tripDays}
                    onChange={(e) => setTripDays(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="tripNights">Số đêm</Label>
                  <Input
                    id="tripNights"
                    type="number"
                    min="0"
                    value={tripNights}
                    onChange={(e) => setTripNights(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="note">Ghi chú</Label>
                <Textarea
                  id="note"
                  placeholder="Ghi chú đặc biệt cho ngày này..."
                  value={formData.note}
                  onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAvailable: checked }))}
                />
                <Label htmlFor="isAvailable">Khả dụng</Label>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button 
                onClick={isEditOpen ? handleUpdate : handleCreate}
                disabled={editLoading}
                className="flex-1"
              >
                {editLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditOpen ? 'Đang cập nhật...' : 'Đang tạo...'}
                  </>
                ) : (
                  <>
                    {isEditOpen ? <Edit className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    {isEditOpen ? 'Cập nhật' : 'Tạo mới'}
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCreateOpen(false);
                  setIsEditOpen(false);
                  setSelectedAvailability(null);
                  resetForm();
                }}
              >
                Hủy
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TourAvailabilityManagement;
