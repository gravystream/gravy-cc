import { db } from "@/lib/db";

/**
 * Recompute aggregate fields on EventActivation from its EventCreator
 * rows. Called after add / remove / edit of attending creators.
 */
export async function recomputeEventTotals(eventId: string) {
  const event = await db.eventActivation.findUnique({
    where: { id: eventId },
    select: { id: true, budgetKobo: true },
  });
  if (!event) return null;

  const creators = await db.eventCreator.findMany({
    where: { eventId },
    select: { signupsGenerated: true },
  });
  const signupsGenerated = creators.reduce(
    (s, c) => s + c.signupsGenerated,
    0
  );
  const costPerAcquisitionKobo =
    signupsGenerated > 0 ? Math.round(event.budgetKobo / signupsGenerated) : 0;

  return db.eventActivation.update({
    where: { id: eventId },
    data: {
      signupsGenerated,
      costPerAcquisitionKobo,
    },
  });
}
