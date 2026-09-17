import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  deleteUser,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, rtdb } from './client';
import { UserRole } from '../auth';

export interface UserProfileData {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  communityIds: Record<string, boolean>;
  createdAt: number;
}

const googleProvider = new GoogleAuthProvider();

/**
 * Ensures user profile nodes exist in RTDB upon login/register.
 */
export async function syncUserProfileNode(user: FirebaseUser, displayName?: string, communityId: string = 'comm_central'): Promise<UserProfileData> {
  const userRef = ref(rtdb, `users/${user.uid}`);
  const userSnapshot = await get(userRef);

  let profileData: UserProfileData;

  if (userSnapshot.exists()) {
    const existing = userSnapshot.val();
    profileData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || displayName || 'Verified Citizen',
      role: existing.role || 'CITIZEN_MEMBER',
      communityIds: existing.communityIds || { [communityId]: true },
      createdAt: existing.createdAt || Date.now(),
    };
  } else {
    // Initial profile creation for new user
    profileData = {
      uid: user.uid,
      email: user.email,
      displayName: displayName || user.displayName || 'Verified Citizen',
      role: 'CITIZEN_MEMBER',
      communityIds: { [communityId]: true },
      createdAt: Date.now(),
    };

    // Public/System node
    await set(ref(rtdb, `users/${user.uid}`), {
      role: profileData.role,
      communityIds: profileData.communityIds,
      createdAt: profileData.createdAt,
    });

    // Private PII node (Readable ONLY by $uid or System Admin)
    await set(ref(rtdb, `userPrivateProfiles/${user.uid}`), {
      email: profileData.email,
      displayName: profileData.displayName,
      createdAt: profileData.createdAt,
    });
  }

  return profileData;
}

/**
 * Register with Email and Password
 */
export async function registerWithEmailPassword(
  email: string,
  pass: string,
  displayName: string,
  communityId?: string
): Promise<UserProfileData> {
  const credential = await createUserWithEmailAndPassword(auth, email, pass);
  return await syncUserProfileNode(credential.user, displayName, communityId);
}

/**
 * Login with Email and Password
 */
export async function loginWithEmailPassword(
  email: string,
  pass: string
): Promise<UserProfileData> {
  const credential = await signInWithEmailAndPassword(auth, email, pass);
  return await syncUserProfileNode(credential.user);
}

/**
 * Login / Register with Google OAuth
 */
export async function loginWithGoogle(): Promise<UserProfileData> {
  const credential = await signInWithPopup(auth, googleProvider);
  return await syncUserProfileNode(credential.user);
}

/**
 * Logout User
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Send Password Reset Link
 */
export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Delete User Account Flow
 */
export async function deleteUserAccount(): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('UNAUTHORIZED: No active user session to delete.');
  }

  // Remove profile nodes
  await set(ref(rtdb, `users/${currentUser.uid}`), null);
  await set(ref(rtdb, `userPrivateProfiles/${currentUser.uid}`), null);

  // Delete Firebase Auth user
  await deleteUser(currentUser);
}

/**
 * Subscribe to Auth State Changes
 */
export function subscribeToAuthState(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
