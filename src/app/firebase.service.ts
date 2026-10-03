import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import { firebaseConfig } from './firebase.config';

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  readonly app = initializeApp(firebaseConfig, 'mamor26');
  private firestorePromise?: Promise<Firestore>;
  get firestore(): Promise<Firestore> {
    return this.firestorePromise ??= import('firebase/firestore').then(({ getFirestore }) => getFirestore(this.app));
  }
}
