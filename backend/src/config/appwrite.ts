import { Account, Client, Databases, ID, Query, Storage, Users } from "node-appwrite";

const endpoint =
    process.env.APPWRITE_ENDPOINT ||
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
    "https://cloud.appwrite.io/v1";

const projectId =
    process.env.APPWRITE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;

const apiKey =
    process.env.APPWRITE_API_KEY ||
    process.env.NEXT_APPWRITE_KEY!;

export const APPWRITE_ENDPOINT = endpoint;
export const APPWRITE_PROJECT_ID = projectId;
export const APPWRITE_API_KEY = apiKey;

export const createAdminClient = () => {
    if (!projectId) {
        console.error("Appwrite project id is not set (APPWRITE_PROJECT_ID / NEXT_PUBLIC_APPWRITE_PROJECT_ID)");
    }
    if (!apiKey) {
        console.error("Appwrite API key is not set (APPWRITE_API_KEY / NEXT_APPWRITE_KEY)");
    }
    console.debug("Using Appwrite endpoint:", endpoint);
    return new Client()
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(apiKey);
};

export const createSessionClient = (sessionSecret: string) => {
    return new Client()
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setSession(sessionSecret);
};

export const client = createAdminClient();

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const users = new Users(client);

export const getAdminAccount = () => {
    return new Account(createAdminClient());
};

export const getAdminDatabase = () => {
    return new Databases(createAdminClient());
};

export const getAdminStorage = () => {
    return new Storage(createAdminClient());
};

export const getAdminUsers = () => {
    return new Users(createAdminClient());
};

export const getSessionAccount = (sessionSecret: string) => {
    return new Account(createSessionClient(sessionSecret));
};

export const getSessionDatabase = (sessionSecret: string) => {
    return new Databases(createSessionClient(sessionSecret));
};

export { ID, Query };
