# Google Play Listing

This is the authoritative copy for the English (United States) Play listing.

## Store Fields

- App name: `Berkas`
- Package: `app.berkas.android`
- Category: Productivity
- Price: Free with optional Berkas Pro at US $9.99 one time
- Advertising ID declaration: No

## Short Description

Keep important documents encrypted, organized, and ready when you need them.

## Full Description

Berkas is a private, practical home for the documents that keep life moving.

Scan paper or import an image or PDF. Berkas encrypts each local file, stores its details in an encrypted database, and lets you search by name, note, or category. Add an expiry date to receive a local reminder before a passport, policy, or certificate becomes outdated.

Berkas Free:

- Up to 10 locally encrypted documents
- No fixed per-document MB limit; capacity depends on the device
- No login or account required
- Search, categories, favorites, and expiry reminders

Berkas Pro:

- Unlimited locally encrypted documents
- Optional encrypted Google Drive sync
- Pro works locally without Google Drive sign-in
- One-time purchase with no subscription

If a Pro user enables Drive sync, Berkas encrypts document contents, filenames, titles, notes, and synchronization metadata on the device before uploading opaque backup files to that user's Google Drive. Restoring on another device requires the user's recovery key. Berkas and Google cannot recover a lost key.

Local privacy:

- AES-256-GCM encrypted document files
- SQLCipher encrypted metadata
- Android Keystore-backed key protection
- No advertising or behavioral tracking

Removing the app or clearing app data removes local files. Existing optional Google Drive copies remain in the user's Drive until the user deletes them.

## Closed-Test Release

Release name: `Berkas 1.0.1 - Closed Testing` (append the version code assigned by EAS)

```text
<en-US>
Closed testing update for Berkas.

- Berkas Free now includes up to 10 encrypted local documents
- Removed the fixed 25 MB document limit; capacity depends on the device
- Berkas Pro is now a one-time purchase with no subscription
- Pro unlocks unlimited local documents and optional encrypted Google Drive backup

Thank you for helping us test Berkas.
</en-US>
```

## Permission Explanations

- Camera: Used only after the user chooses Scan paper.
- Notifications: Used for user-created document expiry reminders.
- Biometrics: Used only when the user enables biometric vault lock.
- Internet: Used for Google Play Billing, RevenueCat entitlement handling, Google scanner components, and optional user-initiated Google Drive sync.

## Data Safety Draft

- Documents and files: Stored encrypted locally. Optional Drive backup is end-to-end encrypted and initiated by the user; classify it in the Play form according to Google's current encrypted-data and user-initiated-transfer rules.
- Personal information: Google email and account identifier are processed to display and operate the selected Drive connection.
- Purchases: Google Play and RevenueCat process transaction and entitlement information.
- Device or other identifiers: RevenueCat uses an anonymous app user identifier; automatic device identifier collection is disabled. Google services may process identifiers for billing, sign-in, Drive, scanner delivery, and diagnostics.
- App activity and diagnostics: Berkas does not run product analytics. Google ML Kit and purchase or identity providers may process API usage, performance, and diagnostics.
- Advertising data: Not collected or shared by Berkas.
- Encryption in transit: Yes, for purchase and Google service traffic.
- Account deletion: Berkas has no proprietary account. Users can disconnect Google in Berkas and revoke Berkas in Google Account permissions. Local app data and Drive files are deleted separately.

Verify these answers against the final production SDK and Play Console Data safety form immediately before submission.

## Review Team Notes

Berkas Free requires no account. Reviewers can add up to 10 documents and use local features without buying Pro. Berkas Pro is a one-time purchase through the active Play testing track and works locally without Google Drive. Google Drive sign-in is requested only if a Pro reviewer taps Connect Google Drive. Add reviewer accounts as Play license testers and Google OAuth test users when required.

## Submission Notes

- Asset manifest: `docs/play-store-assets/README.md`
- Data safety: verify each SDK and apply Google's current exceptions for end-to-end encrypted data and user-initiated transfers; keep the privacy policy's broader disclosure regardless of form classification.
- Advertising: select **No** for both Contains ads and Advertising ID. Berkas contains no ads, behavioral tracking, or `AD_ID` permission.
- App access: Free features need no account. Pro needs a Play license tester. Drive sign-in is requested only after a Pro tester chooses Connect Google Drive.
- Privacy policy: publish `docs/privacy-policy.md` at a stable HTTPS URL before review.
