# Galaxy Store Listing

## Identity

- App name: Berkas
- Package: `app.berkas.android`
- Category: Productivity
- Default language: English
- Content rating target: Everyone
- Price: Free with an optional Berkas Pro subscription
- Berkas Pro: US $4.99 per month through Samsung In-App Purchase
- Required Shipaton market: United States

## Short Description

Keep important documents encrypted locally and ready when life asks for proof.

## Full Description

Berkas turns your Galaxy phone into a private, practical home for documents you repeatedly need.

Scan paper or import an image or PDF. Berkas encrypts each local file, stores its details in an encrypted database, and lets you search by name, note, or category. Add an expiry date to receive a local reminder before a passport, policy, or certificate becomes outdated.

Berkas Free:

- Up to five locally encrypted documents
- No login or account required
- Search, categories, favorites, and expiry reminders

Berkas Pro:

- Unlimited locally encrypted documents
- Optional Google Drive sync
- Pro works locally without Google sign-in

If a Pro user enables Drive sync, Berkas encrypts document contents, filenames, titles, notes, and synchronization metadata on the device before uploading opaque backup files to that user's Google Drive. Restoring on another device requires the user's recovery key. Berkas and Google cannot recover a lost key.

Built for Galaxy:

- Adaptive phone, tablet, landscape, and multi-window layouts
- Optional biometric vault lock through Android authentication
- Screenshot and recent-app preview protection
- Camera scanning and Android system file import
- Local expiry reminders
- On-demand preview and user-initiated sharing

Local privacy:

- AES-256-GCM encrypted document files
- SQLCipher encrypted metadata
- Android Keystore-backed key protection
- No advertising or behavioral tracking

Removing the app or clearing app data removes local files. Existing optional Google Drive copies remain in the user's Drive until the user deletes them.

## Release Notes

Berkas 1.0 introduces an encrypted local vault, scanning and import, expiry reminders, biometric locking, adaptive Galaxy layouts, and optional encrypted Google Drive sync for Pro.

## Search Terms

document vault, document organizer, encrypted files, expiry reminder, passport, local storage, scan documents, Google Drive

## Permission Explanations

- Camera: Used only after the user chooses Scan paper.
- Notifications: Used for user-created document expiry reminders.
- Biometrics: Used only when the user enables biometric vault lock.
- Internet: Used for Samsung IAP, RevenueCat entitlement handling, Google scanner components, and optional user-initiated Google Drive sync.

## Data Safety Draft

- Documents and files: Stored encrypted locally; encrypted backup files are shared with Google Drive only when a Pro user explicitly enables sync.
- Personal information: Google email, display name, and account identifier are processed to display and operate the selected Drive connection.
- Purchases: Samsung IAP and RevenueCat process transaction and entitlement information.
- Device or other identifiers: RevenueCat uses an anonymous app user identifier; automatic device identifier collection is disabled. Google services may process identifiers for sign-in, Drive, scanner delivery, and diagnostics.
- App activity and diagnostics: Berkas does not run product analytics. Google ML Kit and purchase/identity providers may process API usage, performance, and diagnostics.
- Advertising data: Not collected or shared by Berkas.
- Encryption in transit: Yes, for purchase and Google service traffic.
- Account deletion: Berkas has no proprietary account. Users can disconnect Google in Berkas and revoke Berkas in Google Account permissions. Local app data and Drive files are deleted separately.

Verify these answers against the final production SDK and Seller Portal forms immediately before submission.

## Review Team Notes

Berkas Free requires no account. Reviewers can add up to five documents and use local features without buying Pro. Berkas Pro is purchased through Samsung IAP and works locally without Google. Google sign-in is requested only if a Pro reviewer taps Connect Google Drive. Use Samsung licensed-test credentials and a Google OAuth test account for review.

## Screenshot Plan

1. Today dashboard with local vault status.
2. Vault with document categories and search.
3. Add-document scan/import flow.
4. Encrypted local document detail.
5. Berkas Pro and optional Drive disclosure.
6. Connected Drive state after a successful sync.
7. Landscape or tablet adaptive layout.

Use synthetic documents only, and ensure every screenshot matches the submitted binary.

## Required Seller Inputs

- Public support email and mailing address
- Public privacy-policy URL hosting `docs/privacy-policy.md`
- Seller or company name
- Seller Portal commercial seller approval
- RevenueCat Galaxy key and Samsung product configuration
- Google OAuth production verification
