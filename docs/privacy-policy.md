# Berkas Privacy Policy

Effective date: August 11, 2026

Berkas is a local-first Android document organizer. Berkas Free does not require an account. Optional cloud synchronization is available only when a Berkas Pro user chooses to connect Google Drive.

## Local Documents

Local documents, scans, titles, notes, categories, and expiry dates are stored in Berkas private app storage. Files use AES-256-GCM encryption, metadata uses SQLCipher, and local key material is protected using Android Keystore-backed secure storage.

Temporary decrypted copies are created when a user previews, shares, or synchronizes a file. Berkas clears its temporary copies after the operation, when the vault locks, when the document is deleted, and when the app starts.

Deleting Berkas or clearing its app data permanently removes the local vault. It does not automatically delete copies already stored in Google Drive.

## Optional Google Drive Sync

Google sign-in is not required to use Berkas Free or to use Berkas Pro locally. A Pro user may optionally connect a Google account and grant the narrow `drive.file` and `drive.appdata` permissions.

When Drive sync is enabled, Berkas encrypts document contents, filenames, titles, notes, and synchronization metadata on the device before upload. Google Drive receives opaque `.berkas` backup files and an encrypted synchronization index; Google cannot decrypt their contents.

Berkas stores an encrypted synchronization index in Google Drive application data. Before encryption this may include document titles, categories, filenames, notes, expiry dates, favorites, file identifiers, timestamps, and deletion records. Google processes encrypted Drive content and account information under Google's privacy policy.

Encrypted Drive backups use a randomly generated recovery key stored in Android secure storage. Berkas does not send this key to a Berkas server and cannot recover it if it is lost. A user must save the key outside the device to restore encrypted backups on another device. Anyone who obtains the key and access to the backup can decrypt it.

The selected Google account identifier, email address, display name, access tokens, and authorization status may be processed on the device to operate and display the connection. Berkas does not send Google credentials to a Berkas server. OAuth tokens are managed by Google Play services and the Google sign-in library.

Disconnecting Google stops synchronization but does not delete local documents or existing Drive copies. Users can delete Drive files in Berkas or Google Drive and can revoke Berkas access from Google Account permissions. A refunded, revoked, or unavailable Pro entitlement pauses synchronization without deleting either local or Drive copies.

## Processes

Process names, requirement checklists, completion status, and links to vault documents are encrypted in the local SQLCipher database. Process metadata remains on the device and is not currently included in Google Drive synchronization.

## Camera, Files, Biometrics, and Notifications

Berkas requests camera access only when the user chooses to scan. The scanner uses Google ML Kit. Google Play services may download scanner components and process app/device identifiers, API usage, performance metrics, and diagnostics. Scanned pages stay on the device unless Drive sync is enabled.

Berkas uses Android's system picker for imports and does not request broad storage access.

Android performs biometric or device authentication. Berkas receives only whether authentication succeeded and does not receive biometric data.

Expiry reminders are scheduled locally through Android notifications. Reminder text does not include the document title.

## Purchases

Berkas uses Google Play Billing and RevenueCat for Berkas Pro. These providers may process anonymous app user identifiers, products, entitlements, receipts, purchase status, app version, platform, and diagnostics required to validate and restore purchases. Automatic RevenueCat device identifier collection is disabled.

Google Play processes payment details; Berkas does not receive payment-card information. RevenueCat's privacy policy is at https://www.revenuecat.com/privacy/ and Google's privacy policy is at https://policies.google.com/privacy.

## Analytics and Advertising

Berkas contains no advertising, behavioral tracking, or general-purpose product analytics. Berkas does not sell personal information. Google and purchase providers may process technical diagnostics as described above.

## Children

Berkas is not directed to children under 13. We do not knowingly collect personal information from children.

## Contact

Before publication, replace this paragraph with the developer's public support email and mailing address. These details must match Google Play and the Google OAuth consent screen.
