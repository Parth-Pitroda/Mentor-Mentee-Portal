type QueryValue = string | number | boolean | null;

export type DatabaseQuery =
  | { type: "equal"; field: string; value: QueryValue | QueryValue[] }
  | { type: "limit"; value: number }
  | { type: "offset"; value: number }
  | { type: "orderAsc"; field: string }
  | { type: "orderDesc"; field: string };

export const Query = {
  equal(field: string, value: QueryValue | QueryValue[]): DatabaseQuery {
    return { type: "equal", field, value };
  },
  limit(value: number): DatabaseQuery {
    return { type: "limit", value };
  },
  offset(value: number): DatabaseQuery {
    return { type: "offset", value };
  },
  orderAsc(field: string): DatabaseQuery {
    return { type: "orderAsc", field };
  },
  orderDesc(field: string): DatabaseQuery {
    return { type: "orderDesc", field };
  },
};

export interface QueryOptions {
  equals?: Record<string, QueryValue | QueryValue[]>;
  limit?: number;
  offset?: number;
  orderByDesc?: string;
  orderByAsc?: string;
}

export interface IDatabaseService {
  getDocument<T>(collectionId: string, documentId: string): Promise<T>;
  listDocuments<T>(collectionId: string, options?: QueryOptions | DatabaseQuery[]): Promise<{ total: number; documents: T[] }>;
  createDocument<T>(collectionId: string, data: any, documentId?: string): Promise<T>;
  updateDocument<T>(collectionId: string, documentId: string, data: any): Promise<T>;
  deleteDocument(collectionId: string, documentId: string): Promise<void>;
}
