import { fetch } from "expo/fetch";
import type { File } from "expo-file-system";

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";

export const DRIVE_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.appdata",
] as const;

type DriveFile = {
  id: string;
  name: string;
  mimeType?: string;
  modifiedTime?: string;
  trashed?: boolean;
  appProperties?: Record<string, string>;
};

class GoogleDriveRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "GoogleDriveRequestError";
  }
}

function escapeQueryValue(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

export class GoogleDriveClient {
  constructor(private readonly accessToken: string) {}

  private async request(url: string, init: RequestInit = {}) {
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        ...init.headers,
      },
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new GoogleDriveRequestError(
        response.status,
        `Google Drive request failed (${response.status}): ${detail.slice(0, 240)}`,
      );
    }
    return response;
  }

  private async listFiles(query: string, spaces: "drive" | "appDataFolder") {
    const files: DriveFile[] = [];
    let pageToken: string | undefined;
    do {
      const params = new URLSearchParams({
        q: query,
        spaces,
        pageSize: "1000",
        fields: "nextPageToken,files(id,name,mimeType,modifiedTime,trashed,appProperties)",
      });
      if (pageToken) params.set("pageToken", pageToken);
      const response = await this.request(`${DRIVE_API}/files?${params}`);
      const page = (await response.json()) as {
        files?: DriveFile[];
        nextPageToken?: string;
      };
      files.push(...(page.files ?? []));
      pageToken = page.nextPageToken;
    } while (pageToken);
    return files;
  }

  async getFile(fileId: string) {
    try {
      const response = await this.request(
        `${DRIVE_API}/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,modifiedTime,trashed,appProperties`,
      );
      return (await response.json()) as DriveFile;
    } catch (error) {
      if (error instanceof GoogleDriveRequestError && error.status === 404) return null;
      throw error;
    }
  }

  async ensureBerkasFolder(preferredFolderId: string | null = null) {
    if (preferredFolderId) {
      const preferred = await this.getFile(preferredFolderId);
      if (preferred && !preferred.trashed && preferred.mimeType === "application/vnd.google-apps.folder") {
        return preferred.id;
      }
    }
    const files = await this.listFiles(
      `name = 'Berkas' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      "drive",
    );
    const existing = files.find((file) => file.appProperties?.berkasKind === "root");
    if (existing) return existing.id;

    const response = await this.request(`${DRIVE_API}/files?fields=id`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Berkas",
        mimeType: "application/vnd.google-apps.folder",
        appProperties: { berkasKind: "root", berkasSchema: "1" },
      }),
    });
    return ((await response.json()) as { id: string }).id;
  }

  async listFolderDocuments(folderId: string) {
    return this.listFiles(
      `'${escapeQueryValue(folderId)}' in parents and trashed = false`,
      "drive",
    );
  }

  async findManifest() {
    const files = await this.listFiles(
      `name = 'berkas-index.json' and 'appDataFolder' in parents and trashed = false`,
      "appDataFolder",
    );
    return files.sort((left, right) =>
      (right.modifiedTime ?? "").localeCompare(left.modifiedTime ?? ""),
    )[0] ?? null;
  }

  async downloadBytes(fileId: string) {
    const response = await this.request(`${DRIVE_API}/files/${encodeURIComponent(fileId)}?alt=media`);
    return new Uint8Array(await response.arrayBuffer());
  }

  async downloadManifest(fileId: string) {
    const response = await this.request(`${DRIVE_API}/files/${encodeURIComponent(fileId)}?alt=media`);
    return {
      content: await response.text(),
      etag: response.headers.get("etag"),
    };
  }

  async uploadManifest(content: string, manifestFileId: string | null, etag: string | null) {
    const path = manifestFileId ? `/files/${encodeURIComponent(manifestFileId)}` : "/files";
    const metadata = manifestFileId
      ? { name: "berkas-index.json", mimeType: "application/json" }
      : {
          name: "berkas-index.json",
          parents: ["appDataFolder"],
          mimeType: "application/json",
        };
    const response = await this.request(
      `${DRIVE_UPLOAD_API}${path}?uploadType=resumable&fields=id`,
      {
        method: manifestFileId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Type": "application/json",
          "X-Upload-Content-Length": String(new TextEncoder().encode(content).byteLength),
          ...(etag ? { "If-Match": etag } : {}),
        },
        body: JSON.stringify(metadata),
      },
    );
    const uploadUrl = response.headers.get("location");
    if (!uploadUrl) throw new Error("Google Drive did not return a manifest upload session.");
    const uploadResponse = await this.request(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: content,
    });
    const uploaded = (await uploadResponse.json()) as { id?: string };
    if (!uploaded.id && !manifestFileId) throw new Error("Google Drive did not create the sync index.");
    return uploaded.id ?? manifestFileId!;
  }

  async uploadDocument({
    file,
    folderId,
    documentId,
    title,
    extension,
    mimeType,
    remoteFileId,
  }: {
    file: File;
    folderId: string;
    documentId: string;
    title: string;
    extension: string;
    mimeType: string;
    remoteFileId: string | null;
  }) {
    const metadata = {
      name: `${title.trim()}${extension}`,
      parents: remoteFileId ? undefined : [folderId],
      mimeType,
      appProperties: {
        berkasKind: "document",
        berkasSchema: "1",
        berkasDocumentId: documentId,
      },
    };
    const path = remoteFileId ? `/files/${encodeURIComponent(remoteFileId)}` : "/files";
    const response = await this.request(
      `${DRIVE_UPLOAD_API}${path}?uploadType=resumable&fields=id`,
      {
        method: remoteFileId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Type": mimeType,
          "X-Upload-Content-Length": String(file.size),
        },
        body: JSON.stringify(metadata),
      },
    );
    const uploadUrl = response.headers.get("location");
    if (!uploadUrl) throw new Error("Google Drive did not return an upload session.");

    const uploadResponse = await this.request(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(file.size),
      },
      body: file,
    });
    const uploaded = (await uploadResponse.json()) as { id?: string };
    return uploaded.id ?? remoteFileId ?? documentId;
  }

  async trashFile(fileId: string) {
    await this.request(`${DRIVE_API}/files/${encodeURIComponent(fileId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trashed: true }),
    });
  }
}
