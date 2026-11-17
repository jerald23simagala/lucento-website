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
  /**
   * Lucento's own channels (lucento-android docs/marketing/launch/CHANNEL_KIT.md §1), so "follow for launch day" posts
   * that link this site lead somewhere. The Facebook Page has no username yet, so it's linked by its profile ID.
   */
  social: [
    { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61596187720039' },
    { label: 'Instagram', href: 'https://www.instagram.com/lucentoapp/' },
    { label: 'TikTok', href: 'https://www.tiktok.com/@lucentoapp' },
    { label: 'YouTube', href: 'https://www.youtube.com/channel/UCg8f6wbVTgYPnXBeMvD0FyA' },
    { label: 'Lucento Community', href: 'https://www.facebook.com/groups/1574188714744063' },
  ],
} as const;

export const mailto = (subject: string) =>
  `mailto:${site.contactEmail}?subject=${encodeURIComponent(subject)}`;
