// Utility functions for handling MongoDB queries safely in production

/**
 * Safely converts MongoDB query result to array
 * Handles cases where Vercel/production environment returns different types
 */
export async function toArray<T>(queryResult: any): Promise<T[]> {
  try {
    // If it's already an array, return it
    if (Array.isArray(queryResult)) {
      return queryResult;
    }
    
    // If it has a toArray method (cursor), call it
    if (queryResult && typeof queryResult.toArray === 'function') {
      const result = await queryResult.toArray();
      return Array.isArray(result) ? result : [];
    }
    
    // If it's a promise, await it first
    if (queryResult && typeof queryResult.then === 'function') {
      const resolved = await queryResult;
      return Array.isArray(resolved) ? resolved : [];
    }
    
    // If it's a single document, wrap in array
    if (queryResult && typeof queryResult === 'object') {
      return [queryResult];
    }
    
    console.error('MongoDB query result is not array-like:', typeof queryResult, queryResult);
    return [];
  } catch (error) {
    console.error('Error converting MongoDB result to array:', error);
    return [];
  }
}

/**
 * Safely maps over MongoDB results with error handling
 */
export async function safeMap<T, R>(
  queryResult: any, 
  mapFn: (item: T, index: number) => R
): Promise<R[]> {
  try {
    const array = await toArray<T>(queryResult);
    return array.map(mapFn);
  } catch (error) {
    console.error('Error in safeMap:', error);
    if (error instanceof TypeError && error.message.includes('map')) {
      console.error('Map error details:', {
        message: error.message,
        stack: error.stack,
        queryResultType: typeof queryResult,
        queryResult: queryResult
      });
    }
    return [];
  }
}

/**
 * Safely transforms MongoDB document to plain object
 */
export function safeToObject(doc: any): any {
  try {
    if (!doc) return {};
    
    // If it has toObject method, use it
    if (typeof doc.toObject === 'function') {
      return doc.toObject();
    }
    
    // If it has toJSON method, use it
    if (typeof doc.toJSON === 'function') {
      return doc.toJSON();
    }
    
    // If it's already a plain object, return it
    if (typeof doc === 'object' && doc.constructor === Object) {
      return doc;
    }
    
    // Try to convert using JSON serialization
    return JSON.parse(JSON.stringify(doc));
  } catch (error) {
    console.error('Error converting document to object:', error, doc);
    return {};
  }
}