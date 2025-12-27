import axios from "axios";

const apiUrl: string = import.meta.env.VITE_BACKEND_URL;
3;

const axiosClient = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
});

const axiosRefresh = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
});

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      originalRequest.url === "/api/authentication/refresh" ||
      originalRequest.url === "/api/admin/refresh"
    ) {
      return Promise.reject(error);
    }

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await axiosRefresh.post(
          "/api/authentication/refresh"
        );
        const adminRefreshResponse = await axiosRefresh.post(
          "/api/admin/refresh"
        );

        if (refreshResponse.data?.user || adminRefreshResponse.data?.user) {
        }
        return axiosClient(originalRequest);
      } catch (refreshError) {
        console.log("Refresh Error.... Logging out now");
        console.log(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
