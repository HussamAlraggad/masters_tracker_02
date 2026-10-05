/**
 * Firecrawl API Client
 * Handles communication with Firecrawl API
 */

const FIRECRAWL_API_URL = 'https://api.firecrawl.dev/v1';
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

export interface FirecrawlInteractRequest {
  url: string;
  prompt: string;
  timeout?: number;
}

export interface FirecrawlInteractResponse {
  success: boolean;
  output?: string;
  error?: string;
  sessionId?: string;
}

/**
 * Call Firecrawl's interact API
 * This handles ASP.NET postbacks and complex navigation
 */
export async function firecrawlInteract(
  request: FirecrawlInteractRequest
): Promise<FirecrawlInteractResponse> {
  if (!FIRECRAWL_API_KEY) {
    return {
      success: false,
      error: 'FIRECRAWL_API_KEY not configured. Please add it to your environment variables.',
    };
  }
  
  try {
    const response = await fetch(`${FIRECRAWL_API_URL}/interact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url: request.url,
        prompt: request.prompt,
        timeout: request.timeout || 300000,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: `Firecrawl API error: ${response.status} - ${errorData.error || response.statusText}`,
      };
    }
    
    const data = await response.json();
    
    return {
      success: true,
      output: data.data?.output || data.output,
      sessionId: data.sessionId,
    };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Network error: ${errorMsg}`,
    };
  }
}

/**
 * Check if Firecrawl is configured
 */
export function isFirecrawlConfigured(): boolean {
  return !!FIRECRAWL_API_KEY;
}