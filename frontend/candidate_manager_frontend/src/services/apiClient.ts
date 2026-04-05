import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:8793",
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
