import { getFirestore, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { app } from '@/firebase/firebase';

const db = getFirestore(app);

export async function getPrHistory({ status, repo }: { status?: string, repo?: string }) {
  let q = collection(db, 'prHistory');
  let constraints: any[] = [];
  if (status && status !== 'all') constraints.push(where('status', '==', status));
  if (repo) constraints.push(where('repo', '==', repo));
  constraints.push(orderBy('createdAt', 'desc'));
  const finalQuery = constraints.length > 1 ? query(q, ...constraints) : q;
  const snap = await getDocs(finalQuery);
  return snap.docs.map(doc => doc.data());
}
