
"use server";

import { getDb } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp, getDocs, writeBatch, doc, query, where } from "firebase/firestore";

interface LogHistoryInput {
    user: string;
    action: string;
}

export async function logHistory(input: LogHistoryInput) {
  try {
    const db = getDb();
    const logsCollection = collection(db, "ashwani", "data", "history_logs");
    await addDoc(logsCollection, {
      ...input,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error writing to history log:", error);
    // We don't throw here to avoid breaking the user-facing action
  }
}

interface NotificationInput {
    title: string;
    message: string;
    target: "allStaff" | "allAdmins" | { role: "staff" | "phlebo" | "admin" | "patient", id: string };
    link?: string;
}

export async function createNotification(input: NotificationInput) {
    try {
        const db = getDb();
        const batch = writeBatch(db);
        const notificationData = {
            title: input.title,
            message: input.message,
            link: input.link || "#",
            createdAt: serverTimestamp(),
            isRead: false
        };

        if (input.target === "allStaff") {
            const staffCollection = collection(db, "ashwani", "data", "staff");
            const staffSnapshot = await getDocs(staffCollection);
            staffSnapshot.forEach(staffDoc => {
                const notifRef = doc(collection(db, `ashwani/data/staff/${staffDoc.id}/notifications`));
                batch.set(notifRef, notificationData);
            });
        } else if (input.target === "allAdmins") {
            const adminsCollection = query(collection(db, "ashwani", "data", "staff"), where("role", "==", "admin"));
            const adminSnapshot = await getDocs(adminsCollection);
            adminSnapshot.forEach(adminDoc => {
                 const notifRef = doc(collection(db, `ashwani/data/staff/${adminDoc.id}/notifications`));
                 batch.set(notifRef, notificationData);
            });
        } else if (typeof input.target === 'object') {
            const { role, id } = input.target;
            
            let collectionName = "staff"; // default for admin/staff
            if (role === "phlebo") collectionName = "phlebos";
            if (role === "patient") collectionName = "patients";

            const notifRef = doc(collection(db, `ashwani/data/${collectionName}/${id}/notifications`));
            batch.set(notifRef, notificationData);
        }

        await batch.commit();
        
    } catch(error) {
        console.error("Error creating notification:", error);
    }
}
