import { createDb } from './kysely';

function getConnectionString() {
  const isTest = process.env.NODE_ENV === "test";

  const connectionString = isTest 
    ? process.env.TEST_DATABASE_URL 
    : process.env.DATABASE_URL; 

  if (!connectionString) { 
    throw new Error(
      isTest 
        ? "Missing TEST_DATABASE_URL" 
        : "Missing DATABASE_URL" ); 
  }

  return connectionString
}

export const db = createDb(getConnectionString())