export interface Branch {
  _id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  workingHours?: string;
  isActive: boolean;
  productCount?: number;
}

export interface BranchPayload {
  name: string;
  address: string;
  phone: string;
  email?: string;
  workingHours?: string;
  isActive?: boolean;
}

export interface BranchResponse {
  branch: Branch;
  productCount?: number;
}

export interface BranchesResponse {
  branches: Branch[];
}
