import API from "../utils/api"; // Import your centralized API instance

// Since the centralized API already has the base URL (/api or localhost),
// we only need the specific path for auth here.
const AUTH_PATH = "/auth";

export const registerUser = (data) => API.post(`${AUTH_PATH}/register`, data);

export const loginUser = async (data) => {
    const response = await API.post(`${AUTH_PATH}/login`, data);
    
    // IMPORTANT: If your backend returns a token and user object, 
    // save them here so ProtectedRoute can see them.
    if (response.data.token) {
        localStorage.setItem("token", response.data.token);
    }
    if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    
    return response;
};