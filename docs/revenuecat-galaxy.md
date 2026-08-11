# RevenueCat and Samsung IAP Setup

## Product

- App: Berkas
- Package: `app.berkas.android`
- Samsung product ID: `berkas_pro_monthly`
- Type: recurring monthly subscription
- US price: $4.99 per month
- RevenueCat entitlement: `pro`
- Offering: `default`, monthly package only

Google sign-in is not required for purchase. Pro unlocks unlimited local documents immediately; Google sign-in is requested only if the subscriber enables optional Drive sync.

## Seller Portal

1. Register Berkas with package `app.berkas.android`.
2. Upload a production-signed binary containing Samsung IAP.
3. Create and activate `berkas_pro_monthly` at US $4.99 per month, with localized prices where required.
4. Add licensed testers and use a closed beta for IAP validation.
5. Keep the production signing certificate stable.

## RevenueCat

1. Add a Samsung Galaxy Store app using package `app.berkas.android`.
2. Create a Seller Portal service account with `Publishing & ITEM` and `GSS` scopes.
3. Upload the service-account private key and account ID to RevenueCat.
4. Add `berkas_pro_monthly` and attach it to entitlement `pro`.
5. Add the monthly product to the current `default` offering.
6. Copy the public `galx_` SDK key to `EXPO_PUBLIC_REVENUECAT_GALAXY_API_KEY` locally and in EAS environments.

## Purchase Test

1. Install through the Seller Portal licensed-test or closed-beta route.
2. Confirm Settings displays Samsung's localized monthly price.
3. Purchase Pro without connecting Google.
4. Confirm unlimited local documents work while signed out of Google.
5. Optionally connect Drive and run a sync.
6. Reinstall and use Restore purchases with the same Samsung account.
7. Confirm cancellation leaves Pro active through expiry, then pauses Drive sync without deleting files.
