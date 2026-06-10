const configuredBase = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";

export const getApiBase = () => {
  if (typeof window === "undefined") return configuredBase;
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return "";
  }
  return configuredBase;
};

export const apiUrl = (path) => `${getApiBase()}${path}`;
