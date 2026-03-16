import defaultLogo from '../assets/images/logo.png';
import lingayasHeaderLogo from '../assets/images/lingayas_header.jpeg';
import lingayasSidebarLogo from '../assets/images/lingayas_side.jpeg';

// Change this one value to switch logo set globally.
export const DEFAULT_BRAND_CODE = 'lingayas';

const BRANDING_BY_CODE = {
  preeshe: {
    code: 'preeshe',
    displayName: 'Paradigms Consulting',
    headerLogo: defaultLogo,
    sidebarLogo: defaultLogo,
    salarySlipLogo: defaultLogo,
    showHeaderTitle: true,
    headerTitle: 'Dash Board',
  },
  lingayas: {
    code: 'lingayas',
    displayName: "Lingaya's Vidyapeeth",
    headerLogo: lingayasHeaderLogo,
    sidebarLogo: lingayasSidebarLogo,
    salarySlipLogo: lingayasHeaderLogo,
    showHeaderTitle: false,
    headerTitle: 'Dash Board',
  },
};

export const getActiveBrandCode = () => {
  const code = DEFAULT_BRAND_CODE;
  return BRANDING_BY_CODE[code] ? code : DEFAULT_BRAND_CODE;
};

export const getBranding = () => BRANDING_BY_CODE[getActiveBrandCode()];

export default BRANDING_BY_CODE;