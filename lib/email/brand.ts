import "server-only";

const DEFAULT_LOGO_URL =
  "https://res.cloudinary.com/daxmjqsy2/image/upload/v1779981648/logo-mark_ybttg7.png";

const DEFAULT_HOME = "https://www.crayonsparks.com";

export function getEmailBrand() {
  return {
    logoUrl: process.env.EMAIL_LOGO_URL ?? DEFAULT_LOGO_URL,
    homeUrl: process.env.PUBLIC_BASE_URL ?? DEFAULT_HOME,
  };
}
