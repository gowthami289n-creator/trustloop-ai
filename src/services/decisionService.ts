import {
  db,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy
} from '../lib/firebase';
import type { DecisionEntry, ActualOutcome, PromiseToOutcomeGap } from '../types';

export async function fetchUserDecisions(userId: string): Promise<DecisionEntry[]> {
  try {
    const decisionsRef = collection(db, 'users', userId, 'decisions');
    const q = query(decisionsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const results: DecisionEntry[] = [];
    snapshot.forEach((docSnap) => {
      results.push({
        id: docSnap.id,
        ...docSnap.data(),
      } as DecisionEntry);
    });

    return results;
  } catch (error) {
    console.error('Error fetching decisions from Firestore:', error);
    // Fallback to local storage if offline or permissions pending
    const localData = localStorage.getItem(`trustloop_decisions_${userId}`);
    if (localData) {
      try {
        return JSON.parse(localData);
      } catch (e) {
        return [];
      }
    }
    return [];
  }
}

export async function saveDecision(
  userId: string,
  decision: Omit<DecisionEntry, 'id' | 'userId'>
): Promise<DecisionEntry> {
  const newId = `dec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const fullEntry: DecisionEntry = {
    ...decision,
    id: newId,
    userId,
  };

  try {
    const docRef = doc(db, 'users', userId, 'decisions', newId);
    await setDoc(docRef, fullEntry);
  } catch (error) {
    console.warn('Could not write directly to Firestore (saving locally):', error);
  }

  // Backup to localStorage for high availability
  try {
    const localData = localStorage.getItem(`trustloop_decisions_${userId}`);
    const list: DecisionEntry[] = localData ? JSON.parse(localData) : [];
    list.unshift(fullEntry);
    localStorage.setItem(`trustloop_decisions_${userId}`, JSON.stringify(list));
  } catch (e) {
    console.error('Local backup failed:', e);
  }

  return fullEntry;
}

export async function updateDecision(
  userId: string,
  decisionId: string,
  updates: Partial<DecisionEntry>
): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId, 'decisions', decisionId);
    await setDoc(docRef, updates, { merge: true });
  } catch (error) {
    console.warn('Could not update Firestore document (updating locally):', error);
  }

  // Update local storage
  try {
    const localData = localStorage.getItem(`trustloop_decisions_${userId}`);
    if (localData) {
      const list: DecisionEntry[] = JSON.parse(localData);
      const idx = list.findIndex((item) => item.id === decisionId);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates };
        localStorage.setItem(`trustloop_decisions_${userId}`, JSON.stringify(list));
      }
    }
  } catch (e) {
    console.error('Local update backup failed:', e);
  }
}

export async function deleteDecision(userId: string, decisionId: string): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId, 'decisions', decisionId);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Could not delete from Firestore:', error);
  }

  try {
    const localData = localStorage.getItem(`trustloop_decisions_${userId}`);
    if (localData) {
      let list: DecisionEntry[] = JSON.parse(localData);
      list = list.filter((item) => item.id !== decisionId);
      localStorage.setItem(`trustloop_decisions_${userId}`, JSON.stringify(list));
    }
  } catch (e) {
    console.error('Local delete failed:', e);
  }
}

export async function recordOutcomeForDecision(
  userId: string,
  decisionId: string,
  outcome: ActualOutcome,
  gapAnalysis: PromiseToOutcomeGap
): Promise<void> {
  const updates: Partial<DecisionEntry> = {
    decisionStatus: 'outcome_recorded',
    outcomeDate: new Date().toISOString(),
    actualOutcome: {
      ...outcome,
      gapAnalysis,
    },
  };

  await updateDecision(userId, decisionId, updates);
}
