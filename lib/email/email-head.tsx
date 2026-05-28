import "server-only";

import { Head } from "@react-email/components";

const DARK_MODE_DEFEAT_CSS = `
:root {
  color-scheme: light only;
  supported-color-schemes: light only;
}
@media (prefers-color-scheme: dark) {
  body, .email-body, .email-card, .email-section {
    background-color: #f8fafc !important;
    color: #0f172a !important;
  }
  .email-card { background-color: #ffffff !important; }
  .email-text-dark { color: #0f172a !important; }
  .email-text-muted { color: #475569 !important; }
}
[data-ogsc] body,
[data-ogac] body,
u + .body,
.gmail-fix {
  background-color: #f8fafc !important;
}
[data-ogsc] .email-card,
[data-ogac] .email-card {
  background-color: #ffffff !important;
}
[data-ogsc] .email-text-dark,
[data-ogac] .email-text-dark {
  color: #0f172a !important;
}
[data-ogsc] .email-text-muted,
[data-ogac] .email-text-muted {
  color: #475569 !important;
}
`;

export function EmailHead() {
  return (
    <Head>
      <meta name="color-scheme" content="light only" />
      <meta name="supported-color-schemes" content="light only" />
      <style dangerouslySetInnerHTML={{ __html: DARK_MODE_DEFEAT_CSS }} />
    </Head>
  );
}
