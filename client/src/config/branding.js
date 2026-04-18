import defaultLogo from '../assets/images/SSVLOGO.png';

// Change this one value to switch logo set globally.
export const DEFAULT_BRAND_CODE = 'schooler';

const BRANDING_BY_CODE = {
  schooler: {
    code: 'schooler',
    displayName: 'Schooler',
    headerLogo: defaultLogo,
    sidebarLogo: defaultLogo,
    salarySlipLogo: defaultLogo,
    showHeaderTitle: true,
    headerTitle: 'Schooler Dashboard',
  }
};

export const getActiveBrandCode = () => {
  return DEFAULT_BRAND_CODE;
};

export const getBranding = () => BRANDING_BY_CODE[getActiveBrandCode()];

export default BRANDING_BY_CODE;