import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

function ensureFirebaseAdminInitialized() {
  console.log('[CustomToken] RAW ENV:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH);
  console.log('[CustomToken] admin:', admin);
  console.log('[CustomToken] admin.credential:', admin.credential);
  if (!admin.apps.length) {
    let serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
    if (serviceAccountPath && serviceAccountPath.startsWith('"') && serviceAccountPath.endsWith('"')) {
      serviceAccountPath = serviceAccountPath.slice(1, -1); // Remove quotes if present
    }
    const resolvedPath = path.resolve(process.cwd(), serviceAccountPath || '');
    console.log('[CustomToken] Resolved service account path:', resolvedPath);
    if (!fs.existsSync(resolvedPath)) {
      console.error('[CustomToken] Service account file does not exist at:', resolvedPath);
      return;
    }
    if (fs.lstatSync(resolvedPath).isDirectory()) {
      console.error('[CustomToken] Service account path is a directory, not a file:', resolvedPath);
      return;
    }
    let serviceAccount = undefined;
    try {
      serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
    } catch (err) {
      console.error('[CustomToken] Failed to read or parse service account JSON:', err, 'at', resolvedPath);
    }
    if (serviceAccount) {
      // Fix: Check that admin.credential exists before using it
      if (!admin.credential || typeof admin.credential.cert !== 'function') {
        throw new Error('[CustomToken] firebase-admin module is not loaded correctly or credential API is missing.');
      }
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL && process.env.FIREBASE_DATABASE_URL.replace(/"/g, ''),
      });
      console.log('[CustomToken] Firebase Admin initialized.');
    } else {
      console.error('[CustomToken] Service account JSON is missing or invalid.');
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    ensureFirebaseAdminInitialized(); // Ensure Firebase Admin is initialized
    const { githubToken } = await req.json();
    if (!githubToken) {
      console.error('[CustomToken] Missing GitHub token in request body');
      return NextResponse.json({ error: 'Missing GitHub token' }, { status: 400 });
    }
    // Verify GitHub token and get user info
    const ghRes = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'IntelliGit-Auth',
      },
    });
    const userInfo = await ghRes.json();
    if (!userInfo.id) {
      console.error('[CustomToken] Invalid GitHub token or failed to fetch user info:', userInfo);
      return NextResponse.json({ error: 'Invalid GitHub token', githubResponse: userInfo }, { status: 401 });
    }
    const uid = `github:${userInfo.id}`;
    let customToken;
    try {
      customToken = await admin.auth().createCustomToken(uid, {
        githubUsername: userInfo.login,
        email: userInfo.email || '',
      });
    } catch (err: any) {
      console.error('[CustomToken] Firebase Admin createCustomToken error:', err);
      return NextResponse.json({ error: err.message || 'Failed to create custom token', details: err }, { status: 500 });
    }
    return NextResponse.json({ customToken });
  } catch (e: any) {
    console.error('[CustomToken] Unexpected error:', e);
    return NextResponse.json({ error: e.message || 'Failed to create custom token', details: e }, { status: 500 });
  }
}
