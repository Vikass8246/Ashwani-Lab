
"use server";

import { adminAssistant, type AdminAssistantInput, type AdminAssistantOutput } from "@/ai/flows/admin-assistant";
import { logHistory } from "./actions/log-history";
import { getFirebaseAuth } from "@/lib/firebase/config";

export async function handleAdminAction(input: AdminAssistantInput): Promise<AdminAssistantOutput> {
  try {
    const output = await adminAssistant(input);
    if (output.success) {
        const auth = getFirebaseAuth();
        const user = auth.currentUser;
        const actor = user?.displayName || user?.email || 'Admin';
        await logHistory({
            user: actor,
            action: `Performed admin action: ${input.action} ${input.entityType}. Details: ${input.entityDetails.substring(0, 50)}...`
        })
    }
    return output;
  } catch (error) {
    console.error("Error in admin action:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again later.",
    };
  }
}

