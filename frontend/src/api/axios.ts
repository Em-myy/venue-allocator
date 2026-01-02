import axios from "axios";

const apiUrl: string = import.meta.env.VITE_BACKEND_URL;
3;

const axiosClient = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
});

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (originalRequest.url.includes("refresh")) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await axiosClient.post("/api/authentication/refresh");

        return axiosClient(originalRequest);
      } catch (refreshError) {
        console.log("Refresh Error.... Logging out now");
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
