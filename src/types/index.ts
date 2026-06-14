export type UserRole = 'ADMIN' | 'CUSTOMER' | 'DEALER' | 'EMPLOYEE';

export type DealerStatus = 'Pending' | 'Approved' | 'Rejected' | 'Blocked';

export type EmployeeStatus = 'Active' | 'Inactive' | 'Suspended';

export interface UserSessionProfile {
  userId: string;
  role: UserRole;
  email?: string;
  mobileNumber?: string;
  status: string;
}

export interface CustomerProfile {
  customerId: string;
  userId: string;
  fullName: string;
  email?: string;
  mobile: string;
  city: string;
  profileStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface DealerProfile {
  dealerId: string;
  userId: string;
  companyName: string;
  ownerName: string;
  address: string;
  reraNumber?: string;
  gstNumber?: string;
  experienceYears: number;
  trustScore: number;
  dealerStatus: DealerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeProfile {
  employeeId: string;
  userId: string;
  employeeName: string;
  designation: string;
  employeeStatus: EmployeeStatus;
  joiningDate: string;
  createdAt: string;
  updatedAt: string;
}
