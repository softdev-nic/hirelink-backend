 const privateAPI = axios.create({
  baseURL: BASEURL,
});

const publicAPI = axios.create({
  baseURL: BASEURL,
});

publicAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth-token");

    if (token) {
      config.headers.Authorization = token;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export { privateAPI, publicAPI };