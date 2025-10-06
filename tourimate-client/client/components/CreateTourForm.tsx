import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import CkUploadAdapter from "../src/components/CkUploadAdapter";
import { useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

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
  difficulty: string;
  imageUrls?: string[];
  itinerary?: string;
  includes?: string;
  excludes?: string;
  terms?: string;
  isFeatured: boolean;
  divisionCode?: number;
};

interface Props {
  initial?: Partial<CreateTourPayload>;
  onSubmit: (payload: CreateTourPayload) => void;
  onCancel?: () => void;
  onUploadImages?: (files: File[]) => Promise<string[]>; // returns urls
}

type ItineraryItem = { day: number; title: string; description: string };

const CreateTourForm: React.FC<Props> = ({ initial, onSubmit, onCancel, onUploadImages }) => {
  const [formData, setFormData] = useState<CreateTourPayload>({
    title: initial?.title || "",
    description: initial?.description || "",
    shortDescription: initial?.shortDescription || "",
    location: initial?.location || "",
    duration: initial?.duration ?? 1,
    maxParticipants: initial?.maxParticipants ?? 10,
    price: initial?.price ?? 0,
    currency: initial?.currency || "VND",
    category: initial?.category || "",
    difficulty: initial?.difficulty || "Easy",
    imageUrls: initial?.imageUrls || [],
    itinerary: initial?.itinerary || "",
    includes: initial?.includes || "",
    excludes: initial?.excludes || "",
    terms: initial?.terms || "",
    isFeatured: initial?.isFeatured ?? false,
  });
  const [uploading, setUploading] = useState(false);
  const [divisions, setDivisions] = useState<Array<{ code: number; name: string }>>([]);
  const [wards, setWards] = useState<Array<{ code: number; name: string }>>([]);
  const [selectedProvince, setSelectedProvince] = useState<number | undefined>(undefined);
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
        const res = await fetch(((import.meta as any).env?.VITE_API_BASE_URL || "https://localhost:7181") + "/api/divisions");
        if (!res.ok) return;
        const data = await res.json();
        const provinces = (data || []).filter((d: any) => (d.parentCode ?? d.ParentCode) == null);
        setDivisions(provinces.map((d: any) => ({ code: d.code ?? d.Code, name: d.name ?? d.Name })));
      } catch {
        // non-blocking
      }
    };
    loadDivisions();
  }, []);

  useEffect(() => {
    const loadWards = async (provinceCode: number) => {
      try {
        const base = ((import.meta as any).env?.VITE_API_BASE_URL || "https://localhost:7181");
        const res = await fetch(`${base}/api/divisions/wards?provinceCode=${provinceCode}`);
        if (!res.ok) { setWards([]); return; }
        const data = await res.json();
        setWards((data || []).map((d: any) => ({ code: d.code ?? d.Code, name: d.name ?? d.Name })));
      } catch {
        setWards([]);
      }
    };
    if (selectedProvince) loadWards(selectedProvince);
    else setWards([]);
  }, [selectedProvince]);

  return (
    <>
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
              <Label htmlFor="title">Tên Tour *</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="Nhập tên tour" />
            </div>
            <div className="col-span-2">
              <Label htmlFor="shortDescription">Mô tả ngắn *</Label>
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
            </div>
            {/* Row: Tỉnh/Thành phố - Phường/Xã - Địa điểm chi tiết */}
            <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="division">Tỉnh/Thành phố</Label>
                <Select value={selectedProvince?.toString() ?? ""} onValueChange={(value) => {
                  const code = value ? parseInt(value) : undefined;
                  setSelectedProvince(code);
                  setFormData(p => ({ ...p, divisionCode: code, provinceCode: code, wardCode: undefined } as any));
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn tỉnh/thành" />
                  </SelectTrigger>
                  <SelectContent>
                    {divisions.map(d => (
                      <SelectItem key={d.code} value={String(d.code)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ward">Phường/Xã</Label>
                <Select value={formData.wardCode ? String(formData.wardCode) : ""}
                  onValueChange={(value) => setFormData(p => ({ ...p, wardCode: value ? parseInt(value) : undefined, divisionCode: value ? parseInt(value) : selectedProvince } as any))}>
                  <SelectTrigger>
                    <SelectValue placeholder={selectedProvince ? (wards.length ? "Chọn phường/xã" : "Không có dữ liệu") : "Chọn tỉnh trước"} />
                  </SelectTrigger>
                  <SelectContent>
                    {wards.map(w => (
                      <SelectItem key={w.code} value={String(w.code)}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location">Địa điểm chi tiết *</Label>
                <Input id="location" value={formData.location} onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))} placeholder="Ví dụ: 123 Phố Huế, Hai Bà Trưng" />
              </div>
            </div>
            {/* Row(s): Danh mục - Thời gian - Số người tối đa - Giá - Tiền tệ - Độ khó (3 cột) */}
            <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="category">Danh mục *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(p => ({ ...p, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adventure">Phiêu lưu</SelectItem>
                    <SelectItem value="cultural">Văn hóa</SelectItem>
                    <SelectItem value="nature">Thiên nhiên</SelectItem>
                    <SelectItem value="food">Ẩm thực</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="duration">Thời gian (ngày) *</Label>
                <Input id="duration" type="number" min={1} value={formData.duration} onChange={(e) => setFormData(p => ({ ...p, duration: parseInt(e.target.value) || 1 }))} />
              </div>
              <div>
                <Label htmlFor="maxParticipants">Số người tối đa *</Label>
                <Input id="maxParticipants" type="number" min={1} value={formData.maxParticipants} onChange={(e) => setFormData(p => ({ ...p, maxParticipants: parseInt(e.target.value) || 1 }))} />
              </div>
              <div>
                <Label htmlFor="price">Giá *</Label>
                <Input id="price" type="number" min={0} step="1000" value={formData.price} onChange={(e) => setFormData(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label htmlFor="currency">Tiền tệ</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData(p => ({ ...p, currency: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VND">VND</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="difficulty">Độ khó *</Label>
                <Select value={formData.difficulty} onValueChange={(value) => setFormData(p => ({ ...p, difficulty: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Dễ</SelectItem>
                    <SelectItem value="Moderate">Trung bình</SelectItem>
                    <SelectItem value="Challenging">Khó</SelectItem>
                    <SelectItem value="Expert">Chuyên gia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label>Hình ảnh</Label>
              <Input type="file" accept="image/*" multiple onChange={handleFiles} />
              <div className="mt-3 flex flex-wrap gap-3">
                {(formData.imageUrls || []).map(url => (
                  <img key={url} src={url} alt="preview" className="w-20 h-20 object-cover rounded-lg border" />
                ))}
              </div>
              {uploading && <div className="text-sm text-gray-500 mt-2">Đang tải ảnh...</div>}
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
                      <Textarea id={`desc-${index}`} rows={3} value={item.description} onChange={(e) => setItineraryItems(prev => prev.map((it, i) => i === index ? { ...it, description: e.target.value } : it))} placeholder="Lịch trình chi tiết trong ngày" />
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
                    }}
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
                const res = await fetch(`${baseApiUrl}/api/media/upload`, { method: 'POST', headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : undefined, body: form });
                if (!res.ok) return;
                const data = await res.json();
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
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isFeatured">Tour nổi bật</Label>
                <p className="text-sm text-gray-500">Hiển thị tour này ở vị trí nổi bật</p>
              </div>
              <Switch id="isFeatured" checked={formData.isFeatured} onCheckedChange={(checked) => setFormData(p => ({ ...p, isFeatured: checked }))} />
            </div>
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

      <div className="mt-0  bottom-0 bg-white border-t pt-3 flex justify-end space-x-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>Hủy</Button>
        )}
        <Button onClick={() => onSubmit({
          ...formData,
          includes: JSON.stringify(includesList),
          excludes: JSON.stringify(excludesList),
          itinerary: JSON.stringify(itineraryItems)
        })}>Tạo Tour</Button>
      </div>
    </>
  );
};

export default CreateTourForm;


