import { Injectable, OnDestroy, signal } from '@angular/core';
import type { DocumentReference, Unsubscribe } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { GIFT_IDS } from './adventure.data';

export function progressErrorMessage(error: unknown, fallback: string): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
  if (code === 'permission-denied') {
    return 'Firebase bloqueó el acceso a esta aventura. Falta habilitar sus permisos; avísale a quien te compartió la página.';
  }
  if (code === 'unavailable') return 'No pudimos conectar con tu aventura. Revisa tu conexión e intenta de nuevo.';
  return fallback;
}
export function normalizeProgress(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((id): id is string => typeof id === 'string' && GIFT_IDS.includes(id)))] : [];
}

@Injectable({ providedIn: 'root' })
export class ProgressService implements OnDestroy {
  readonly found = signal<string[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  private reference?: DocumentReference;
  private unsubscribe?: Unsubscribe;
  private destroyed = false;

  constructor(private readonly firebase: FirebaseService) { void this.connect(); }

  async connect(): Promise<void> {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.loading.set(true);
    this.error.set('');
    try {
      const [db, { doc, onSnapshot }] = await Promise.all([this.firebase.firestore, import('firebase/firestore')]);
      if (this.destroyed) return;
      this.reference = doc(db, 'mamor26Progress', 'birthday');
      this.unsubscribe = onSnapshot(this.reference, { includeMetadataChanges: true }, snapshot => {
        // Do not reveal gifts for local writes that Firestore could still reject.
        if (snapshot.metadata.hasPendingWrites || snapshot.metadata.fromCache) return;
        this.found.set(normalizeProgress(snapshot.data()?.['found']));
        this.loading.set(false);
        this.error.set('');
      }, error => {
        this.loading.set(false);
        this.error.set(progressErrorMessage(error, 'No pudimos cargar tu aventura. Intenta de nuevo.'));
      });
    } catch (error) {
      this.loading.set(false);
      this.error.set(progressErrorMessage(error, 'No pudimos conectar con tu aventura. Intenta de nuevo.'));
    }
  }

  async discover(id: string): Promise<void> {
    if (!GIFT_IDS.includes(id) || this.found().includes(id)) return;
    await this.write(false, id);
  }
  async reset(): Promise<boolean> { return this.write(true); }

  private async write(reset: boolean, id?: string): Promise<boolean> {
    if (!this.reference || this.loading() || this.saving() || this.error()) return false;
    this.saving.set(true);
    this.error.set('');
    try {
      const { setDoc, arrayUnion, serverTimestamp, getDocFromServer } = await import('firebase/firestore');
      await setDoc(this.reference, {
        found: reset ? [] : arrayUnion(id!), updatedAt: serverTimestamp(), version: 1
      }, { merge: true });
      const snapshot = await getDocFromServer(this.reference);
      this.found.set(normalizeProgress(snapshot.data()?.['found']));
      return true;
    } catch (error) {
      this.error.set(progressErrorMessage(error, reset ? 'No pudimos reiniciar la aventura. Intenta de nuevo.'
        : 'No pudimos confirmar que tu estrella quedó guardada. Revisa tu conexión e intenta de nuevo.'));
      return false;
    } finally { this.saving.set(false); }
  }

  ngOnDestroy(): void { this.destroyed = true; this.unsubscribe?.(); }
}
