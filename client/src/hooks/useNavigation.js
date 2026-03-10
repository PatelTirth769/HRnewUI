import { useState, useEffect } from 'react';
import { moduleNavigation } from '../config/moduleNavigation';

const CACHE_KEY = 'nav_cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * useNavigation
 * Fetches navigation data from the ser backend (/api/navigation).
 * Falls back to the local moduleNavigation.js config if the API is unreachable.
 * Caches the result in sessionStorage to avoid re-fetching on every sidebar open.
 */
const useNavigation = () => {
    const [navData, setNavData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadNavigation = async () => {
            // Check sessionStorage cache first
            try {
                const cached = sessionStorage.getItem(CACHE_KEY);
                if (cached) {
                    const { data, timestamp } = JSON.parse(cached);
                    if (Date.now() - timestamp < CACHE_TTL_MS) {
                        setNavData(data);
                        setLoading(false);
                        return;
                    }
                }
            } catch (_) {
                // Ignore cache parse errors
            }

            try {
                // Use Vite proxy: /local-api → http://localhost:5000
                const res = await fetch('/local-api/api/navigation');
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();

                if (json.success && Array.isArray(json.data) && json.data.length > 0) {
                    // Convert array to keyed object: { moduleKey: moduleData }
                    const keyed = {};
                    json.data.forEach(mod => {
                        keyed[mod.moduleKey] = mod;
                    });

                    // Cache it
                    try {
                        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: keyed, timestamp: Date.now() }));
                    } catch (_) {}

                    setNavData(keyed);
                } else {
                    // API returned empty data (seed not run yet) — use local fallback
                    throw new Error('No navigation data in DB, using local fallback');
                }
            } catch (err) {
                console.warn('[useNavigation] Falling back to local config.', err.message);
                setError(err.message);
                // Fallback to local config
                setNavData(moduleNavigation);
            } finally {
                setLoading(false);
            }
        };

        loadNavigation();
    }, []);

    const clearCache = () => {
        sessionStorage.removeItem(CACHE_KEY);
    };

    return { navData, loading, error, clearCache };
};

export default useNavigation;
