export default class CkUploadAdapter {
  private loader: any;
  private baseUrl: string;
  private token?: string;

  constructor(loader: any, baseUrl: string, token?: string) {
    this.loader = loader;
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.token = token;
  }

  upload() {
    return this.loader.file.then((file: File) => new Promise((resolve, reject) => {
      const form = new FormData();
      form.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${this.baseUrl}/api/media/upload`, true);
      if (this.token) xhr.setRequestHeader("Authorization", `Bearer ${this.token}`);

      xhr.responseType = "json";
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const url = xhr.response?.url || xhr.response?.URL || xhr.response?.Url;
          resolve({ default: url });
        } else {
          reject(xhr.response?.message || `Upload failed (${xhr.status})`);
        }
      };
      xhr.onerror = () => reject("Network error");
      xhr.send(form);
    }));
  }

  abort() {
    // no-op; CKEditor will drop the upload
  }
}


