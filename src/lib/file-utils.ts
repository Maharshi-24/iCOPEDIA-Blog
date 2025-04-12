/**
 * Utility functions for file operations
 */

/**
 * Fetches the size of a file from a given URL
 * @param url The URL of the file to fetch
 * @returns A promise that resolves to the formatted file size (e.g., "31.2 MB")
 */
export async function getFileSize(url: string): Promise<string> {
  try {
    // Fetch the file headers to get the content-length
    const response = await fetch(url, { method: 'HEAD' });
    
    if (!response.ok) {
      console.error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      return "Unknown size"; // Fallback value
    }
    
    // Get the content length from headers
    const contentLength = response.headers.get('content-length');
    
    if (!contentLength) {
      console.error('Content-Length header not available');
      return "Unknown size"; // Fallback value
    }
    
    // Convert bytes to a readable format
    return formatFileSize(parseInt(contentLength, 10));
  } catch (error) {
    console.error('Error fetching file size:', error);
    return "Unknown size"; // Fallback value
  }
}

/**
 * Formats a file size in bytes to a human-readable string
 * @param bytes The file size in bytes
 * @returns Formatted file size string (e.g., "31.2 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  // Format with one decimal place and round
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
