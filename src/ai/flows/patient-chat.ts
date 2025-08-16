
'use server';
/**
 * @fileOverview Patient-facing chatbot AI flow.
 *
 * - patientChat - A function that handles the chatbot conversation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getDb } from '@/lib/firebase/config';
import { Appointment, Test } from '@/lib/data';

// --- Schemas ---
const PatientChatInputSchema = z.object({
  patientId: z.string().describe("The authenticated patient's ID."),
  message: z.string().describe('The message from the patient.'),
  history: z.array(z.any()).optional().describe('The conversation history.'),
});
type PatientChatInput = z.infer<typeof PatientChatInputSchema>;

const PatientChatOutputSchema = z.object({
  reply: z.string().describe("The chatbot's reply to the user."),
});
type PatientChatOutput = z.infer<typeof PatientChatOutputSchema>;


// --- Tools ---
const getTestDetails = ai.defineTool(
  {
    name: 'getTestDetails',
    description: 'Get details for a specific diagnostic test, like its price. Can also list all available tests.',
    inputSchema: z.object({
      testName: z.string().optional().describe('The name of the test to get details for. If empty, list all tests.'),
    }),
    outputSchema: z.array(z.object({ id: z.string(), name: z.string(), cost: z.number() })),
  },
  async ({ testName }) => {
    console.log(`[Tool] Getting details for test: ${testName}`);
    const db = getDb();
    const testsCollection = collection(db, "ashwani", "data", "tests");
    
    // If no specific test name is provided, return all tests.
    if (!testName) {
        const allTestsSnapshot = await getDocs(query(testsCollection));
        return allTestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Test[];
    }

    // If a test name is provided, perform a case-insensitive search.
    const allTestsSnapshot = await getDocs(collection(db, "ashwani", "data", "tests"));
    const allTests = allTestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Test);
    
    const lowerCaseTestName = testName.toLowerCase();
    const filteredTests = allTests.filter(test => test.name.toLowerCase().includes(lowerCaseTestName));
    
    return filteredTests;
  }
);

const getAppointmentHistory = ai.defineTool(
    {
        name: 'getAppointmentHistory',
        description: "Get the patient's appointment history.",
        inputSchema: z.object({ patientId: z.string() }),
        outputSchema: z.array(z.object({
            id: z.string(),
            date: z.string(),
            status: z.string(),
            testName: z.string(),
            phleboName: z.string().optional(),
        })),
    },
    async ({ patientId }) => {
        console.log(`[Tool] Getting appointment history for patient: ${patientId}`);
        const db = getDb();
        const appointmentsCollection = collection(db, "ashwani", "data", "appointments");
        const q = query(appointmentsCollection, where("patientId", "==", patientId));
        const snapshot = await getDocs(q);
        const appointments = snapshot.docs.map(doc => doc.data() as Appointment);
        return appointments.map(app => ({
            id: app.id,
            date: app.date,
            status: app.status,
            testName: app.testName,
            phleboName: app.phleboName,
        }));
    }
);

const searchKnowledgeBase = ai.defineTool(
    {
        name: 'searchKnowledgeBase',
        description: "Search the diagnostic center's knowledge base for information about services, procedures, opening hours, or other general questions.",
        inputSchema: z.object({
            query: z.string().describe('The user\'s question or search query.')
        }),
        outputSchema: z.array(z.string()).describe("An array of answers that may answer the query. Returns an empty array if no relevant answer is found."),
    },
    async ({ query: searchQuery }) => {
        console.log(`[Tool] Searching knowledge base for: ${searchQuery}`);
        const db = getDb();
        const knowledgeCollection = collection(db, "ashwani", "data", "knowledge_base");
        const snapshot = await getDocs(knowledgeCollection);
        
        const knowledgeBase: { question: string, answer: string }[] = snapshot.docs.map(doc => doc.data() as { question: string, answer: string });

        const queryWords = new Set(searchQuery.toLowerCase().replace(/[?.,]/g, '').split(/\s+/));
        
        let bestMatch: { answer: string, score: number } | null = null;

        for (const item of knowledgeBase) {
            if (item.question && item.answer) {
                const itemQuestionWords = new Set(item.question.toLowerCase().replace(/[?.,]/g, '').split(/\s+/));
                const intersection = new Set([...queryWords].filter(x => itemQuestionWords.has(x)));
                const score = intersection.size;

                if (score > 0 && (!bestMatch || score > bestMatch.score)) {
                    bestMatch = { answer: item.answer, score: score };
                }
            }
        }
        
        if (bestMatch && bestMatch.score > 0) {
            console.log(`[Tool] Found match in knowledge base with score ${bestMatch.score}: ${bestMatch.answer}`)
            return [bestMatch.answer];
        }

        console.log(`[Tool] No relevant match found in knowledge base for: ${searchQuery}`);
        return [];
    }
);


// --- Prompt ---
const patientChatPrompt = ai.definePrompt({
  name: 'patientChatPrompt',
  tools: [getTestDetails, getAppointmentHistory, searchKnowledgeBase],
  prompt: `You are a friendly and helpful AI assistant for Ashwani Diagnostic Center. Your name is 'Ashwani AI'.
  
  Your primary roles are:
  1.  Answer patient questions about our services, tests, their appointments, and other general queries.
  2.  Help patients book new appointments.
  3.  If you cannot help or the user wants to talk to a person, tell them "I can connect you to a staff member. Please hold on."
  
  Current Patient ID: {{patientId}}
  
  - First, try to answer general questions (like "what are your hours?" or "how does home collection work?") using the 'searchKnowledgeBase' tool. If the tool returns a direct answer, use it.
  - When asked about tests, use the 'getTestDetails' tool. If a user asks for a test you can't find, you can list all available tests.
  - When asked about appointments, use the 'getAppointmentHistory' tool.
  - For general questions about Ashwani Diagnostic Center that the knowledge base cannot answer, use your general knowledge. We are a leading diagnostic center in the area, offering home sample collection.
  - After providing information, proactively ask if they would like to book an appointment for any tests.
  - If the user agrees to book an appointment, tell them to use the booking form on the page.
  - Keep your answers concise and friendly.
  
  Conversation History:
  {{#if history}}
    {{#each history}}
      {{this.role}}: {{this.text}}
    {{/each}}
  {{/if}}

  New Message: {{message}}
  `,
});

// --- Flow ---
const patientChatFlow = ai.defineFlow(
  {
    name: 'patientChatFlow',
    inputSchema: PatientChatInputSchema,
    outputSchema: PatientChatOutputSchema,
  },
  async (input) => {
    const { history, message, patientId } = input;

    const llmResponse = await ai.generate({
      prompt: {
        ...patientChatPrompt,
        input: {
          patientId,
          message,
          history,
        },
      },
      history: history, 
      tools: [getTestDetails, getAppointmentHistory, searchKnowledgeBase],
    });
    
    const responseText = llmResponse.text();
    if (!responseText) {
      return { reply: "I'm sorry, I'm having trouble connecting. Please try again in a moment." };
    }
    return { reply: responseText };
  }
);

export async function patientChat(input: PatientChatInput): Promise<PatientChatOutput> {
  return patientChatFlow(input);
}
