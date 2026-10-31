import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  public loadFromStorage<T>(storageKey: string, defaultValue: T): T {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {

      const storedData = localStorage.getItem(storageKey);

      if (storedData !== null && storedData !== "undefined") {
        try {
          return JSON.parse(storedData) as T;
        } catch (error) {
          console.error("Error parsing JSON from localStorage", error);
          return defaultValue;
        }
      }
    }
    return defaultValue;
  }

  public saveToStorage<T>(storageKey: string, data: T, maxBytes: number = 5 * 1024 * 1024): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {

      // Validar si los datos son nulos o indefinidos para evitar fallos
      if (data === undefined || data === null) {
        localStorage.removeItem(storageKey);
        return;
      }

      // Serializar los nuevos datos y calcular su tamaño
      const serializedData = JSON.stringify(data);
      const newDataSize = storageKey.length + serializedData.length;

      // Calcular el tamaño actual del storageKey
      const currentSize = this.getLocalStorageSizeForKey(storageKey);

      // Verificar si el tamaño total superará el límite
      if (currentSize + newDataSize > maxBytes) {
        // Borrar todos los datos asociados al storageKey
        localStorage.removeItem(storageKey);
      }

      // Guardar los datos en el Local Storage
      localStorage.setItem(storageKey, serializedData);

      // Registrar el tamaño actual
      this.logStorageSizeForKey(storageKey);
    }
  }

  public removeFromStorage(storageKey: string): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
  }

  // Borrar absolutamente todo el Local Storage
  public clearAllStorage(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
  }

  // Obtener el tamaño del Local Storage para un storageKey específico
  getLocalStorageSizeForKey(storageKey: string): number {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        return storageKey.length + storedData.length;
      }
    }
    return 0;
  }

  // Formatear el tamaño en bytes a KB/MB
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Mostrar el tamaño actual del Local Storage para un storageKey específico
  logStorageSizeForKey(storageKey: string): void {
    const sizeInBytes = this.getLocalStorageSizeForKey(storageKey);
    //console.log(`'${storageKey}': ${this.formatBytes(sizeInBytes)}`);
  }
}
