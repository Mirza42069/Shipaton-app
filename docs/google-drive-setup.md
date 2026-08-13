# Google Drive Setup

Berkas uses Google sign-in only when a Pro user enables optional Drive sync. It requests `drive.file` for app-created encrypted backup files and `drive.appdata` for the encrypted synchronization index. Both are narrow, non-sensitive Drive scopes.

## Google Cloud

1. Create or select a Google Cloud project.
2. Enable Google Drive API.
3. Configure the OAuth consent screen with app name `Berkas`, the production support email, privacy-policy URL, and authorized domains.
4. Add `https://www.googleapis.com/auth/drive.file` and `https://www.googleapis.com/auth/drive.appdata`.
5. Add test Google accounts while the consent screen is in testing mode.
6. Create an Android OAuth client for package `app.berkas.android` and the debug signing SHA-1.
7. Create Android OAuth clients for every Play app-signing SHA-1 shown under Play Console > App integrity. The EAS upload certificate is not the certificate Google uses for Play-installed builds.
8. Complete Google's basic OAuth verification before public release.

The legacy native Google sign-in adapter does not require a client secret or server auth code. Never place an OAuth client secret in the app.

## Sync Behavior

- Visible files: opaque `My Drive/Berkas/<document ID>.berkas` backups
- Hidden file: encrypted `berkas-index.json` in Google Drive application data
- Uploads use resumable Drive sessions.
- Downloads are immediately encrypted into the local Berkas vault.
- Deleting a document in Berkas moves its Drive copy to trash at the next sync.
- Disconnecting Google or losing a valid Pro entitlement pauses sync and leaves Drive files intact.
- A local vault binds to its first connected Google account; a different account is rejected to prevent accidental disclosure.
- Files manually added to the Drive folder are not automatically imported because Berkas intentionally uses the narrow `drive.file` scope.

## Configuration Test

1. Build and sign the exact `app.berkas.android` package registered in Google Cloud.
2. Activate Berkas Pro through a Google Play closed-track license tester.
3. Open Settings and tap Connect Google Drive.
4. Save the recovery key and confirm the encrypted-backup disclosure appears before Google sign-in.
5. Sync a synthetic PDF and image.
6. Confirm Google Drive contains opaque `.berkas` files that cannot be previewed there.
7. Install Berkas on another device, enable Pro, connect the same Google account, and confirm downloads are re-encrypted locally.
8. Disconnect Google and verify local documents remain available.
