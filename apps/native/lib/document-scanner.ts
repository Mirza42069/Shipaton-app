import DocumentScanner from "react-native-document-scanner-plugin";

type ScanDocumentOptions = Parameters<typeof DocumentScanner.scanDocument>[0];

export function scanDocument(options: ScanDocumentOptions) {
  return DocumentScanner.scanDocument(options);
}
