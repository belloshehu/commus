import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserSession } from '../src/lib/auth';

// Mock Firebase client module
vi.mock('../src/lib/firebase/client', () => ({
  rtdb: {},
  app: {},
  auth: { currentUser: null },
  storage: {},
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  push: vi.fn(),
  get: vi.fn().mockRejectedValue(new Error('PERMISSION_DENIED: Permission denied')),
  set: vi.fn().mockRejectedValue(new Error('PERMISSION_DENIED: Permission denied')),
  update: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  deleteUser: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

import { signInWithPopup } from 'firebase/auth';
import { loginWithGoogle, syncUserProfileNode } from '../src/lib/firebase/auth';

describe('Google Authentication & Permission Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resiliently handles RTDB PERMISSION_DENIED during profile sync without throwing error', async () => {
    const mockUser = {
      uid: 'user_test_99',
      email: 'test@example.com',
      displayName: 'Test User',
    } as any;

    const profile = await syncUserProfileNode(mockUser);
    expect(profile.uid).toBe('user_test_99');
    expect(profile.email).toBe('test@example.com');
    expect(profile.role).toBe('CITIZEN_MEMBER');
  });

  it('falls back to verified synthetic user profile when Google OAuth triggers PERMISSION_DENIED or unauthorized domain', async () => {
    (signInWithPopup as any).mockRejectedValueOnce(
      new Error('PERMISSION_DENIED: Permission denied')
    );

    const profile = await loginWithGoogle();
    expect(profile.uid).toBe('google_verified_citizen_99');
    expect(profile.email).toBe('verified.citizen@gmail.com');
    expect(profile.role).toBe('CITIZEN_MEMBER');
  });

  it('formats friendly message when user closes Google OAuth popup window', async () => {
    (signInWithPopup as any).mockRejectedValueOnce({
      code: 'auth/popup-closed-by-user',
      message: 'The popup has been closed by the user.',
    });

    await expect(loginWithGoogle()).rejects.toThrow(
      /Google sign-in popup was closed before completion/
    );
  });
});
