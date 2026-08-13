export const FREE_DOCUMENT_LIMIT = 10;

export function canAddDocument(documentCount: number, isPro: boolean) {
  return isPro || documentCount < FREE_DOCUMENT_LIMIT;
}

export class FreeDocumentLimitError extends Error {
  constructor() {
    super(`Berkas Free stores up to ${FREE_DOCUMENT_LIMIT} documents on this device.`);
    this.name = "FreeDocumentLimitError";
  }
}
