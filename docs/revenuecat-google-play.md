# RevenueCat and Google Play Billing Setup

## Product

- App: Berkas
- Package: `app.berkas.android`
- Google Play product ID: `berkas_pro_lifetime`
- Purchase option ID: `buy`
- Type: one-time Buy product, configured as non-consumable in RevenueCat
- Target US price: $9.99 one time
- RevenueCat entitlement: `pro`
- Offering: `default`, lifetime package `$rc_lifetime` only

A Google Play account is required for purchase, but Google Drive authorization is not. Pro unlocks unlimited local documents immediately; Drive authorization is requested only if the purchaser enables optional sync.

## Play Console

1. Finish developer identity verification and register Berkas with package `app.berkas.android`.
2. Enroll in Play App Signing and upload a production-signed Android App Bundle to a Play testing track.
3. Create `berkas_pro_lifetime` under Monetize with Play > Products > One-time products.
4. Add a `buy` purchase option with purchase type Buy, multiple quantities disabled, US $9.99 pricing, and the intended countries or regions.
5. Activate the purchase option. Draft and inactive purchase options are not returned to the app.
6. Add license testers and closed-track testers.
7. Keep the upload and app-signing certificates stable and register their SHA-1 values in Google Cloud for Drive sign-in.

## RevenueCat

1. Add a Google Play app using package `app.berkas.android`.
2. Connect RevenueCat to Play Console using the Google service-account credentials and permissions required by RevenueCat.
3. Import `berkas_pro_lifetime` after its Buy purchase option is active in Play Console.
4. Configure the imported product as non-consumable. If it is consumable, Google Play may allow repeated purchases.
5. Attach the product to entitlement `pro`.
6. Add the product to the lifetime package `$rc_lifetime` in the current `default` offering.
7. Remove the legacy monthly package from the current offering only after version 1.0.1 is available to every tester. No successful monthly purchases existed before this migration.
8. Copy the public `goog_` SDK key to `EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY` locally and in EAS environments.

Never put the Play service-account JSON or private signing credentials in an `EXPO_PUBLIC_*` variable.

## Purchase Test

1. Install Berkas through the Google Play closed-testing opt-in link. Sideloaded builds cannot complete normal Play Billing tests.
2. Confirm the paywall displays Google Play's localized one-time price and says there is no subscription.
3. Purchase Pro without connecting Google Drive.
4. Confirm unlimited local documents work while signed out of Google Drive.
5. Optionally connect Drive and run a sync.
6. Reinstall from the closed track and use Restore purchases with the same Google account.
7. Refund or revoke a sandbox purchase and confirm Pro and Drive sync are disabled without deleting local or Drive files.
