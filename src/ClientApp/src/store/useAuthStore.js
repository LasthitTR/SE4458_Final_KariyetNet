import { create } from 'zustand';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { app } from '../firebaseConfig';

const auth = getAuth(app);

const useAuthStore = create((set) => ({
  user: null,
  session: null,
  isLoading: true,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (isLoading) => set({ isLoading }),

  signIn: async (email, password) => {
    set({ isLoading: true });
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      set({ isLoading: false });
      return userCredential.user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signUp: async (email, password) => {
    set({ isLoading: true });
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      set({ isLoading: false });
      return userCredential.user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    await signOut(auth);
    set({ user: null, session: null, isLoading: false });
  },

  initializeAuth: () => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // user object is returned directly by Firebase
        const token = await user.getIdToken();
        // create a session-like object for axios interceptor compatibility
        const session = { access_token: token };
        set({ user, session, isLoading: false });
      } else {
        set({ user: null, session: null, isLoading: false });
      }
    });
  }
}));

export default useAuthStore;
