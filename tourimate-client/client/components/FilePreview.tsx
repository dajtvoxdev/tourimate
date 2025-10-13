import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { File, Image, FileText, Download, Eye } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
// Configure pdf.js worker to bundled local file (avoids CORS)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface FilePreviewProps {
  files: string[];
  title?: string;
}

// Helper function to determine file type
const getFileType = (url: string): 'image' | 'pdf' | 'unknown' => {
  const extension = url.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
    return 'image';
  } else if (extension === 'pdf') {
    return 'pdf';
  }
  return 'unknown';
};

const FilePreview: React.FC<FilePreviewProps> = ({ files, title = "Tài liệu" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [numPagesByUrl, setNumPagesByUrl] = useState<Record<string, number>>({});
  const onDocumentLoadSuccess = (url: string) => (info: { numPages: number }) => {
    setNumPagesByUrl((prev) => ({ ...prev, [url]: info.numPages }));
  };
  const renderLoader = useMemo(() => (
    <div className="flex items-center justify-center h-full text-gray-500">
      <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-transparent rounded-full" />
    </div>
  ), []);

  if (!files || files.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        Không có tài liệu nào
      </div>
    );
  }

  const getFileIcon = (url: string) => {
    const type = getFileType(url);
    switch (type) {
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'pdf':
        return <FileText className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  const getFileTypeBadge = (url: string) => {
    const type = getFileType(url);
    switch (type) {
      case 'image':
        return <Badge variant="secondary" className="text-xs">Hình ảnh</Badge>;
      case 'pdf':
        return <Badge variant="default" className="text-xs">PDF</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">File</Badge>;
    }
  };

  const handleDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = url.split('/').pop() || 'file';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">{title}</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {files.map((file, index) => {
          const type = getFileType(file);
          return (
            <div key={index} className="relative group">
              <div className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  {getFileIcon(file)}
                  {getFileTypeBadge(file)}
                </div>
                
                {type === 'image' ? (
                  <div className="aspect-video bg-gray-100 rounded overflow-hidden">
                    <img 
                      src={file} 
                      alt={`Document ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : type === 'pdf' ? (
                  <div className="aspect-video bg-gray-100 rounded flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-100 rounded flex items-center justify-center">
                    <File className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                
                <div className="flex gap-1 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedIndex(index);
                      setIsOpen(true);
                    }}
                    className="flex-1"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Xem
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(file)}
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              {title} - {selectedIndex + 1} / {files.length}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            {files.length > 1 ? (
              <Carousel
                className="w-full"
                opts={{
                  startIndex: selectedIndex,
                }}
                setApi={(api) => {
                  if (api) {
                    api.on('select', () => {
                      setSelectedIndex(api.selectedScrollSnap());
                    });
                  }
                }}
              >
                <CarouselContent>
                  {files.map((file, index) => {
                    const type = getFileType(file);
                    return (
                      <CarouselItem key={index} className="flex justify-center">
                        <div className="w-full h-[70vh] overflow-hidden">
                          {type === 'image' ? (
                            <img 
                              src={file} 
                              alt={`Document ${index + 1}`}
                              className="w-full h-full object-contain"
                            />
                          ) : type === 'pdf' ? (
                            <div className="w-full h-full overflow-auto p-2">
                              <Document
                                file={file}
                                onLoadSuccess={onDocumentLoadSuccess(file)}
                                loading={renderLoader}
                                error={<div className="text-center text-red-500">Không thể tải PDF</div>}
                              >
                                {Array.from({ length: numPagesByUrl[file] || 1 }, (_, i) => (
                                  <div key={i} className="mb-4 flex justify-center">
                                    <Page pageNumber={i + 1} width={900} loading={renderLoader} renderTextLayer={false} renderAnnotationLayer={false} />
                                  </div>
                                ))}
                              </Document>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                              <File className="w-16 h-16 mb-4" />
                              <p>Không thể xem trước file này</p>
                              <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => handleDownload(file)}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Tải xuống
                              </Button>
                            </div>
                          )}
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            ) : (
              <div className="w-full h-[70vh] overflow-hidden">
                {(() => {
                  const file = files[0];
                  const type = getFileType(file);
                  
                  switch (type) {
                    case 'image':
                      return (
                        <img 
                          src={file} 
                          alt="Document"
                          className="w-full h-full object-contain"
                        />
                      );
                    case 'pdf':
                      return (
                        <div className="w-full h-full overflow-auto p-2">
                          <Document
                            file={file}
                            onLoadSuccess={onDocumentLoadSuccess(file)}
                            loading={renderLoader}
                            error={<div className="text-center text-red-500">Không thể tải PDF</div>}
                          >
                            {Array.from({ length: numPagesByUrl[file] || 1 }, (_, i) => (
                              <div key={i} className="mb-4 flex justify-center">
                                <Page pageNumber={i + 1} width={900} loading={renderLoader} renderTextLayer={false} renderAnnotationLayer={false} />
                              </div>
                            ))}
                          </Document>
                        </div>
                      );
                    default:
                      return (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                          <File className="w-16 h-16 mb-4" />
                          <p>Không thể xem trước file này</p>
                          <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => handleDownload(files[0])}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Tải xuống
                          </Button>
                        </div>
                      );
                  }
                })()}
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex gap-2">
              {files.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === selectedIndex ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            
            <div className="flex gap-2">
              {files.map((file, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(file)}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Tải {index + 1}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FilePreview;