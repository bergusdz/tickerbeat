import type { PublishableArtifact, PublicationReceipt } from "../../publication/types";
import type { ConfirmedLaunchReceipt, LaunchReviewReceipt } from "./release-session";

export type LaunchInput = {
  artifact: PublishableArtifact;
  publication: PublicationReceipt;
  creator: `0x${string}`;
};

export type SubmittedLaunch = {
  txHash: `0x${string}`;
};

export interface PublicationGateway {
  publish(artifact: PublishableArtifact, creator: `0x${string}`): Promise<PublicationReceipt>;
}

export interface TokenLauncher {
  review(input: LaunchInput): Promise<LaunchReviewReceipt>;
  submit(input: LaunchInput, review: LaunchReviewReceipt): Promise<SubmittedLaunch>;
  confirm(submitted: SubmittedLaunch, review: LaunchReviewReceipt): Promise<ConfirmedLaunchReceipt>;
}
