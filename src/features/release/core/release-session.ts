import type { PublicationReceipt } from "../../publication/types";

export type LaunchReviewReceipt = {
  creator: `0x${string}`;
  expectedAddress: `0x${string}`;
  metadataUri: string;
  reviewedConfig: string;
  valueWei: string;
};

export type ConfirmedLaunchReceipt = LaunchReviewReceipt & {
  txHash: `0x${string}`;
  tokenAddress: `0x${string}`;
  blockNumber: string;
};

type EditingSession = { status: "editing" };
type RenderingSession = { status: "rendering"; snapshotHash: string };
type RenderFields = { snapshotHash: string; artifactHash: string };
type PublicationFields = RenderFields & { publication: PublicationReceipt };
type ReviewFields = PublicationFields & { review: LaunchReviewReceipt };
type RenderedSession = RenderFields & { status: "rendered" };
type PublishingSession = RenderFields & { status: "publishing" };
type PublishedSession = PublicationFields & { status: "published" };
type ReviewingSession = PublicationFields & { status: "reviewing" };
type ReviewedSession = ReviewFields & { status: "reviewed" };
type SubmittingSession = ReviewFields & { status: "submitting" };
type SubmittedSession = ReviewFields & { status: "submitted"; txHash: `0x${string}` };
type ConfirmedSession = ReviewFields & { status: "confirmed"; launch: ConfirmedLaunchReceipt };

export type SafeReleaseSession =
  | EditingSession
  | RenderedSession
  | PublishedSession
  | ReviewedSession
  | SubmittedSession
  | ConfirmedSession;

export type ReleaseSession =
  | SafeReleaseSession
  | RenderingSession
  | PublishingSession
  | ReviewingSession
  | SubmittingSession
  | {
      status: "failed";
      operation: "render" | "publish" | "review" | "launch" | "confirm";
      message: string;
      lastSafe: SafeReleaseSession;
    };

export type ReleaseEvent =
  | { type: "project-changed" }
  | { type: "render-started"; snapshotHash: string }
  | { type: "render-succeeded"; artifactHash: string }
  | { type: "publication-started" }
  | { type: "publication-succeeded"; receipt: PublicationReceipt }
  | { type: "review-started" }
  | { type: "review-succeeded"; review: LaunchReviewReceipt }
  | { type: "launch-started" }
  | { type: "launch-submitted"; txHash: `0x${string}` }
  | { type: "launch-confirmed"; receipt: ConfirmedLaunchReceipt }
  | {
      type: "operation-failed";
      operation: "render" | "publish" | "review" | "launch" | "confirm";
      message: string;
    }
  | { type: "retry" };

export function createEditingSession(): ReleaseSession {
  return { status: "editing" };
}

function lastSafe(session: ReleaseSession): SafeReleaseSession {
  if (session.status === "failed") return session.lastSafe;
  if (session.status === "rendering") return { status: "editing" };
  if (session.status === "publishing") {
    return { status: "rendered", snapshotHash: session.snapshotHash, artifactHash: session.artifactHash };
  }
  if (session.status === "reviewing") {
    return {
      status: "published",
      snapshotHash: session.snapshotHash,
      artifactHash: session.artifactHash,
      publication: session.publication,
    };
  }
  if (session.status === "submitting") {
    return {
      status: "reviewed",
      snapshotHash: session.snapshotHash,
      artifactHash: session.artifactHash,
      publication: session.publication,
      review: session.review,
    };
  }
  return session;
}

export function reduceReleaseSession(session: ReleaseSession, event: ReleaseEvent): ReleaseSession {
  if (event.type === "project-changed") return createEditingSession();
  if (event.type === "retry") {
    if (session.status !== "failed") throw new Error("Only a failed release operation can be retried.");
    return session.lastSafe;
  }
  if (event.type === "operation-failed") {
    return { status: "failed", operation: event.operation, message: event.message, lastSafe: lastSafe(session) };
  }
  if (event.type === "render-started") {
    if (session.status !== "editing") throw new Error("Cannot render from the current release state.");
    return { status: "rendering", snapshotHash: event.snapshotHash };
  }
  if (event.type === "render-succeeded") {
    if (session.status !== "rendering") throw new Error("Cannot complete rendering from the current release state.");
    return { status: "rendered", snapshotHash: session.snapshotHash, artifactHash: event.artifactHash };
  }
  if (event.type === "publication-started") {
    if (session.status !== "rendered") throw new Error("Cannot publish before rendering.");
    return { ...session, status: "publishing" };
  }
  if (event.type === "publication-succeeded") {
    if (session.status !== "publishing") throw new Error("Cannot complete publication from the current release state.");
    return { ...session, status: "published", publication: event.receipt };
  }
  if (event.type === "review-started") {
    if (session.status !== "published") throw new Error("Cannot review launch before publication.");
    return { ...session, status: "reviewing" };
  }
  if (event.type === "review-succeeded") {
    if (session.status !== "reviewing") throw new Error("Cannot complete launch review from the current release state.");
    return { ...session, status: "reviewed", review: event.review };
  }
  if (event.type === "launch-started") {
    if (session.status !== "reviewed") throw new Error("Cannot launch before review.");
    return { ...session, status: "submitting" };
  }
  if (event.type === "launch-submitted") {
    if (session.status !== "submitting") throw new Error("Cannot submit launch from the current release state.");
    return { ...session, status: "submitted", txHash: event.txHash };
  }
  if (event.type === "launch-confirmed") {
    if (session.status !== "submitted") throw new Error("Cannot confirm a launch before submission.");
    return { ...session, status: "confirmed", launch: event.receipt };
  }
  return session;
}
