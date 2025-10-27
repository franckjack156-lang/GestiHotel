import { z } from 'zod';

export const interventionSchema = z.object({
  location: z.string().min(1, "Localisation requise"),
  missionSummary: z.string().min(3, "Minimum 3 caractères"),
  assignedTo: z.string().uuid("ID technicien invalide"),
  priority: z.enum(['urgent', 'high', 'normal', 'low']),
  roomType: z.string().min(1)
});