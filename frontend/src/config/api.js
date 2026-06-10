// Same-origin relative paths — works with Express on :5000 and Hostinger monolith deploy.
// Vite dev server proxies /api/* to localhost:5000 (see vite.config.js).
export const apiUrl = (path) => (path.startsWith('/') ? path : `/${path}`);
