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
