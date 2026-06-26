import { Account, Client, Users, ID } from "node-appwrite";
import { IAuthService } from "../interface/auth.interface";

export class AppwriteAuthAdapter implements IAuthService {
  private users: Users;
  private account: Account;
  private createSessionClient: (sessionSecret: string) => Client;

  constructor(client: Client, createSessionClient: (sessionSecret: string) => Client) {
    this.users = new Users(client);
    this.account = new Account(client);
    this.createSessionClient = createSessionClient;
  }

  async createUser(email: string, name: string, _role: string, password = "Pdeu@2026"): Promise<{ userId: string }> {
    const user = await this.users.create(
      ID.unique(),
      email,
      undefined,
      password,
      name
    );
    return { userId: user.$id };
  }

  async createEmailPasswordSession(email: string, password: string): Promise<{ sessionSecret: string; userId: string }> {
    const session = await this.account.createEmailPasswordSession(email, password);
    return { sessionSecret: session.secret, userId: session.userId };
  }

  async getSessionUser(sessionSecret: string): Promise<any> {
    const sessionAccount = new Account(this.createSessionClient(sessionSecret));
    return sessionAccount.get();
  }

  async deleteCurrentSession(sessionSecret: string): Promise<void> {
    const sessionAccount = new Account(this.createSessionClient(sessionSecret));
    await sessionAccount.deleteSession("current");
  }
}
