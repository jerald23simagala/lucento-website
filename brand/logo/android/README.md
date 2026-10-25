# Android launcher assets

- `ic_launcher_foreground.svg`: adaptive-icon foreground, 108 dp canvas, symbol inside the 66 dp safe zone.
- `ic_launcher_monochrome.svg`: themed-icon layer (Android 13+); the system tints it.
- Background: white `#FFFFFF` (day icon) or Midnight Navy `#17233F` (alternative). The symbol is identical on both.
- `png/`: legacy square launcher PNGs at mdpi–xxxhdpi and the 512 px Play Store icon.

Import into the app with Android Studio's Image Asset tool (Vector Asset for the SVGs). Not yet applied to `lucento-android`.
