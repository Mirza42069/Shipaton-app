export const PRO_ENTITLEMENT_ID = "pro";
export const LIFETIME_PRODUCT_ID = "berkas_pro_lifetime";
export const PRO_OFFERING_ID = "default";
export const LIFETIME_PACKAGE_ID = "$rc_lifetime";

type PackageCandidate = {
  identifier: string;
  packageType: string;
  offeringIdentifier: string;
  product: {
    identifier: string;
    defaultOption?: { productId: string } | null;
  };
};

function isLifetimeProductId(identifier: string | undefined) {
  return identifier === LIFETIME_PRODUCT_ID || identifier?.startsWith(`${LIFETIME_PRODUCT_ID}:`) === true;
}

export function isLifetimeProPackage(item: PackageCandidate) {
  return item.identifier === LIFETIME_PACKAGE_ID &&
    item.offeringIdentifier === PRO_OFFERING_ID &&
    item.packageType === "LIFETIME" && (
    isLifetimeProductId(item.product.identifier) ||
    isLifetimeProductId(item.product.defaultOption?.productId)
  );
}
