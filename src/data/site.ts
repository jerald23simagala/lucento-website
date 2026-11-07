/** Facts about Lucento that more than one page uses. Change them here only. */
export const site = {
  /** Questions, privacy requests and account-deletion requests (the app's LegalDocuments.CONTACT_EMAIL). */
  contactEmail: 'lucentoapp@gmail.com',
  packageName: 'com.lucento.app',
  playUrl: 'https://play.google.com/store/apps/details?id=com.lucento.app',
  /**
   * Set to true on the day the Google Play listing is public. Until then the site says "coming soon" and never links
   * to a store page that doesn't exist yet.
   */
  playListed: false,
  /** Google Play's own subscription page for Lucento: where a subscription is cancelled. */
  manageSubscriptionsUrl: 'https://play.google.com/store/account/subscriptions?package=com.lucento.app',
} as const;

export const mailto = (subject: string) =>
  `mailto:${site.contactEmail}?subject=${encodeURIComponent(subject)}`;
