import axios from "axios";

const API = axios.create({
    // baseURL is removed to use the current origin (localhost:5173), triggering the Vite proxy
    withCredentials: true, // Enable sending cookies (sid) with requests
    headers: {
        "Content-Type": "application/json"
    }
});

export default API;
