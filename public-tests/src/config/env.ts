export const config = {
  apiUrl: typeof window !== 'undefined' 
    ? (window as any).__NEXT_DATA__?.props?.env?.NEXT_PUBLIC_API_URL || 'https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev'
    : process.env.NEXT_PUBLIC_API_URL || 'https://4hdn6j00e6.execute-api.us-east-1.amazonaws.com/dev'
}; 