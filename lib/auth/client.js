import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile
} from "firebase/auth";
import { getFirebaseAuthClient, isFirebaseConfigured } from "@/lib/firebase/client";
import { getStudentInvite } from "@/lib/firebase/invites";
import { ensureFirebaseProfile, ensureFirebaseProfileWithDefaults } from "@/lib/firebase/profile";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

function normalizeUser(user, provider, extras = {}) {
  if (!user) return null;

  if (provider === "firebase") {
    return {
      id: user.uid,
      email: user.email ?? "",
      provider,
      role: extras.role ?? null
    };
  }

  return {
    id: user.id,
    email: user.email ?? "",
    provider,
    role: extras.role ?? null
  };
}

async function getFirebaseSessionUser() {
  const auth = getFirebaseAuthClient();
  if (auth.currentUser) return normalizeUser(auth.currentUser, "firebase");

  const user = await new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(auth.currentUser ?? null), 800);
    const unsubscribe = onAuthStateChanged(auth, (value) => {
      clearTimeout(timeout);
      unsubscribe();
      resolve(value ?? null);
    });
  });

  return normalizeUser(user, "firebase");
}

function isFirebaseCredentialError(error) {
  const code = String(error?.code ?? "");
  return (
    code === "auth/user-not-found" ||
    code === "auth/invalid-credential" ||
    code === "auth/invalid-login-credentials"
  );
}

export function normalizeLoginIdToEmail(loginId, fallbackDomain = "fairy-class.local") {
  const trimmed = String(loginId ?? "").trim().toLowerCase();
  if (!trimmed) return "";
  if (trimmed.includes("@")) return trimmed;
  return `${trimmed}@${fallbackDomain}`;
}

export async function signInWithSimpleAccount({ email, password, autoCreate = false }) {
  if (isFirebaseConfigured()) {
    const auth = getFirebaseAuthClient();

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const profile = await ensureFirebaseProfile(result.user);
      return normalizeUser(result.user, "firebase", { role: profile?.role ?? null });
    } catch (error) {
      if (!autoCreate || !isFirebaseCredentialError(error)) {
        throw error;
      }

      const created = await createUserWithEmailAndPassword(auth, email, password);
      const profile = await ensureFirebaseProfile(created.user);
      return normalizeUser(created.user, "firebase", { role: profile?.role ?? null });
    }
  }

  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return normalizeUser(data.user, "supabase");
}

export async function signInWithCredentials({ loginId, password }) {
  const email = normalizeLoginIdToEmail(loginId);
  if (!email) {
    throw new Error("Please enter your ID.");
  }

  const safePassword = String(password ?? "").trim();
  if (!safePassword) {
    throw new Error("Please enter your password.");
  }

  return signInWithSimpleAccount({
    email,
    password: safePassword,
    autoCreate: false
  });
}

export async function signInTeacherWithGoogle() {
  if (!isFirebaseConfigured()) {
    throw new Error("Google login needs Firebase config.");
  }

  const auth = getFirebaseAuthClient();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const result = await signInWithPopup(auth, provider);
  const profile = await ensureFirebaseProfileWithDefaults(result.user, {
    role: "teacher",
    fullName: result.user.displayName ?? ""
  });

  return normalizeUser(result.user, "firebase", { role: profile?.role ?? "teacher" });
}

export async function signUpTeacher({ email, password, fullName }) {
  if (isFirebaseConfigured()) {
    const auth = getFirebaseAuthClient();
    const safeEmail = normalizeLoginIdToEmail(email);
    const safePassword = String(password ?? "").trim();
    const safeFullName = String(fullName ?? "").trim();

    if (!safeEmail || !safePassword) {
      throw new Error("Email and password are required.");
    }

    const created = await createUserWithEmailAndPassword(auth, safeEmail, safePassword);
    if (safeFullName) {
      await updateProfile(created.user, { displayName: safeFullName });
    }

    const profile = await ensureFirebaseProfileWithDefaults(created.user, {
      role: "teacher",
      fullName: safeFullName
    });

    return normalizeUser(created.user, "firebase", { role: profile?.role ?? "teacher" });
  }

  const supabase = createBrowserSupabaseClient();
  const safeEmail = normalizeLoginIdToEmail(email);
  const safePassword = String(password ?? "").trim();

  const { data, error } = await supabase.auth.signUp({
    email: safeEmail,
    password: safePassword
  });
  if (error) throw error;

  return normalizeUser(data.user, "supabase", { role: "teacher" });
}

export async function signUpStudentWithInvite({ inviteCode, loginId, password, fullName }) {
  if (!isFirebaseConfigured()) {
    throw new Error("Student invite signup needs Firebase config.");
  }

  const invite = await getStudentInvite(inviteCode);
  if (!invite || !invite.isActive) {
    throw new Error("Invalid invite code.");
  }

  const auth = getFirebaseAuthClient();
  const safeEmail = normalizeLoginIdToEmail(loginId, "student.mumuclass.local");
  const safePassword = String(password ?? "").trim();
  const safeFullName = String(fullName ?? "").trim();

  if (!safeEmail || !safePassword) {
    throw new Error("ID and password are required.");
  }

  const created = await createUserWithEmailAndPassword(auth, safeEmail, safePassword);
  if (safeFullName) {
    await updateProfile(created.user, { displayName: safeFullName });
  }

  const profile = await ensureFirebaseProfileWithDefaults(created.user, {
    role: "student",
    fullName: safeFullName,
    grade: Number(invite.grade ?? 3),
    classId: String(invite.classId ?? ""),
    classCode: String(invite.classCode ?? ""),
    className: String(invite.className ?? ""),
    teacherUid: String(invite.teacherUid ?? ""),
    inviteCode: String(invite.inviteCode ?? String(inviteCode ?? "").toUpperCase())
  });

  return normalizeUser(created.user, "firebase", { role: profile?.role ?? "student" });
}

export async function getSessionUser() {
  if (isFirebaseConfigured()) {
    const user = await getFirebaseSessionUser();
    if (!user) return null;

    try {
      const auth = getFirebaseAuthClient();
      const profile = await ensureFirebaseProfile(auth.currentUser);
      return { ...user, role: profile?.role ?? null };
    } catch {
      return user;
    }
  }

  const supabase = createBrowserSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return normalizeUser(user, "supabase");
}

export async function signOutSession() {
  if (isFirebaseConfigured()) {
    const auth = getFirebaseAuthClient();
    await firebaseSignOut(auth);
    return;
  }

  const supabase = createBrowserSupabaseClient();
  await supabase.auth.signOut();
}


