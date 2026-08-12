export const DOCUMENT_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
export const DOCUMENT_FILE_EXTENSION_PATTERN = /^\.[A-Za-z0-9]{1,8}$/;

export function assertSafeDocumentId(documentId: string) {
  if (!DOCUMENT_ID_PATTERN.test(documentId)) {
    throw new Error("This document has an invalid file identifier.");
  }
  return documentId;
}

export function assertSafeFileExtension(extension: string) {
  if (!DOCUMENT_FILE_EXTENSION_PATTERN.test(extension)) {
    throw new Error("This document has an unsupported file extension.");
  }
  return extension.toLowerCase();
}
