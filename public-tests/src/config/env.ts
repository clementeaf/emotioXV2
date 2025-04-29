export const config = {
  apiUrl: typeof window !== 'undefined' 
    ? (window as any).__NEXT_DATA__?.props?.env?.VITE_API_URL || 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev'
    : process.env.VITE_API_URL || 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev'
}; 