import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseAuthClient } from "@/lib/firebase/client";
import { getFirestoreClient } from "@/lib/firebase/firestore-client";

function makeInviteCode() {
  const raw = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  return raw.replaceAll("-", "").slice(0, 10).toUpperCase();
}

export async function createStudentInvite({ classId, classCode, grade, className }) {
  const auth = getFirebaseAuthClient();
  const teacher = auth.currentUser;
  if (!teacher) {
    throw new Error("Login is required.");
  }

  const db = getFirestoreClient();
  const safeClassId = String(classId ?? "").trim();
  let safeClassCode = String(classCode ?? "").trim();
  let safeClassName = String(className ?? "").trim();
  let safeGrade = Number(grade);

  if (safeClassId) {
    const classRef = doc(db, "classes", safeClassId);
    const classSnap = await getDoc(classRef);

    if (!classSnap.exists()) {
      throw new Error("Class not found.");
    }

    const classData = classSnap.data();
    if (String(classData.teacherUid ?? "") !== teacher.uid) {
      throw new Error("Only your classes can create invite links.");
    }

    safeClassCode = String(classData.classCode ?? safeClassCode).trim();
    safeClassName = String(classData.className ?? safeClassName).trim();
    safeGrade = Number(classData.grade ?? safeGrade);
  }

  if (!safeClassCode) {
    throw new Error("Class code is required.");
  }

  if (!Number.isFinite(safeGrade) || safeGrade < 1 || safeGrade > 6) {
    throw new Error("Grade must be 1 to 6.");
  }

  const inviteCode = makeInviteCode();
  const inviteRef = doc(db, "student_invites", inviteCode);

  await setDoc(inviteRef, {
    inviteCode,
    classId: safeClassId,
    teacherUid: teacher.uid,
    teacherEmail: teacher.email ?? "",
    classCode: safeClassCode,
    className: safeClassName,
    grade: safeGrade,
    isActive: true,
    archivedAt: null,
    updatedAt: serverTimestamp(),
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
