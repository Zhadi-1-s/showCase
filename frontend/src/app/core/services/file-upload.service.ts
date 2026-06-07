import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UploadResponse {
  url: string;
}

export interface UploadMultipleResponse {
  urls: string[];
}

@Injectable({ providedIn: 'root' })
export class FileUploadService {
  constructor(private readonly http: HttpClient) {}

  uploadFile(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadResponse>(
      `${environment.apiUrl}/uploads`,
      formData,
    );
  }

  uploadMultiple(files: File[]): Observable<UploadMultipleResponse> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }
    return this.http.post<UploadMultipleResponse>(
      `${environment.apiUrl}/uploads/multiple`,
      formData,
    );
  }
}
