import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where, writeBatch } from "firebase/firestore";
import { getFirebaseAuthClient } from "@/lib/firebase/client";
import { getFirestoreClient } from "@/lib/firebase/firestore-client";
import { ensureFirebaseProfileWithDefaults } from "@/lib/firebase/profile";

function toMillis(value) {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  return 0;
}

function safeText(value) {
  return String(value ?? "").trim();
}

function normalizeClassCode(value) {
  return safeText(value).toUpperCase().replaceAll(" ", "-");
}

function isPermissionDenied(error) {
  return String(error?.code ?? "") === "permission-denied";
}

async function getTeacherSession() {
  const auth = getFirebaseAuthClient();
  const user = auth.currentUser;
  if (!user) {
    throw new Error("로그인이 필요해요.");
  }

  const profile = await ensureFirebaseProfileWithDefaults(user, { role: "teacher" });
  const role = String(profile?.role ?? "");

  if (!["teacher", "admin"].includes(role)) {
    throw new Error("교사 권한이 필요해요.");
  }

  return { user, role };
}

async function getClassDocOrThrow(classId, teacherUid) {
  const db = getFirestoreClient();
  const classRef = doc(db, "classes", classId);
  const classSnap = await getDoc(classRef);

  if (!classSnap.exists()) {
    throw new Error("학급을 찾을 수 없어요.");
  }

  const classData = classSnap.data();
  if (String(classData.teacherUid ?? "") !== String(teacherUid)) {
    throw new Error("내 학급만 관리할 수 있어요.");
  }

  return { classRef, classData };
}

export async function createTeacherClass({ className, classCode, grade }) {
  const { user } = await getTeacherSession();
  const db = getFirestoreClient();

  const safeName = safeText(className);
  if (!safeName) {
    throw new Error("학급 이름을 입력해 주세요.");
  }

  const safeGrade = Number(grade);
  if (!Number.isFinite(safeGrade) || safeGrade < 1 || safeGrade > 6) {
    throw new Error("학년은 1~6 사이여야 해요.");
  }

  const normalizedCode = normalizeClassCode(classCode || `${safeGrade}-${safeName}`);
  if (!normalizedCode) {
    throw new Error("학급 코드를 입력해 주세요.");
  }

  const classRef = doc(collection(db, "classes"));
  await setDoc(classRef, {
    classId: classRef.id,
    className: safeName,
    classCode: normalizedCode,
    grade: safeGrade,
    teacherUid: user.uid,
    teacherEmail: user.email ?? "",
    isArchived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return {
    classId: classRef.id,
    className: safeName,
    classCode: normalizedCode,
    grade: safeGrade
  };
}

async function getClassStudentsInternal({ classId, classCode, teacherUid }) {
  const db = getFirestoreClient();
  const studentsQuery = query(
    collection(db, "profiles"),
    where("teacherUid", "==", teacherUid),
    where("role", "==", "student")
  );
  const studentsSnap = await getDocs(studentsQuery);

  return studentsSnap.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .filter((item) => {
      if (String(item.role ?? "") !== "student") return false;
      if (String(item.teacherUid ?? "") !== String(teacherUid)) return false;
      if (String(item.classId ?? "") === String(classId)) return true;
      return String(item.classCode ?? "") === String(classCode);
    })
    .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
}

async function getClassInvitesInternal({ classId, teacherUid }) {
  const db = getFirestoreClient();
  const invitesQuery = query(collection(db, "student_invites"), where("teacherUid", "==", teacherUid));
  const invitesSnap = await getDocs(invitesQuery);

  return invitesSnap.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .filter((item) => String(item.classId ?? "") === String(classId))
    .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
}

export async function listTeacherClasses() {
  const { user } = await getTeacherSession();
  const db = getFirestoreClient();

  const classesQuery = query(collection(db, "classes"), where("teacherUid", "==", user.uid));
  const classesSnap = await getDocs(classesQuery);

  const classes = await Promise.all(
    classesSnap.docs.map(async (item) => {
      const classData = item.data();
      if (classData.isArchived === true) return null;

      const classId = String(classData.classId ?? item.id);
      const classCode = String(classData.classCode ?? "");
      let students = [];
      let invites = [];

      try {
        students = await getClassStudentsInternal({ classId, classCode, teacherUid: user.uid });
      } catch (error) {
        if (!isPermissionDenied(error)) {
          throw error;
        }
      }

      try {
        invites = await getClassInvitesInternal({ classId, teacherUid: user.uid });
      } catch (error) {
        if (!isPermissionDenied(error)) {
          throw error;
        }
      }

      return {
        classId,
        className: String(classData.className ?? classCode),
        classCode,
        grade: Number(classData.grade ?? 3),
        studentCount: students.length,
        activeInviteCount: invites.filter((invite) => invite.isActive === true).length,
        createdAtMs: toMillis(classData.createdAt)
      };
    })
  );

  return classes
    .filter(Boolean)
    .sort((a, b) => b.createdAtMs - a.createdAtMs);
}

export async function getTeacherClassBoard(classId) {
  const { user } = await getTeacherSession();
  const { classData } = await getClassDocOrThrow(classId, user.uid);

  const classInfo = {
    classId: String(classData.classId ?? classId),
    className: String(classData.className ?? classData.classCode ?? ""),
    classCode: String(classData.classCode ?? ""),
    grade: Number(classData.grade ?? 3)
  };

  let students = [];
  let invites = [];

  try {
    students = await getClassStudentsInternal({ classId: classInfo.classId, classCode: classInfo.classCode, teacherUid: user.uid });
  } catch (error) {
    if (!isPermissionDenied(error)) {
      throw error;
    }
  }

  try {
    invites = await getClassInvitesInternal({ classId: classInfo.classId, teacherUid: user.uid });
  } catch (error) {
    if (!isPermissionDenied(error)) {
      throw error;
    }
  }

  return {
    classInfo,
    students,
    invites,
    studentCount: students.length,
    activeInviteCount: invites.filter((invite) => invite.isActive === true).length
  };
}

export async function deleteTeacherClass(classId) {
  const { user } = await getTeacherSession();
  const { classRef } = await getClassDocOrThrow(classId, user.uid);
  const db = getFirestoreClient();

  const invitesQuery = query(
    collection(db, "student_invites"),
    where("classId", "==", classId),
    where("teacherUid", "==", user.uid)
  );
  const invitesSnap = await getDocs(invitesQuery);

  if (!invitesSnap.empty) {
    const batch = writeBatch(db);
    invitesSnap.docs.forEach((inviteDoc) => {
      batch.set(
        inviteDoc.ref,
        {
          isActive: false,
          archivedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    });
    await batch.commit();
  }

  await deleteDoc(classRef);
}
