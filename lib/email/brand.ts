import "server-only";

// Hardcoded sender identities — one address per email type so inboxes
// (and the user) can tell apart welcome / feedback / contact / leads
// without inspecting headers.
//
// All from-addresses use the verified crayonsparks.com domain in Resend.
// If the domain isn't verified yet on Resend, sends will fail — verify
// the domain at resend.com first.

const LOGO_URL =
  "https://res.cloudinary.com/daxmjqsy2/image/upload/f_png,w_128,h_128/v1779981648/logo-mark_ybttg7.png";

const HOME_URL = "https://www.crayonsparks.com";

export type EmailKind = "welcome" | "feedback" | "contact" | "leads";

const FROM_BY_KIND: Record<EmailKind, string> = {
  welcome: "CrayonSparks <welcome@crayonsparks.com>",
  feedback: "CrayonSparks <feedback@crayonsparks.com>",
  contact: "CrayonSparks <contact@crayonsparks.com>",
  leads: "CrayonSparks <pages@crayonsparks.com>",
};

export function getEmailBrand() {
  return { logoUrl: LOGO_URL, homeUrl: HOME_URL };
}

export function getFromAddress(kind: EmailKind): string {
  return FROM_BY_KIND[kind];
}
