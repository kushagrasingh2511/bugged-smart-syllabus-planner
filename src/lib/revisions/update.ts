import Revision from "@/models/Revision";
import { serializeRevision } from "@/lib/revisions/serialize";
import type { RevisionItem, RevisionStoredStatus } from "@/types/revision";

export class RevisionUpdateError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "RevisionUpdateError";
  }
}

export async function updateRevisionStatus(
  userId: string,
  revisionId: string,
  status: RevisionStoredStatus,
): Promise<RevisionItem> {
  const revision = await Revision.findOne({ revisionId, userId });
  if (!revision) {
    throw new RevisionUpdateError("Revision not found", 404);
  }

  revision.status = status;
  if (status === "completed") {
    revision.completedAt = revision.completedAt ?? new Date();
  } else {
    revision.completedAt = null;
  }

  await revision.save();

  return serializeRevision(revision.toObject());
}
