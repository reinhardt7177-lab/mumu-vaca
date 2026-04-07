import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirestoreClient } from "@/lib/firebase/firestore-client";

function inferRoleFromEmail(email = "") {
  const normalized = String(email).toLowerCase();
  if (normalized.startsWith("teacher")) return "teacher";
  if (normalized.startsWith("admin")) return "admin";
  return "student";
}

export async function ensureFirebaseProfile(user) {
  if (!user?.uid) return null;

  const db = getFirestoreClient();
  const profileRef = doc(db, "profiles", user.uid);
  const profileSnap = await getDoc(profileRef);

  if (!profileSnap.exists()) {
    const profile = {
      uid: user.uid,
      email: user.email ?? "",
      fullName: user.displayName ?? "",
      role: inferRoleFromEmail(user.email),
      grade: 3,
      classCode: "",
      classId: "",
      className: "",
      xp: 0,
      acorns: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(profileRef, profile, { merge: true });
    return { ...profile, createdAt: null, updatedAt: null };
  }

  const current = profileSnap.data();
  const shouldUpdate =
    (user.email ?? "") !== (current.email ?? "") ||
    (user.displayName ?? "") !== (current.fullName ?? "");

  if (shouldUpdate) {
    await setDoc(
      profileRef,
      {
        email: user.email ?? current.email ?? "",
        fullName: user.displayName ?? current.fullName ?? "",
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  }

  return current;
}

export async function ensureFirebaseProfileWithDefaults(user, defaults = {}) {
  if (!user?.uid) return null;

  const db = getFirestoreClient();
  const profileRef = doc(db, "profiles", user.uid);
  const profileSnap = await getDoc(profileRef);

  if (!profileSnap.exists()) {
    const profile = {
      uid: user.uid,
      email: user.email ?? "",
      fullName: defaults.fullName ?? user.displayName ?? "",
      role: defaults.role ?? inferRoleFromEmail(user.email),
      grade: defaults.grade ?? 3,
      classCode: defaults.classCode ?? "",
      classId: defaults.classId ?? "",
      className: defaults.className ?? "",
      teacherUid: defaults.teacherUid ?? "",
      inviteCode: defaults.inviteCode ?? "",
      xp: 0,
      acorns: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(profileRef, profile, { merge: true });
    return { ...profile, createdAt: null, updatedAt: null };
  }

  const current = profileSnap.data();
  const nextEmail = user.email ?? current.email ?? "";
  const nextFullName = defaults.fullName ?? user.displayName ?? current.fullName ?? "";
  const nextGrade = defaults.grade ?? current.grade ?? 3;
  const nextClassCode = defaults.classCode ?? current.classCode ?? "";
  const nextClassId = defaults.classId ?? current.classId ?? "";
  const nextClassName = defaults.className ?? current.className ?? "";
  const nextTeacherUid = defaults.teacherUid ?? current.teacherUid ?? "";
  const nextInviteCode = defaults.inviteCode ?? current.inviteCode ?? "";

  const shouldUpdate =
    nextEmail !== (current.email ?? "") ||
    nextFullName !== (current.fullName ?? "") ||
    nextGrade !== (current.grade ?? 3) ||
    nextClassCode !== (current.classCode ?? "") ||
    nextClassId !== (current.classId ?? "") ||
    nextClassName !== (current.className ?? "") ||
    nextTeacherUid !== (current.teacherUid ?? "") ||
    nextInviteCode !== (current.inviteCode ?? "");

  if (shouldUpdate) {
    await setDoc(
      profileRef,
      {
        email: nextEmail,
        fullName: nextFullName,
        grade: nextGrade,
        classCode: nextClassCode,
        classId: nextClassId,
        className: nextClassName,
        teacherUid: nextTeacherUid,
        inviteCode: nextInviteCode,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  }

  return {
    ...current,
    email: nextEmail,
    fullName: nextFullName,
    grade: nextGrade,
    classCode: nextClassCode,
    classId: nextClassId,
    className: nextClassName,
    teacherUid: nextTeacherUid,
    inviteCode: nextInviteCode
  };
}
