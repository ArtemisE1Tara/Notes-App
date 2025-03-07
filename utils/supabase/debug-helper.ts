/**
 * Helper functions for debugging Supabase issues
 */

export function logSupabaseError(error: any, operation: string) {
  console.error(`----------- Supabase ${operation} Error -----------`);
  console.error(`Code: ${error.code}`);
  console.error(`Message: ${error.message}`);
  console.error(`Details: ${error.details}`);
  console.error(`Hint: ${error.hint}`);
  console.error(`-------------------------------------------------`);
  
  // Return a readable error message
  return {
    code: error.code || 'UNKNOWN',
    message: error.message || 'Unknown error',
    details: error.details || null,
    hint: error.hint || null
  };
}

export function debugSupabaseConnection(
  supabaseUrl: string, 
  supabaseKey: string
) {
  // Check if URL is properly formatted
  try {
    new URL(supabaseUrl);
    console.log("✓ Supabase URL format is valid");
  } catch (e) {
    console.error("✗ Invalid Supabase URL format:", supabaseUrl);
    return false;
  }
  
  // Check if key is present
  if (!supabaseKey || supabaseKey.length < 10) {
    console.error("✗ Invalid or missing Supabase anon key");
    return false;
  }
  
  console.log("✓ Supabase credentials appear valid");
  return true;
}

export function safeJsonParse(data: string) {
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Failed to parse JSON:", e);
    return null;
  }
}
