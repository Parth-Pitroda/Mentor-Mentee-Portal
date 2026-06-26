import { Databases, ID, Query } from "node-appwrite";
import { DatabaseQuery, IDatabaseService, QueryOptions } from "../interface/database.interface";

export class AppwriteDatabaseAdapter implements IDatabaseService {
  private databases: Databases;
  private databaseId: string;

  constructor(client: any) {
    this.databases = new Databases(client);
    this.databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
  }

  async getDocument<T>(collectionId: string, documentId: string): Promise<T> {
    const doc = await this.databases.getDocument(this.databaseId, collectionId, documentId);
    return doc as unknown as T;
  }

  async listDocuments<T>(collectionId: string, options?: QueryOptions | DatabaseQuery[]): Promise<{ total: number; documents: T[] }> {
    const queries = Array.isArray(options) ? this.toAppwriteQueries(options) : this.toAppwriteQueriesFromOptions(options);

    const result = await this.databases.listDocuments(this.databaseId, collectionId, queries);
    return {
      total: result.total,
      documents: result.documents as unknown as T[],
    };
  }

  private toAppwriteQueriesFromOptions(options?: QueryOptions): string[] {
    const queries: string[] = [];
    if (options?.equals) {
      Object.entries(options.equals).forEach(([key, val]) => {
        queries.push(Query.equal(key, Array.isArray(val) ? val : [val]));
      });
    }

    if (options?.orderByDesc) {
      queries.push(Query.orderDesc(options.orderByDesc));
    }

    if (options?.orderByAsc) {
      queries.push(Query.orderAsc(options.orderByAsc));
    }

    if (options?.limit) {
      queries.push(Query.limit(options.limit));
    }

    if (typeof options?.offset === "number") {
      queries.push(Query.offset(options.offset));
    }

    return queries;
  }

  private toAppwriteQueries(queryDescriptions: DatabaseQuery[]): string[] {
    return queryDescriptions.map((query) => {
      switch (query.type) {
        case "equal":
          return Query.equal(query.field, Array.isArray(query.value) ? query.value : [query.value]);
        case "limit":
          return Query.limit(query.value);
        case "offset":
          return Query.offset(query.value);
        case "orderAsc":
          return Query.orderAsc(query.field);
        case "orderDesc":
          return Query.orderDesc(query.field);
      }
    });
  }

  async createDocument<T>(collectionId: string, data: any, documentId?: string): Promise<T> {
    const id = documentId || ID.unique();
    const doc = await this.databases.createDocument(this.databaseId, collectionId, id, data);
    return doc as unknown as T;
  }

  async updateDocument<T>(collectionId: string, documentId: string, data: any): Promise<T> {
    const doc = await this.databases.updateDocument(this.databaseId, collectionId, documentId, data);
    return doc as unknown as T;
  }

  async deleteDocument(collectionId: string, documentId: string): Promise<void> {
    await this.databases.deleteDocument(this.databaseId, collectionId, documentId);
  }
}
