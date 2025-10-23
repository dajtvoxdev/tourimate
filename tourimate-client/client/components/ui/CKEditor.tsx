import React, { useRef, useEffect } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import { 
  ClassicEditor, 
  Essentials, 
  Paragraph, 
  Bold, 
  Italic, 
  Underline, 
  Link, 
  BlockQuote, 
  Undo, 
  SourceEditing,
  Image,
  ImageUpload,
  MediaEmbed,
  List,
  Heading
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';

interface CKEditorProps {
  data: string;
  onChange: (data: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  baseApiUrl?: string;
  authToken?: string;
}

// Custom upload adapter
class CkUploadAdapter {
  private loader: any;
  private base: string;
  private token?: string;

  constructor(loader: any, base: string, token?: string) {
    this.loader = loader;
    this.base = base;
    this.token = token;
  }

  upload() {
    return this.loader.file.then((file: File) => {
      return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${this.base}/api/media/upload`, true);
        
        if (this.token) {
          xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
        }

        xhr.onload = () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            resolve({
              default: response.url
            });
          } else {
            reject(new Error('Upload failed'));
          }
        };

        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(formData);
      });
    });
  }

  abort() {
    // Implement abort logic if needed
  }
}

const CustomCKEditor: React.FC<CKEditorProps> = ({
  data,
  onChange,
  placeholder = '',
  disabled = false,
  className = '',
  baseApiUrl = '',
  authToken = ''
}) => {
  const editorRef = useRef<any>(null);

  // Editor configuration following official docs
  const editorConfig = {
    licenseKey: 'GPL', // Using GPL license
    plugins: [
      Essentials,
      Paragraph,
      Heading,
      Bold,
      Italic,
      Underline,
      Link,
      BlockQuote,
      Undo,
      SourceEditing,
      Image,
      ImageUpload,
      MediaEmbed,
      List
    ],
    toolbar: [
      'heading',
      '|',
      'bold',
      'italic',
      'underline',
      'link',
      'bulletedList',
      'numberedList',
      'blockQuote',
      'imageUpload',
      'mediaEmbed',
      'undo',
      'redo',
      '|',
      'sourceEditing'
    ],
    language: 'vi',
    placeholder,
    image: {
      toolbar: [
        'imageTextAlternative',
        'imageStyle:inline',
        'imageStyle:block',
        'imageStyle:side'
      ]
    },
    onReady: (editor: any) => {
      editorRef.current = editor;
      
      // Set up custom upload adapter if baseApiUrl is provided
      if (baseApiUrl) {
        editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => 
          new CkUploadAdapter(loader, baseApiUrl, authToken);
      }
    }
  };

  return (
    <div className={`ckeditor-wrapper ${className}`}>
      <CKEditor
        editor={ClassicEditor}
        data={data}
        onChange={(event, editor) => {
          const data = editor.getData();
          onChange(data);
        }}
        config={editorConfig}
        disabled={disabled}
      />
    </div>
  );
};

export default CustomCKEditor;
