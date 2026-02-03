// User types
export interface User {
  id: string;
  email: string;
  role: string;
  phoneNumber?: string;
  emailVerified: boolean;
  kycStatus: string;
  createdAt: Date;
}

// Session types
export interface Session {
  id: string;
  userId: string;
  refreshToken: string;
  expiresAt: Date;
}
