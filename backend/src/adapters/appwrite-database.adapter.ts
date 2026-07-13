import { Databases, ID, Query } from "node-appwrite";
import { DatabaseQuery, IDatabaseService, QueryOptions } from "../interface/database.interface";

// This class acts as an adapter to interact with the Appwrite database.
// It implements the IDatabaseService interface to ensure it provides the required methods.
export class AppwriteDatabaseAdapter implements IDatabaseService {
  private databases: Databases; // Instance of the Appwrite Databases class
  private databaseId: string; // The ID of the Appwrite database, fetched from environment variables

  constructor(client: any) {
    this.databases = new Databases(client);
    this.databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
  }


  // Fetches a single document from a specific collection by its ID
  async getDocument<T>(collectionId: string, documentId: string): Promise<T> {
    try {
      const doc = await this.databases.getDocument(this.databaseId, collectionId, documentId);
      return doc as unknown as T; // generic type T
    } catch (error) {
      console.error(`Error fetching document with ID ${documentId} from collection ${collectionId}:`, error);
      throw error; 
    }
  }

 // Fetches multiple documents from a collection with optional query parameters
  async listDocuments<T>(collectionId: string, options?: QueryOptions | DatabaseQuery[]): Promise<{ total: number; documents: T[] }> {
  try {
    const queries = Array.isArray(options) ? this.toAppwriteQueries(options) : this.toAppwriteQueriesFromOptions(options);
    const result = await this.databases.listDocuments(this.databaseId, collectionId, queries);
    return {
      total: result.total, 
      documents: result.documents as unknown as T[], // Casts the documents to the generic type T
    };
  } catch (error) {
    console.error(`Error listing documents from collection ${collectionId}:`, error);
    throw error; 
  }
}

  // Converts QueryOptions into Appwrite-compatible query strings
  private toAppwriteQueriesFromOptions(options?: QueryOptions): string[] {
    const queries: string[] = [];
    if (options?.equals) {
      // Adds equality filters to the query
      Object.entries(options.equals).forEach(([key, val]) => {
        queries.push(Query.equal(key, Array.isArray(val) ? val : [val]));
      });
    }

    // Adds descending order filter
    if (options?.orderByDesc) {
      queries.push(Query.orderDesc(options.orderByDesc));
    }

    // Adds ascending order filter
    if (options?.orderByAsc) {
      queries.push(Query.orderAsc(options.orderByAsc));
    }

    // Adds a limit to the number of documents fetched
    if (options?.limit) {
      queries.push(Query.limit(options.limit));
    }

    // Adds an offset for pagination
    if (typeof options?.offset === "number") {
      queries.push(Query.offset(options.offset));
    }

    return queries; // Returns the constructed query strings
  }

  // Converts an array of DatabaseQuery objects into Appwrite-compatible query strings
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

  // Creates a new document in a collection
  async createDocument<T>(collectionId: string, data: any, documentId?: string): Promise<T> {
    try {
      const id = documentId || ID.unique(); // Generates a unique ID if none is provided
      const doc = await this.databases.createDocument(this.databaseId, collectionId, id, data);
      return doc as unknown as T; 
    } catch (error) {
      console.error(`Error creating document in collection ${collectionId}:`, error);
      throw error; 
    }
  }


  // Updates an existing document in a collection
  async updateDocument<T>(collectionId: string, documentId: string, data: any): Promise<T> {
    try {
      const doc = await this.databases.updateDocument(this.databaseId, collectionId, documentId, data);
      return doc as unknown as T; 
    } catch (error) {
      console.error(`Error updating document with ID ${documentId} in collection ${collectionId}:`, error);
      throw error; 
    }
  }
    // Deletes a document from a collection
    async deleteDocument(collectionId: string, documentId: string): Promise<void> {
      try {
        await this.databases.deleteDocument(this.databaseId, collectionId, documentId);
      } catch (error) {
        console.error(`Error deleting document with ID ${documentId} from collection ${collectionId}:`, error);
        throw error; 
      }
    }
}