/**
 * Hook to get the current user's HR admin status.
 * After login, the app fetches the user's actual ERPNext roles and stores
 * whether they are an HR admin (HR Manager, HR User, System Manager, Administrator).
 *
 * Also checks if the logged-in user is "Administrator" by username as a fallback.
 *
 * Returns { isAdmin, isEmployee }
 */
export function useUserRole() {
    const isHRAdmin = localStorage.getItem('userIsHRAdmin') === 'true';
    const user = localStorage.getItem('user') || '';
    // Fallback: if user is "Administrator" or "administrator", always treat as admin
    const isAdminUser = user.toLowerCase() === 'administrator';

    const isAdmin = isHRAdmin || isAdminUser;

    return {
        isAdmin,
        isEmployee: !isAdmin,
    };
}
