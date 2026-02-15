export const getApiBase = () => {
  const rawBase = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
  return rawBase.endsWith('/api/v1') ? rawBase : `${rawBase}/api/v1`;
};
