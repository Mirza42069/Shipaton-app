# Berkas Release Checklist

## Current Build

- [x] EAS project linked and managed upload signing created.
- [x] Production RevenueCat `goog_` key configured in the EAS production environment.
- [x] Version `1.0.0` (`versionCode 2`) built and uploaded to Play closed testing.
- [x] Closed-testing countries and tester email list configured.
- [ ] Complete the Advertising ID declaration: select **No**, because the app and AAB do not request `com.google.android.gms.permission.AD_ID`.
- [ ] Submit the pending Play Console changes for review after quick checks pass.

Artifact details and certificate fingerprints are in `docs/production-build-2026-08-13.md`.

## Next Closed-Test Build

- [x] Set app version to `1.0.1`; EAS must assign a `versionCode` greater than `2`.
- [x] Set Berkas Free to 10 documents and remove the fixed 25 MB document cap.
- [x] Update the app for one-time product `berkas_pro_lifetime` in RevenueCat package `$rc_lifetime`.
- [ ] Remote Android version state is currently uninitialized. Run `bunx eas build:version:set --platform android --profile production`, enter current Play version code `2`, then confirm `bunx eas build:version:get --platform android --profile production` reports `2`. The production profile will auto-increment the next build to `3`.
- [ ] Build and upload version `1.0.1` only after the lifetime product and offering are active.

## Required Before Testing

- [ ] Finish Play developer identity verification if still pending.
- [ ] Publish `docs/privacy-policy.md` at a stable HTTPS URL and replace its contact placeholder.
- [ ] Add the public support email in Play Store settings.
- [ ] Complete Play Console App content forms: Data safety, content rating, target audience, app access, ads (**No**), Financial features (**No**), Health apps (**No**), and privacy policy.
- [ ] Create and activate one-time Buy product `berkas_pro_lifetime` with purchase option `buy` and US $9.99 pricing.
- [ ] Mark `berkas_pro_lifetime` non-consumable in RevenueCat, attach it to `pro`, and add it to `$rc_lifetime` in `default`.
- [ ] Finish RevenueCat setup in `docs/revenuecat-google-play.md`.
- [ ] Finish Google OAuth setup in `docs/google-drive-setup.md` and register every Play app-signing SHA-1 shown by Play Console.

## Closed-Test Validation

- [ ] Install through the Play closed-testing opt-in link using a license tester account.
- [ ] Cold start without Metro, including once in airplane mode.
- [ ] Add 10 documents and confirm the eleventh requires Pro.
- [ ] Import and synchronize a document larger than 25 MB on a device with sufficient storage and memory.
- [ ] Test image/PDF import, scan, search, reminders, biometrics, screenshot blocking, sharing, rotation, and permission denial.
- [ ] Make and restore the one-time Pro purchase; confirm unlimited local documents work without Drive sign-in.
- [ ] Confirm the Drive disclosure appears before sign-in and only opaque `.berkas` backups are uploaded.
- [ ] Restore with the recovery key; confirm another Google account is rejected.
- [ ] Confirm remote deletion moves the backup to trash and disconnect/refund/revocation preserves local and Drive files.
- [ ] Confirm the listing, screenshots, price, and privacy policy match the submitted binary.

For personal Play accounts subject to the production-access requirement, keep at least 12 testers opted in continuously for 14 days, collect feedback, then apply for production access.

## Build Commands

Run from `apps/native`:

```powershell
bun run check-types
bun test
bunx expo-doctor
bunx eas build --platform android --profile production
```

The Android project is tracked. After a native dependency or plugin change, run `bunx expo prebuild --clean --platform android` and review the generated diff before rebuilding.
