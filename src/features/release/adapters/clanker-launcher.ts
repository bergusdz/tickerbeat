import { Clanker } from "clanker-sdk/v4";
import type { Account, Chain, PublicClient, Transport, WalletClient } from "viem";

import { createClankerTokenConfig } from "../../launch/clanker-config";
import { assertClankerLaunchReceipt } from "../../launch/launch-receipt";
import { assertPublicationCreator, assertReviewedLaunch } from "../../launch/launch-review";
import type { LaunchInput, SubmittedLaunch, TokenLauncher } from "../core/ports";
import type { ConfirmedLaunchReceipt, LaunchReviewReceipt } from "../core/release-session";

type BaseWallet = WalletClient<Transport, Chain, Account>;

function deploymentSuffix(): `0x${string}` | undefined {
  const value = process.env.NEXT_PUBLIC_BASE_BUILDER_CODE_SUFFIX;
  return value && /^0x(?:[0-9a-fA-F]{2})+$/.test(value) ? (value as `0x${string}`) : undefined;
}

export class ClankerTokenLauncher implements TokenLauncher {
  constructor(
    private readonly publicClient: PublicClient,
    private readonly getWallet: () => Promise<BaseWallet>,
  ) {}

  private config(input: LaunchInput) {
    assertPublicationCreator(input.publication.creator, input.creator);
    return createClankerTokenConfig({
      creator: input.creator,
      title: input.artifact.title,
      symbol: input.artifact.symbol,
      coverUri: input.publication.coverUri,
      audioUri: input.publication.audioUri,
      metadataUri: input.publication.metadataUri,
    });
  }

  private async client(): Promise<Clanker> {
    return new Clanker({ wallet: await this.getWallet(), publicClient: this.publicClient });
  }

  async review(input: LaunchInput): Promise<LaunchReviewReceipt> {
    const config = this.config(input);
    const client = await this.client();
    const transaction = await client.getDeployTransaction(config);
    if (!transaction.expectedAddress) throw new Error("Clanker did not return a predicted token address.");
    const simulation = await client.deploySimulate(config);
    if ("error" in simulation && simulation.error) throw simulation.error;
    return {
      creator: input.creator,
      expectedAddress: transaction.expectedAddress,
      metadataUri: input.publication.metadataUri,
      reviewedConfig: JSON.stringify(config),
      valueWei: String(transaction.value ?? BigInt(0)),
    };
  }

  async submit(input: LaunchInput, review: LaunchReviewReceipt): Promise<SubmittedLaunch> {
    const config = this.config(input);
    assertReviewedLaunch(review.reviewedConfig, JSON.stringify(config), review.expectedAddress);
    const suffix = deploymentSuffix();
    const result = await (await this.client()).deploy(config, suffix ? { dataSuffix: suffix } : undefined);
    if ("error" in result && result.error) throw result.error;
    return { txHash: result.txHash };
  }

  async confirm(
    submitted: SubmittedLaunch,
    review: LaunchReviewReceipt,
  ): Promise<ConfirmedLaunchReceipt> {
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: submitted.txHash });
    if (receipt.status !== "success") throw new Error("Clanker deployment reverted on Base.");
    const tokenAddress = assertClankerLaunchReceipt({
      logs: receipt.logs,
      expectedAddress: review.expectedAddress,
      expectedCreator: review.creator,
    });
    return {
      ...review,
      txHash: submitted.txHash,
      tokenAddress,
      blockNumber: String(receipt.blockNumber),
    };
  }
}
