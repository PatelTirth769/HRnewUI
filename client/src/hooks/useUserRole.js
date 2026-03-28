/**
 * Hook to get the current user's role status.
 * After login, the app fetches the user's actual ERPNext roles and stores
 * whether they are an HR admin (HR Manager, HR User, System Manager, Administrator).
 *
 * Also checks if the logged-in user is "Administrator" by username as a fallback.
 *
 * Returns { isAdmin, isEmployee, isInventory, isAccounts }
 */
export function useUserRole() {
    const isHRAdmin = localStorage.getItem('userIsHRAdmin') === 'true';
    const user = localStorage.getItem('user') || '';
    const userRole = localStorage.getItem('userRole') || '';
    // Fallback: if user is "Administrator" or "administrator", always treat as admin
    const isAdminUser = user.toLowerCase() === 'administrator';

    const isAdmin = isHRAdmin || isAdminUser;
    const isInventory = userRole === 'Inventory';
    const isAccounts = userRole === 'Accounts';

    return {
        isAdmin,
        isEmployee: !isAdmin && !isInventory && !isAccounts,
        isInventory,
        isAccounts,
    };
}
