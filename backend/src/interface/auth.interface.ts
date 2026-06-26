export interface IAuthService {
  createUser(email: string, name: string, role: string, password?: string): Promise<{ userId: string }>;
  createEmailPasswordSession(email: string, password: string): Promise<{ sessionSecret: string; userId: string }>;
  getSessionUser(sessionSecret: string): Promise<any>;
  deleteCurrentSession(sessionSecret: string): Promise<void>;
}
