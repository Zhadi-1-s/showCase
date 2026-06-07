import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Branch,
  BranchPayload,
  BranchResponse,
  BranchesResponse,
} from '../models/branch.model';

@Injectable({ providedIn: 'root' })
export class BranchService {
  constructor(private readonly http: HttpClient) {}

  getBranches(): Observable<Branch[]> {
    return this.http
      .get<BranchesResponse>(`${environment.apiUrl}/branches`)
      .pipe(map((res) => res.branches));
  }

  getAllBranchesAdmin(): Observable<Branch[]> {
    return this.http
      .get<BranchesResponse>(`${environment.apiUrl}/branches/all`)
      .pipe(map((res) => res.branches));
  }

  getBranchById(id: string): Observable<BranchResponse> {
    return this.http.get<BranchResponse>(`${environment.apiUrl}/branches/${id}`);
  }

  createBranch(payload: BranchPayload): Observable<BranchResponse> {
    return this.http.post<BranchResponse>(
      `${environment.apiUrl}/branches`,
      payload,
    );
  }

  updateBranch(id: string, payload: Partial<BranchPayload>): Observable<BranchResponse> {
    return this.http.put<BranchResponse>(
      `${environment.apiUrl}/branches/${id}`,
      payload,
    );
  }

  setBranchActive(id: string, isActive: boolean): Observable<BranchResponse> {
    return this.http.patch<BranchResponse>(
      `${environment.apiUrl}/branches/${id}/active`,
      { isActive },
    );
  }

  deleteBranch(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${environment.apiUrl}/branches/${id}`,
    );
  }
}
