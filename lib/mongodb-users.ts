import { AppUser, UserRole } from '@/types/admin';
import { ObjectId } from 'mongodb';
import { getCollection } from './mongodb';

// Re-export AppUser for other modules
export type { AppUser, UserRole } from '@/types/admin';

export interface UserPermissions {
  canManageUsers: boolean;
  canViewReports: boolean;
  canManageWhatsApp: boolean;
  canManageAI: boolean;
  canViewAllChats: boolean;
  canManageCompany: boolean;
}

export interface Company {
  _id?: string;
  name: string;
  settings: {
    timezone: string;
    businessHours: {
      start: string;
      end: string;
      days: number[];
    };
    features: {
      aiEnabled: boolean;
      whatsappEnabled: boolean;
      analyticsEnabled: boolean;
    };
  };
  adminUsers: string[]; // Array de user IDs
  attendantUsers: string[]; // Array de user IDs
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// User Management Functions
export async function createUser(userData: Omit<AppUser, '_id' | 'createdAt'>) {
  const collection = await getCollection('users');
  const result = await collection.insertOne({
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return result.insertedId.toString();
}

export async function getUserByFirebaseAuthUid(firebaseAuthUid: string): Promise<AppUser | null> {
  const collection = await getCollection('users');
  const user = await collection.findOne({ firebaseAuthUid });
  return user ? { ...user, _id: user._id.toString() } as AppUser : null;
}

export async function getUserById(userId: string): Promise<AppUser | null> {
  const collection = await getCollection('users');
  const user = await collection.findOne({ _id: new ObjectId(userId) });
  return user ? { ...user, _id: user._id.toString() } as AppUser : null;
}

export async function updateUser(userId: string, updateData: Partial<AppUser>) {
  const collection = await getCollection('users');
  await collection.updateOne(
    { _id: new ObjectId(userId) },
    { 
      $set: { 
        ...updateData, 
        updatedAt: new Date() 
      } 
    }
  );
}

export async function deleteUser(userId: string) {
  const collection = await getCollection('users');
  await collection.deleteOne({ _id: new ObjectId(userId) });
}

export async function getUsersByCompany(companyId: string): Promise<AppUser[]> {
  const collection = await getCollection('users');
  const users = await collection.find({ companyId, isActive: true }).toArray();
  return users.map(user => ({ ...user, _id: user._id.toString() })) as AppUser[];
}

export async function getUsersByRole(role: UserRole, companyId?: string): Promise<AppUser[]> {
  const collection = await getCollection('users');
  const query: any = { role, isActive: true };
  if (companyId) query.companyId = companyId;
  
  const users = await collection.find(query).toArray();
  return users.map(user => ({ ...user, _id: user._id.toString() })) as AppUser[];
}

// Company Management Functions
export async function createCompany(companyData: Omit<Company, '_id' | 'createdAt' | 'updatedAt'>) {
  const collection = await getCollection('companies');
  const result = await collection.insertOne({
    ...companyData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return result.insertedId.toString();
}

export async function getCompanyById(companyId: string): Promise<Company | null> {
  const collection = await getCollection('companies');
  const company = await collection.findOne({ _id: new ObjectId(companyId) });
  return company ? { ...company, _id: company._id.toString() } as Company : null;
}

export async function updateCompany(companyId: string, updateData: Partial<Company>) {
  const collection = await getCollection('companies');
  await collection.updateOne(
    { _id: new ObjectId(companyId) },
    { 
      $set: { 
        ...updateData, 
        updatedAt: new Date() 
      } 
    }
  );
}

// Permission Management Functions
export async function getUserPermissions(userId: string): Promise<UserPermissions> {
  const user = await getUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Default permissions based on role
  const defaultPermissions: Record<UserRole, UserPermissions> = {
    admin: {
      canManageUsers: true,
      canViewReports: true,
      canManageWhatsApp: true,
      canManageAI: true,
      canViewAllChats: true,
      canManageCompany: true,
    },
    attendant: {
      canManageUsers: false,
      canViewReports: false,
      canManageWhatsApp: false,
      canManageAI: false,
      canViewAllChats: true,
      canManageCompany: false,
    },
  };

  return defaultPermissions[user.role];
}

export async function canUserAccess(userId: string, permission: keyof UserPermissions): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions[permission];
}

// User Status Management
export async function updateUserStatus(userId: string, isActive: boolean) {
  await updateUser(userId, { isActive });
}

export async function getUserByEmail(email: string): Promise<AppUser | null> {
  const collection = await getCollection('users');
  const user = await collection.findOne({ email });
  return user ? { ...user, _id: user._id.toString() } as AppUser : null;
}

// Company User Management
export async function addUserToCompany(userId: string, companyId: string, role: UserRole) {
  // Update user
  await updateUser(userId, { companyId, role });
  
  // Update company
  const collection = await getCollection('companies');
  const field = role === 'admin' ? 'adminUsers' : 'attendantUsers';
  await collection.updateOne(
    { _id: new ObjectId(companyId) },
    { $addToSet: { [field]: userId } }
  );
}

export async function removeUserFromCompany(userId: string, companyId: string) {
  // Update company
  const collection = await getCollection('companies');
  
  // Remove from adminUsers array
  await collection.updateOne(
    { _id: new ObjectId(companyId) },
    { 
      $pull: { 
        adminUsers: userId
      } 
    } as any
  );
  
  // Remove from attendantUsers array
  await collection.updateOne(
    { _id: new ObjectId(companyId) },
    { 
      $pull: { 
        attendantUsers: userId
      } 
    } as any
  );
}
