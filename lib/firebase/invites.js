import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseAuthClient } from "@/lib/firebase/client";
import { getFirestoreClient } from "@/lib/firebase/firestore-client";

function makeInviteCode() {
  const raw = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  return raw.replaceAll("-", "").slice(0, 10).toUpperCase();
}

export async function createStudentInvite({ classCode, grade }) {
  const auth = getFirebaseAuthClient();
  const teacher = auth.currentUser;
  if (!teacher) {
    throw new Error("Login is required.");
  }

  const inviteCode = makeInviteCode();
  const db = getFirestoreClient();
  const inviteRef = doc(db, "student_invites", inviteCode);

  const safeClassCode = String(classCode ?? "").trim();
  if (!safeClassCode) {
    throw new Error("Class code is required.");
  }

  const safeGrade = Number(grade);
  if (!Number.isFinite(safeGrade) || safeGrade < 1 || safeGrade > 6) {
    throw new Error("Grade must be 1 to 6.");
  }

  await setDoc(inviteRef, {
    inviteCode,
    teacherUid: teacher.uid,
    teacherEmail: teacher.email ?? "",
    classCode: safeClassCode,
    grade: safeGrade,
    isActive: true,
    createdAt: serverTimestamp()
  });

  return inviteCode;
}

export async function getStudentInvite(inviteCode) {
  const code = String(inviteCode ?? "").trim().toUpperCase();
  if (!code) return null;

  const db = getFirestoreClient();
  const inviteRef = doc(db, "student_invites", code);
  const snap = await getDoc(inviteRef);

  if (!snap.exists()) {
    return null;
  }

  return snap.data();
}
