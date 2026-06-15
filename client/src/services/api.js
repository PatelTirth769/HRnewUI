import axios from "axios";

// Create the API instance for ERPNext calls
const API = axios.create({
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    }
});

// Add a global interceptor to automatically pause and retry when hitting Frappe rate limits (417/429)
API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error.response?.status;
        const errStr = JSON.stringify(error.response?.data || {});
        
        // Check if Frappe rate-limited us
        if (status === 417 || status === 429 || errStr.includes('Throttled') || errStr.includes('Too Many Requests')) {
            const config = error.config;
            if (config) {
                config.retryCount = config.retryCount || 0;
                // Retry up to 12 times for throttled requests with a longer delay to outlast Frappe 60-second lockout windows
                if (config.retryCount < 12) {
                    config.retryCount += 1;
                    console.warn(`[API Rate Limit] Request throttled. Retrying (${config.retryCount}/12) in 5.5 seconds...`);
                    await new Promise(r => setTimeout(r, 5500));
                    return API(config);
                }
            }
        }
        return Promise.reject(error);
    }
);
/**
 * Set the active system for all subsequent API calls.
 * Hardcoded to Schooler.
 */
export function setActiveSystem(systemCode) {
    API.defaults.baseURL = `/local-api/erp-proxy/schooler`;
    localStorage.setItem('activeSystem', 'schooler');
}

/**
 * Get the currently active system code from localStorage
 */
export function getActiveSystem() {
    return 'schooler';
}

/**
 * Get the query string parameter for local backend API calls.
 */
export function getSystemQueryParam(separator = '?') {
    return `${separator}system=schooler`;
}

/**
 * Get the active system code string for use in local API calls.
 * @returns {string|null}
 */
export function getSystemForLocalAPI() {
    return 'schooler';
}

// On module load
setActiveSystem('schooler');

export default API;
