// The AI Admin Assistant flow manages system data, validating changes against defined constraints to ensure data integrity.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdminActionEnum = z.enum(['add', 'edit', 'delete']);

const ManageEntityEnum = z.enum(['patient', 'staff', 'phlebo', 'appointment', 'test']);

const AdminAssistantInputSchema = z.object({
  action: AdminActionEnum.describe('The action to perform (add, edit, delete).'),
  entityType: ManageEntityEnum.describe('The type of entity to manage (patient, staff, phlebo, appointment, test).'),
  entityDetails: z.string().describe('A JSON string of the entity details. All required fields must be present.'),
});
export type AdminAssistantInput = z.infer<typeof AdminAssistantInputSchema>;

const AdminAssistantOutputSchema = z.object({
  success: z.boolean().describe('Indicates whether the action was successful.'),
  message: z.string().describe('A message providing feedback on the action taken, including any validation errors.'),
});
export type AdminAssistantOutput = z.infer<typeof AdminAssistantOutputSchema>;

export async function adminAssistant(input: AdminAssistantInput): Promise<AdminAssistantOutput> {
  return adminAssistantFlow(input);
}

const adminAssistantPrompt = ai.definePrompt({
  name: 'adminAssistantPrompt',
  input: {schema: AdminAssistantInputSchema},
  output: {schema: AdminAssistantOutputSchema},
  prompt: `You are an administrative assistant for Ashwani Diagnostic Center, responsible for managing system data.  

  A request has been made to {{action}} a {{entityType}}.  The details are: {{entityDetails}}.

  Carefully consider the request, and validate it against constraints and requirements for each entity type.

  Here are some example constraints:
  - Patient: Ensure all required fields (name, contact information, etc.) are present and valid.
  - Staff/Phlebo: Verify role and permissions are correctly assigned.
  - Appointment: Check for time conflicts, valid patient and staff assignments, and test availability.
  - Test: Validate test codes, descriptions, and associated costs.

  Based on your validation, determine whether the action can be successfully completed.  Provide a clear message indicating success or failure, including specific details about any validation errors encountered.

  Return a JSON object that can be parsed by Typescript with a 'success' boolean, and a 'message' string.

  Example of successful operation (do not include \`\`\`):
  \`\`\`json
  {
    "success": true,
    "message": "Successfully added new patient John Doe."
  }
  \`\`\`

  Example of unsuccessful operation (do not include \`\`\`):
  \`\`\`json
  {
    "success": false,
    "message": "Failed to add patient. Missing required field: contact information."
  }
  \`\`\`

  Ensure that you return a valid JSON object that can be parsed.
`,
});

const adminAssistantFlow = ai.defineFlow(
  {
    name: 'adminAssistantFlow',
    inputSchema: AdminAssistantInputSchema,
    outputSchema: AdminAssistantOutputSchema,
  },
  async input => {
    const {output} = await adminAssistantPrompt(input);
    return output!;
  }
);
