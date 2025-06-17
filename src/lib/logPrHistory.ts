import { getFirestore, collection, addDoc, setDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '@/firebase/firebase';

const db = getFirestore(app);

export async function logPrHistory({
  prId,
  repo,
  title,
  status,
  createdBy,
  createdAt,
  mergedAt,
  sourceBranch,
  targetBranch,
  aiReview,
}: {
  prId: number,
  repo: string,
  title: string,
  status: 'open' | 'merged' | 'closed',
  createdBy: string,
  createdAt: string,
  mergedAt?: string,
  sourceBranch: string,
  targetBranch: string,
  aiReview?: string,
}) {
  // Firestore doc path must have even segments: 'prHistory/{owner}__{repo}/prs/{prId}'
  const [owner, ...repoParts] = repo.split('/');
  const repoName = repoParts.join('_');
  const prDoc = doc(db, 'prHistory', `${owner}__${repoName}`, 'prs', String(prId));
  await setDoc(prDoc, {
    prId,
    repo,
    title,
    status,
    createdBy,
    createdAt,
    mergedAt: mergedAt || null,
    sourceBranch,
    targetBranch,
    aiReview: aiReview || null,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
