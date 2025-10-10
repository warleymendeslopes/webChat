import { User as FirebaseUser } from 'firebase/auth';

export interface UserPermissions {
  canManageUsers: boolean;
  canViewReports: boolean;
  canManageWhatsApp: boolean;
  canManageAI: boolean;
  canViewAllChats: boolean;
  canManageCompany: boolean;
}

export interface AuthUser {
  _id: string;
  firebaseAuthUid: string;
  email: string;
  name: string;
  role: 'admin' | 'attendant';
  companyId: string;
  createdAt: Date;
  isActive: boolean;
  permissions: UserPermissions;
}

export class AuthService {
  private static instance: AuthService;
  private currentUser: AuthUser | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async authenticateUser(firebaseUser: FirebaseUser): Promise<AuthUser | null> {
    try {
      // Call server API to get user data
      const response = await fetch('/api/auth/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseAuthUid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
        }),
      });

      if (!response.ok) {
        console.error('Failed to authenticate user:', response.statusText);
        return null;
      }

      const { user } = await response.json();
      this.currentUser = user;
      return user;
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  async getUserPermissions(userId: string): Promise<UserPermissions> {
    // Default permissions for client-side
    return {
      canManageUsers: true,
      canViewReports: true,
      canManageWhatsApp: true,
      canManageAI: true,
      canViewAllChats: true,
      canManageCompany: true,
    };
  }

  async checkPermission(permission: keyof UserPermissions): Promise<boolean> {
    if (!this.currentUser) {
      return false;
    }

    return this.currentUser.permissions[permission];
  }

  async hasPermission(permission: keyof UserPermissions): Promise<boolean> {
    return this.checkPermission(permission);
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  isAttendant(): boolean {
    return this.currentUser?.role === 'attendant';
  }

  getCompanyId(): string | null {
    return this.currentUser?.companyId || null;
  }

  getUserId(): string | null {
    return this.currentUser?._id || null;
  }

  logout(): void {
    this.currentUser = null;
  }

  // Middleware helper for API routes
  async validateRequest(request: Request): Promise<AuthUser | null> {
    try {
      // Get Firebase token from request
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
      }

      const token = authHeader.split('Bearer ')[1];
      
      // For now, we'll use a simple approach without firebase-admin
      // In production, you should implement proper token verification
      console.warn('Token validation not implemented - using mock validation');
      
      // Return mock user for now
      return {
        _id: 'temp-id',
        firebaseAuthUid: 'temp-uid',
        email: 'temp@example.com',
        name: 'Temp User',
        role: 'admin',
        companyId: 'temp-company',
        createdAt: new Date(),
        isActive: true,
        permissions: {
          canManageUsers: true,
          canViewReports: true,
          canManageWhatsApp: true,
          canManageAI: true,
          canViewAllChats: true,
          canManageCompany: true,
        }
      };
    } catch (error) {
      console.error('Request validation error:', error);
      return null;
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
