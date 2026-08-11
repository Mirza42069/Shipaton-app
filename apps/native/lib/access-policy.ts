export const FREE_DOCUMENT_LIMIT = 5;

export class FreeDocumentLimitError extends Error {
  constructor() {
    super(`Berkas Free stores up to ${FREE_DOCUMENT_LIMIT} documents on this device.`);
    this.name = "FreeDocumentLimitError";
  }
}
