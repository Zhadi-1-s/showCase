import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Product,
  ProductPayload,
  ProductQuery,
  ProductResponse,
  ProductsListResponse,
  ProductStatus,
} from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private readonly http: HttpClient) {}

  getProducts(query: ProductQuery = {}): Observable<ProductsListResponse> {
    return this.http.get<ProductsListResponse>(`${environment.apiUrl}/products`, {
      params: this.toParams(query),
    });
  }

  getPublishedProducts(query: ProductQuery = {}): Observable<ProductsListResponse> {
    return this.http.get<ProductsListResponse>(
      `${environment.apiUrl}/products/published`,
      { params: this.toParams(query) },
    );
  }

  getPublishedProductById(id: string): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(
      `${environment.apiUrl}/products/published/${id}`,
    );
  }

  getProductById(id: string): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${environment.apiUrl}/products/${id}`);
  }

  createProduct(payload: ProductPayload): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(
      `${environment.apiUrl}/products`,
      payload,
    );
  }

  updateProduct(id: string, payload: Partial<ProductPayload>): Observable<ProductResponse> {
    return this.http.put<ProductResponse>(
      `${environment.apiUrl}/products/${id}`,
      payload,
    );
  }

  updateStatus(id: string, status: ProductStatus): Observable<ProductResponse> {
    return this.http.patch<ProductResponse>(
      `${environment.apiUrl}/products/${id}/status`,
      { status },
    );
  }

  updatePrice(id: string, price: number): Observable<ProductResponse> {
    return this.http.patch<ProductResponse>(
      `${environment.apiUrl}/products/${id}/price`,
      { price },
    );
  }

  deleteProduct(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${environment.apiUrl}/products/${id}`,
    );
  }

  deletePhoto(id: string, photoUrl: string): Observable<ProductResponse> {
    return this.http.patch<ProductResponse>(
      `${environment.apiUrl}/products/${id}/photos/delete`,
      { photoUrl },
    );
  }

  reorderPhotos(id: string, photoUrls: string[]): Observable<ProductResponse> {
    return this.http.patch<ProductResponse>(
      `${environment.apiUrl}/products/${id}/photos/reorder`,
      { photoUrls },
    );
  }

  private toParams(query: ProductQuery): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return params;
  }
}
