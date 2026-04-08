export const isMessengerSite = () => {
  const host = window.location.hostname;
  return host.includes("messenger.com") || host.includes("facebook.com");
};

export const isGmailSite = () =>
  window.location.hostname.includes("mail.google.com");
