import type { ClipReference } from "../core/model";
import { ClipAssetIntegrityError, type ClipAssetStore } from "./clip-asset-store";
import { sha256Blob } from "./clip-reference";

const STORE_NAME = "clips";

function openDatabase(factory: IDBFactory, name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(name, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open the clip asset database."));
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Clip asset transaction failed."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Clip asset transaction was aborted."));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Clip asset request failed."));
  });
}

function isBlob(value: unknown): value is Blob {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Blob).arrayBuffer === "function" &&
    typeof (value as Blob).size === "number"
  );
}

export class IndexedDbClipAssetStore implements ClipAssetStore {
  constructor(
    private readonly factory?: IDBFactory,
    private readonly databaseName = "tickerbeat-clips-v1",
  ) {}

  private browserFactory(): IDBFactory {
    const factory = this.factory ?? globalThis.indexedDB;
    if (!factory) throw new Error("IndexedDB is not available in this environment.");
    return factory;
  }

  async put(reference: ClipReference, blob: Blob): Promise<void> {
    if ((await sha256Blob(blob)) !== reference.sha256) {
      throw new ClipAssetIntegrityError(reference.assetId);
    }

    const database = await openDatabase(this.browserFactory(), this.databaseName);
    try {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(blob, reference.assetId);
      await transactionComplete(transaction);
    } finally {
      database.close();
    }
  }

  async get(reference: ClipReference): Promise<Blob | null> {
    const database = await openDatabase(this.browserFactory(), this.databaseName);
    try {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const result = await requestResult(transaction.objectStore(STORE_NAME).get(reference.assetId));
      await transactionComplete(transaction);
      if (!isBlob(result)) return null;
      if ((await sha256Blob(result)) !== reference.sha256) {
        throw new ClipAssetIntegrityError(reference.assetId);
      }
      return result;
    } finally {
      database.close();
    }
  }

  async delete(assetId: string): Promise<void> {
    const database = await openDatabase(this.browserFactory(), this.databaseName);
    try {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).delete(assetId);
      await transactionComplete(transaction);
    } finally {
      database.close();
    }
  }
}
