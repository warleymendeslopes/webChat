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
  private authenticatingUsers: Set<string> = new Set();
  private userCache: Map<string, AuthUser | null> = new Map();

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async authenticateUser(firebaseUser: FirebaseUser): Promise<AuthUser | null> {
    // Verificar cache primeiro
    if (this.userCache.has(firebaseUser.uid)) {
      return this.userCache.get(firebaseUser.uid) || null;
    }

    // Evitar múltiplas autenticações simultâneas do mesmo usuário
    if (this.authenticatingUsers.has(firebaseUser.uid)) {
      return null;
    }

    this.authenticatingUsers.add(firebaseUser.uid);

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
        this.userCache.set(firebaseUser.uid, null);
        return null;
      }

      const { user } = await response.json();
      this.currentUser = user;
      this.userCache.set(firebaseUser.uid, user);
      return user;
    } catch (error) {
      console.error('Authentication error:', error);
      this.userCache.set(firebaseUser.uid, null);
      return null;
    } finally {
      this.authenticatingUsers.delete(firebaseUser.uid);
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
    this.userCache.clear();
    this.authenticatingUsers.clear();
  }

  // Middleware helper for API routes
  async validateRequest(request: Request): Promise<AuthUser | null> {
    try {
      // Get Firebase token from request
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('No authorization header found');
        return null;
      }

      const token = authHeader.split('Bearer ')[1];
      
      // TODO: Implement proper Firebase Admin SDK token verification
      // For now, we'll use a simple approach without firebase-admin
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
