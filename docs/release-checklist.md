# Berkas Release Checklist

## Accounts and External Setup

- [ ] Register `app.berkas.android` in Samsung Seller Portal.
- [ ] Obtain commercial seller status.
- [ ] Create `berkas_pro_monthly` at US $4.99/month.
- [ ] Configure RevenueCat using `docs/revenuecat-galaxy.md`.
- [ ] Configure Google OAuth and Drive using `docs/google-drive-setup.md`.
- [ ] Create an Expo account and production signing credentials.
- [ ] Publish `docs/privacy-policy.md` at a stable HTTPS URL.
- [ ] Replace the privacy-policy contact placeholder.

## Configuration

- [x] Display name is Berkas.
- [x] Package is `app.berkas.android`.
- [x] Free limit is five local documents without login.
- [x] Pro works locally without Google sign-in.
- [x] Drive sign-in is optional and limited to Pro.
- [x] Drive uses narrow `drive.file` and `drive.appdata` scopes.
- [x] Target and compile SDK are 36; minimum SDK is 24.
- [x] Cleartext network traffic and Android backup are disabled.
- [x] Camera hardware is optional and broad storage permissions are blocked.
- [ ] Configure `EXPO_PUBLIC_REVENUECAT_GALAXY_API_KEY`.
- [ ] Register debug and production signing SHA-1 values in Google Cloud.

## Build

```powershell
bun run check-types
bunx expo-doctor
bunx expo prebuild --clean --platform android
eas build --platform android --profile preview
eas build --platform android --profile production
```

The generated Android project is tracked. Run Expo Prebuild after every package, plugin, or native configuration change and review the generated diff.

## Local Device Validation

- [ ] Install Berkas on the Samsung Galaxy S21 FE.
- [ ] Confirm package `app.berkas.android` and launcher label Berkas.
- [ ] Cold start in airplane mode without a login prompt.
- [ ] Add five synthetic documents and verify the sixth is blocked.
- [ ] Reopen and decrypt imported image/PDF files.
- [ ] Test search, expiry notifications, biometric lock, screenshot blocking, sharing, plans, rotation, and split-screen.
- [ ] Confirm denied camera, notification, and biometric permissions do not crash.

## Subscription and Drive Validation

- [ ] Purchase Pro without Google sign-in through a Samsung licensed tester.
- [ ] Confirm a sixth document is allowed with Pro.
- [ ] Confirm Drive disclosure appears before Google sign-in.
- [ ] Connect a Google OAuth test account and sync a PDF and image.
- [ ] Open readable files in `My Drive/Berkas`.
- [ ] Restore on a second device and confirm local encryption.
- [ ] Delete in Berkas and verify the Drive copy moves to trash after sync.
- [ ] Verify a different Google account is blocked from receiving the bound vault.
- [ ] Disconnect Google and verify local documents remain.
- [ ] Expire Pro and verify sync pauses without deleting local or Drive files.

## Seller Portal Submission

- [ ] Use `docs/galaxy-store-listing.md` for matching metadata and screenshots.
- [ ] Include the United States for Shipaton judging.
- [ ] Complete Data Safety for local files, Google account information, readable Drive copies, Samsung IAP, RevenueCat, and Google ML Kit.
- [ ] Provide Samsung licensed-test and Google OAuth test instructions to reviewers.
- [ ] Verify the app name, package, icon, description, screenshots, subscription price, and privacy policy match the submitted binary.
