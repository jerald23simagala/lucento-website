/**
 * Mascot artwork already shipped with the demo, plus the small loops in public/lottie/.
 * Those loops were authored for this site. The repo had no Lottie source to reuse.
 * Poses match the demo: ahead → caution, behind → steady, in step → greeting.
 */
export const mascotArt = {
  greeting: {
    still: '/demo/art/mascot_thriving_greeting_happy.webp',
    lottie: '/lottie/mascot-greeting.json',
  },
  thinking: {
    still: '/demo/art/mascot_thriving_thinking.webp',
    lottie: '/lottie/mascot-thinking.json',
  },
  pointing: {
    still: '/demo/art/mascot_thriving_pointing.webp',
    lottie: '/lottie/mascot-pointing.json',
  },
  success: {
    still: '/demo/art/mascot_thriving_success.webp',
    lottie: '/lottie/mascot-success.json',
  },
  steady: {
    still: '/demo/art/mascot_steady_hero_neutral.webp',
    lottie: '/lottie/mascot-steady.json',
  },
  caution: {
    still: '/demo/art/mascot_getting_tight_caution.webp',
    lottie: '/lottie/mascot-caution.json',
  },
} as const;

export type MascotPose = keyof typeof mascotArt;
