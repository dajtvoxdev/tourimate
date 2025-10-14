import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import CkUploadAdapter from "../src/components/CkUploadAdapter";
import { useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SearchableSelect } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { httpWithRefresh, httpJson, httpUpload, getApiBase } from "@/src/lib/http";
import { useAuth } from "@/src/hooks/useAuth";

type CreateTourPayload = {
  title: string;
  description: string;
  shortDescription: string;
  location: string;
  duration: number;
  maxParticipants: number;
  price: number;
  currency: string;
  category: string;
  
  imageUrls?: string[];
  itinerary?: string;
  includes?: string;
  excludes?: string;
  terms?: string;
  isFeatured: boolean;
  divisionCode?: number;
  provinceCode?: number;
  wardCode?: number;
};

interface Props {
  initial?: Partial<CreateTourPayload>;
  onSubmit: (payload: CreateTourPayload) => void;
  onCancel?: () => void;
  onUploadImages?: (files: File[]) => Promise<string[]>; // returns urls
  submitLabel?: string;
}

type ItineraryItem = { day: number; title: string; description: string };

const CreateTourForm: React.FC<Props> = ({ initial, onSubmit, onCancel, onUploadImages, submitLabel }) => {
  const [formData, setFormData] = useState<CreateTourPayload>({
    title: initial?.title || "",
    description: initial?.description || "",
    shortDescription: initial?.shortDescription || "",
    location: initial?.location || "",
    duration: initial?.duration ?? 1,
    maxParticipants: initial?.maxParticipants ?? 10,
    price: initial?.price ?? 0,
    currency: "VND",
    category: initial?.category || "",
    
    imageUrls: initial?.imageUrls || [],
    itinerary: initial?.itinerary || "",
    includes: initial?.includes || "",
    excludes: initial?.excludes || "",
    terms: initial?.terms || "",
    isFeatured: initial?.isFeatured ?? false,
  });
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const isTourGuide = user?.role === 'TourGuide';
  const [divisions, setDivisions] = useState<Array<{ code: number; name: string }>>([]);
  const [wards, setWards] = useState<Array<{ code: number; name: string }>>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [selectedProvince, setSelectedProvince] = useState<number | undefined>(undefined);
  const [divisionsLoading, setDivisionsLoading] = useState<boolean>(true);
  const [wardsLoading, setWardsLoading] = useState<boolean>(false);
  const hasPrefilledProvince = useRef(false);
  const hasPrefilledWard = useRef(false);
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>(() => {
    if (initial?.itinerary) {
      try {
        const parsed = JSON.parse(initial.itinerary);
        if (Array.isArray(parsed)) {
          return parsed.map((x: any, idx: number) => ({
            day: Number(x.day ?? idx + 1),
            title: String(x.title ?? ""),
            description: String(x.description ?? ""),
          }));
        }
      } catch {}
    }
    return [{ day: 1, title: "", description: "" }];
  });
  const [includesList, setIncludesList] = useState<string[]>(() => {
    if (initial?.includes) {
      try {
        const parsed = JSON.parse(initial.includes);
        if (Array.isArray(parsed)) return parsed.map((x: any) => String(x)).filter(Boolean);
      } catch {}
    }
    return [];
  });
  const [excludesList, setExcludesList] = useState<string[]>(() => {
    if (initial?.excludes) {
      try {
        const parsed = JSON.parse(initial.excludes);
        if (Array.isArray(parsed)) return parsed.map((x: any) => String(x)).filter(Boolean);
      } catch {}
    }
    return [];
  });
  const [includeInput, setIncludeInput] = useState("");
  const [excludeInput, setExcludeInput] = useState("");
  const editorRef = useRef<any>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const baseApiUrl = ((import.meta as any).env?.VITE_API_BASE_URL || "https://localhost:7181");
  const authToken = (typeof window !== "undefined" ? localStorage.getItem("access_token") || undefined : undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || "";
    return (tmp.textContent || tmp.innerText || "").trim();
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.title?.trim()) newErrors.title = "Vui lòng nhập tên tour";
    if (!stripHtml(formData.shortDescription)) newErrors.shortDescription = "Vui lòng nhập mô tả ngắn";
    if (!formData.location?.trim()) newErrors.location = "Vui lòng nhập địa điểm chi tiết";
    if (!selectedProvince) newErrors.provinceCode = "Vui lòng chọn tỉnh/thành";
    // Ward is now optional, so we don't validate it
    if (!formData.category?.trim()) newErrors.category = "Vui lòng chọn danh mục";
    // Duration, participants, and price are managed in Tour Availability
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onUploadImages) return;
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const urls = await onUploadImages(files);
      setFormData(prev => ({ ...prev, imageUrls: urls }));
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const loadDivisions = async () => {
      try {
        setDivisionsLoading(true);
        const data = await httpJson<any[]>(`${getApiBase()}/api/divisions/provinces`, { skipAuth: true });
        const provinces = (data || []).filter((d: any) => (d.parentCode ?? d.ParentCode) == null);
        setDivisions(provinces.map((d: any) => ({ code: d.code ?? d.Code, name: d.name ?? d.Name })));
      } catch {
        // non-blocking
      } finally {
        setDivisionsLoading(false);
      }
    };
    
    const loadCategories = async () => {
      try {
        const data = await httpJson<any[]>(`${getApiBase()}/api/tourcategories`, { skipAuth: true });
        setCategories(data);
      } catch {
        // non-blocking
      }
    };
    
    loadDivisions();
    loadCategories();
  }, []);

  // Prefill province once divisions are loaded
  useEffect(() => {
    if (!hasPrefilledProvince.current && divisions.length > 0 && (initial as any)?.provinceCode) {
      const provinceCode = (initial as any).provinceCode as number;
      setSelectedProvince(provinceCode);
      setFormData(p => ({
        ...p,
        divisionCode: (initial as any)?.wardCode ? (initial as any).wardCode : provinceCode,
        ...( { provinceCode } as any ),
        ...( (initial as any)?.wardCode ? { wardCode: (initial as any).wardCode } : {} as any )
      }));
      hasPrefilledProvince.current = true;
    }
  }, [divisions]);

  useEffect(() => {
    if (selectedProvince) {
      // when province changes, reset ward and load wards by province
      setWards([]);
      setFormData(p => ({ ...p, wardCode: undefined, divisionCode: selectedProvince } as any));
    } else {
      setWards([]);
    }
  }, [selectedProvince]);

  useEffect(() => {
    const loadWardsByProvince = async (provinceCode: number) => {
      try {
        setWardsLoading(true);
        const url = `${getApiBase()}/api/divisions/wards-by-province/${provinceCode}`;
        console.debug('Loading wards by province:', url);
        const data = await httpJson<any[]>(url, { skipAuth: true });
        const mapped = (data || []).map((d: any) => ({ code: d.code ?? d.Code, name: d.name ?? d.Name }));
        console.debug('Wards loaded:', mapped.length);
        setWards(mapped);
      } catch {
        setWards([]);
      } finally {
        setWardsLoading(false);
      }
    };
    if (selectedProvince) loadWardsByProvince(selectedProvince);
    else setWards([]);
  }, [selectedProvince]);

  // Prefill ward once wards are loaded for the selected province
  useEffect(() => {
    if (!hasPrefilledWard.current && wards.length > 0 && (initial as any)?.wardCode && selectedProvince) {
      const wardCode = (initial as any).wardCode as number;
      const exists = wards.some(w => w.code === wardCode);
      if (exists) {
        setFormData(p => ({ ...p, ...( { wardCode } as any ), divisionCode: wardCode }));
      }
      hasPrefilledWard.current = true;
    }
  }, [wards, selectedProvince]);

  return (
    <>
      {(divisionsLoading || (((initial as any)?.provinceCode) && wardsLoading)) ? (
        <div className="w-full p-6 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="text-sm text-gray-500">Đang tải dữ liệu, vui lòng đợi...</div>
        </div>
      ) : null}
      {!(divisionsLoading || (((initial as any)?.provinceCode) && wardsLoading)) && (
      <Tabs defaultValue="basic" className="w-full flex-1 overflow-y-auto px-6 pb-24">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
          <TabsTrigger value="details">Chi tiết</TabsTrigger>
          <TabsTrigger value="content">Nội dung</TabsTrigger>
          <TabsTrigger value="settings">Cài đặt</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title">Tên Tour <span className="text-red-500">*</span></Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="Nhập tên tour" />
              {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
            </div>
            <div className="col-span-2">
              <Label htmlFor="shortDescription">Mô tả ngắn <span className="text-red-500">*</span></Label>
              <div className="mt-2 h-[180px] ckeditor-container">
                <CKEditor
                  editor={ClassicEditor}
                  data={formData.shortDescription}
                  config={{
                    language: 'vi',
                    toolbar: [
                      'heading','|','bold','italic','underline','link','bulletedList','numberedList','blockQuote','undo','redo','|','sourceEditing'
                    ],
                  }}
                  onChange={(_, editor: any) => {
                    const data = editor.getData();
                    setFormData(p => ({ ...p, shortDescription: data }));
                  }}
                />
              </div>
              {errors.shortDescription && <p className="text-sm text-red-500 mt-1">{errors.shortDescription}</p>}
            </div>
            {/* Row: Tỉnh/Thành phố - Phường/Xã - Địa điểm chi tiết */}
            <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="division">Tỉnh/Thành phố <span className="text-red-500">*</span></Label>
                <SearchableSelect 
                  value={selectedProvince?.toString() ?? ""} 
                  onValueChange={(value) => {
                    const code = value ? parseInt(value) : undefined;
                    setSelectedProvince(code);
                    setFormData(p => ({ ...p, divisionCode: code, provinceCode: code, wardCode: undefined } as any));
                  }}
                  placeholder="Chọn tỉnh/thành"
                  searchPlaceholder="Tìm kiếm tỉnh/thành..."
                  options={divisions.map(d => ({ value: String(d.code), label: d.name }))}
                />
              </div>
              <div>
                <Label htmlFor="ward">Phường/Xã</Label>
                <SearchableSelect 
                  value={formData.wardCode ? String(formData.wardCode) : ""}
                  onValueChange={(value) => setFormData(p => ({ ...p, wardCode: value ? parseInt(value) : undefined, divisionCode: value ? parseInt(value) : selectedProvince } as any))}
                  placeholder={selectedProvince ? (wardsLoading ? "Đang tải..." : (wards.length ? "Chọn phường/xã" : "Không có dữ liệu")) : "Chọn tỉnh trước"}
                  searchPlaceholder="Tìm kiếm phường/xã..."
                  options={[
                    { value: "", label: "Không chọn" },
                    ...wards.map(w => ({ value: String(w.code), label: w.name }))
                  ]}
                  disabled={!selectedProvince || wards.length === 0}
                />
              </div>
              <div>
                <Label htmlFor="location">Địa điểm chi tiết <span className="text-red-500">*</span></Label>
                <Input id="location" value={formData.location} onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))} placeholder="Ví dụ: 123 Phố Huế, Hai Bà Trưng" />
                {errors.location && <p className="text-sm text-red-500 mt-1">{errors.location}</p>}
              </div>
            </div>
            {/* Row: Danh mục */}
            <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <Label htmlFor="category">Danh mục <span className="text-red-500">*</span></Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(p => ({ ...p, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.code}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-red-500 mt-1">{errors.category}</p>}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label>Hình ảnh</Label>
              <p className="text-sm text-gray-500 mt-1">Tải lên tối đa nhiều ảnh. Bạn có thể xóa ảnh đã tải.</p>
              <div className="relative mt-2">
                <Input type="file" accept="image/*" multiple onChange={handleFiles} disabled={uploading} aria-busy={uploading} />
                {uploading && (
                  <div className="absolute inset-0 bg-white/60 flex items-center gap-2 px-3 rounded-md">
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                    <span className="text-sm text-gray-600">Đang tải ảnh, vui lòng đợi...</span>
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                {(formData.imageUrls || []).map(url => (
                  <div key={url} className="relative group">
                    <img src={url} alt="preview" className="w-20 h-20 object-cover rounded-lg border" />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, imageUrls: (prev.imageUrls || []).filter(u => u !== url) }))}
                      className="absolute -top-2 -right-2 bg-white border rounded-full w-6 h-6 text-gray-600 shadow hover:text-red-600"
                      aria-label="Xóa ảnh"
                      title="Xóa ảnh"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>Lịch trình</Label>
                <Button type="button" variant="outline" onClick={() => setItineraryItems(prev => [...prev, { day: (prev.at(-1)?.day ?? prev.length) + 1, title: "", description: "" }])}>Thêm ngày</Button>
              </div>
              <div className="mt-3 space-y-4">
                {itineraryItems.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <Label htmlFor={`day-${index}`}>Ngày</Label>
                        <Input id={`day-${index}`} type="number" min={1} value={item.day} onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setItineraryItems(prev => prev.map((it, i) => i === index ? { ...it, day: val } : it));
                        }} />
                      </div>
                      <div className="md:col-span-3">
                        <Label htmlFor={`title-${index}`}>Tiêu đề</Label>
                        <Input id={`title-${index}`} value={item.title} onChange={(e) => setItineraryItems(prev => prev.map((it, i) => i === index ? { ...it, title: e.target.value } : it))} placeholder="Ví dụ: Tham quan phố cổ" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`desc-${index}`}>Mô tả</Label>
                      <div className="mt-2">
                        <CKEditor
                          editor={ClassicEditor}
                          data={item.description}
                          config={{
                            language: 'vi',
                            toolbar: [
                              'heading','|','bold','italic','underline','link','bulletedList','numberedList','blockQuote','imageUpload','undo','redo','|','sourceEditing'
                            ]
                          } as any}
                          onReady={(editor: any) => {
                            const base = baseApiUrl;
                            const token = authToken;
                            editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => new CkUploadAdapter(loader, base, token);
                          }}
                          onChange={(_, editor: any) => {
                            const data = editor.getData();
                            setItineraryItems(prev => prev.map((it, i) => i === index ? { ...it, description: data } : it));
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button type="button" variant="outline" onClick={() => setItineraryItems(prev => prev.filter((_, i) => i !== index))}>Xóa ngày</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Mô tả chi tiết *</Label>
              <div className="mt-2 h-[300px] ckeditor-container">
                <CKEditor
                    editor={ClassicEditor}
                    data={formData.description}
                  config={{
                      language: 'vi',
                      toolbar: [
                        "heading","|","bold","italic","underline","link","bulletedList","numberedList","blockQuote","insertTable","undo","redo","imageUpload","|","videoUpload","|","sourceEditing"
                      ],
                    htmlSupport: {
                        allow: [
                          {
                            name: /.*/,
                            attributes: true,
                            classes: true,
                            styles: true
                          }
                        ]
                    }
                  } as any}
                    onReady={(editor: any) => {
                      const base = baseApiUrl;
                      const token = authToken;
                      // custom upload adapter
                      editor.plugins.get("FileRepository").createUploadAdapter = (loader: any) => new CkUploadAdapter(loader, base, token);
                      editorRef.current = editor;
                    }}
                    onChange={(_, editor: any) => {
                      const data = editor.getData();
                      setFormData(p => ({ ...p, description: data }));
                    }}
                  />
              </div>
              {/* Hidden input to handle video uploads via our API and insert into editor as <video> */}
              <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/ogg" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const form = new FormData();
                form.append('file', file);
                const data = await httpUpload<{ url: string }>(`${getApiBase()}/api/media/upload`, form);
                const url = data?.url;
                if (!url || !editorRef.current) return;
                editorRef.current.model.change((writer: any) => {
                  const insertPosition = editorRef.current.model.document.selection.getFirstPosition();
                  const viewFragment = editorRef.current.data.processor.toView(`<p><video controls src="${url}"></video></p>`);
                  const modelFragment = editorRef.current.data.toModel(viewFragment);
                  editorRef.current.model.insertContent(modelFragment, insertPosition);
                });
                if (videoInputRef.current) videoInputRef.current.value = "";
              }} />
              <div className="mt-2">
                <Button type="button" variant="outline" onClick={() => videoInputRef.current?.click()}>Tải video</Button>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>Bao gồm</Label>
                <div className="flex gap-2">
                  <Input value={includeInput} onChange={(e) => setIncludeInput(e.target.value)} placeholder="Thêm mục bao gồm" />
                  <Button type="button" onClick={() => {
                    const val = includeInput.trim();
                    if (!val) return;
                    setIncludesList(prev => [...prev, val]);
                    setIncludeInput("");
                  }}>Thêm</Button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {includesList.map((item, idx) => (
                  <span key={idx} className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-gray-100 text-sm">
                    {item}
                    <button type="button" className="text-gray-500 hover:text-gray-700" onClick={() => setIncludesList(prev => prev.filter((_, i) => i !== idx))}>×</button>
                  </span>
                ))}
                {includesList.length === 0 && (
                  <span className="text-sm text-gray-500">Chưa có mục nào</span>
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>Không bao gồm</Label>
                <div className="flex gap-2">
                  <Input value={excludeInput} onChange={(e) => setExcludeInput(e.target.value)} placeholder="Thêm mục không bao gồm" />
                  <Button type="button" onClick={() => {
                    const val = excludeInput.trim();
                    if (!val) return;
                    setExcludesList(prev => [...prev, val]);
                    setExcludeInput("");
                  }}>Thêm</Button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {excludesList.map((item, idx) => (
                  <span key={idx} className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-gray-100 text-sm">
                    {item}
                    <button type="button" className="text-gray-500 hover:text-gray-700" onClick={() => setExcludesList(prev => prev.filter((_, i) => i !== idx))}>×</button>
                  </span>
                ))}
                {excludesList.length === 0 && (
                  <span className="text-sm text-gray-500">Chưa có mục nào</span>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="terms">Điều khoản</Label>
              <div className="mt-2 h-[200px] ckeditor-container">
                <CKEditor
                  editor={ClassicEditor}
                  data={formData.terms || ''}
                  config={{
                    language: 'vi',
                    toolbar: [
                      'heading','|','bold','italic','underline','link','bulletedList','numberedList','blockQuote','undo','redo','|','sourceEditing'
                    ],
                  }}
                  onChange={(_, editor: any) => {
                    const data = editor.getData();
                    setFormData(p => ({ ...p, terms: data }));
                  }}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="space-y-4">
            {!isTourGuide ? (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isFeatured">Tour nổi bật</Label>
                  <p className="text-sm text-gray-500">Hiển thị tour này ở vị trí nổi bật</p>
                </div>
                <Switch id="isFeatured" checked={formData.isFeatured} onCheckedChange={(checked) => setFormData(p => ({ ...p, isFeatured: checked }))} />
              </div>
            ) : (
              <div className="text-sm text-gray-500">Yêu cầu nổi bật sẽ do quản trị viên phê duyệt.</div>
            )}
            <Separator />
            <div className="text-sm text-gray-500">
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Các trường có dấu * là bắt buộc</li>
                <li>Tour sẽ được tạo với trạng thái "Chờ duyệt"</li>
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      )}

      <div className="mt-0  bottom-0 bg-white border-t pt-3 flex justify-end space-x-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>Hủy</Button>
        )}
        <Button onClick={() => {
          if (!validate()) return;
          onSubmit({
            ...formData,
            includes: JSON.stringify(includesList),
            excludes: JSON.stringify(excludesList),
            itinerary: JSON.stringify(itineraryItems)
          });
        }}>{submitLabel || "Tạo Tour"}</Button>
      </div>
    </>
  );
};

export default CreateTourForm;


