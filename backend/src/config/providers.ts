import { createAdminClient, createSessionClient } from "./appwrite";
import { AppwriteDatabaseAdapter } from "../adapters/appwrite-database.adapter";
import { AppwriteStorageAdapter } from "../adapters/appwrite-storage.adapter";
import { AppwriteAuthAdapter } from "../adapters/appwrite-auth.adapter";
import { IDatabaseService } from "../interface/database.interface";
import { IStorageService } from "../interface/storage.interface";
import { IAuthService } from "../interface/auth.interface";

class ServiceContainer {
  private dbAdapter: IDatabaseService;
  private storageAdapter: IStorageService;
  private authAdapter: IAuthService;

  constructor() {
    const client = createAdminClient();
    this.dbAdapter = new AppwriteDatabaseAdapter(client);
    this.storageAdapter = new AppwriteStorageAdapter(client);
    this.authAdapter = new AppwriteAuthAdapter(client, createSessionClient);
  }

  getDatabaseService(): IDatabaseService {
    return this.dbAdapter;
  }

  getSessionDatabaseService(sessionSecret: string): IDatabaseService {
    return new AppwriteDatabaseAdapter(createSessionClient(sessionSecret));
  }

  getStorageService(): IStorageService {
    return this.storageAdapter;
  }

  getAuthService(): IAuthService {
    return this.authAdapter;
  }
}

export const servicesContainer = new ServiceContainer();
