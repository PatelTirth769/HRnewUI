import defaultLogo from '../assets/images/logo.png';
import lingayasHeaderLogo from '../assets/images/lingayas_header.jpeg';
import lingayasSidebarLogo from '../assets/images/lingayas_side.jpeg';
import ecommerceLogo from '../assets/images/ecommerce_logo.png';

// Change this one value to switch logo set globally.
export const DEFAULT_BRAND_CODE = 'preeshe';

const BRANDING_BY_CODE = {
  preeshe: {
    code: 'preeshe',
    displayName: 'Paradigms Consulting',
    headerLogo: defaultLogo,
    sidebarLogo: defaultLogo,
    salarySlipLogo: defaultLogo,
    showHeaderTitle: false,
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
  schooler: {
    code: 'schooler',
    displayName: 'Schooler',
    headerLogo: defaultLogo,
    sidebarLogo: defaultLogo,
    salarySlipLogo: defaultLogo,
    showHeaderTitle: true,
    headerTitle: 'Schooler Dashboard',
  },
  ecommerce: {
    code: 'ecommerce',
    displayName: 'Ecommerce',
    headerLogo: ecommerceLogo,
    sidebarLogo: ecommerceLogo,
    salarySlipLogo: ecommerceLogo,
    showHeaderTitle: false,
    headerTitle: 'Ecommerce Dashboard',
  },
};

export const getActiveBrandCode = () => {
  const code = (localStorage.getItem('activeSystem') || DEFAULT_BRAND_CODE).toLowerCase();
  return BRANDING_BY_CODE[code] ? code : DEFAULT_BRAND_CODE;
};

export const getBranding = () => BRANDING_BY_CODE[getActiveBrandCode()];

export default BRANDING_BY_CODE;