import axios from "axios";

// Create the API instance for ERPNext calls
const API = axios.create({
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    }
});

/**
 * Set the active system for all subsequent API calls.
 * When a system is selected, ERPNext API calls are routed through the
 * ser backend's reverse proxy: /local-api/erp-proxy/{systemCode}/api/...
 * 
 * @param {string|null} systemCode - The system code (e.g. 'preeshe'), or null to use default proxy
 */
export function setActiveSystem(systemCode) {
    if (systemCode) {
        localStorage.setItem('activeSystem', systemCode);
        // Route through the ser backend's reverse proxy
        API.defaults.baseURL = `/local-api/erp-proxy/${systemCode}`;
    } else {
        localStorage.removeItem('activeSystem');
        // Fall back to the default Vite proxy (direct to preeshe)
        API.defaults.baseURL = '';
    }
}

/**
 * Get the currently active system code from localStorage
 */
export function getActiveSystem() {
    return localStorage.getItem('activeSystem') || null;
}

// On module load, restore active system from localStorage
const savedSystem = getActiveSystem();
if (savedSystem) {
    setActiveSystem(savedSystem);
}

export default API;
