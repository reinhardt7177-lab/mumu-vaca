import { getFirestore } from "firebase/firestore";
import { getFirebaseApp } from "@/lib/firebase/client";

let firestoreDb;

export function getFirestoreClient() {
  if (!firestoreDb) {
    firestoreDb = getFirestore(getFirebaseApp());
  }

  return firestoreDb;
}
