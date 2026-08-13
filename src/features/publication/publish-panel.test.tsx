import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PublishPanel } from "./publish-panel";

const baseProps = {
  receipt: null,
  connectors: [{ uid: "injected", name: "Browser wallet" }],
  connecting: false,
  publishing: false,
  ready: true,
  error: null,
  connectError: null,
  onConnect: vi.fn(),
  onPublish: vi.fn(),
};

describe("PublishPanel", () => {
  it("asks for a wallet before immutable publication", () => {
    render(<PublishPanel {...baseProps} connected={false} />);

    fireEvent.click(screen.getByRole("button", { name: "CONNECT BROWSER WALLET TO PUBLISH" }));
    expect(baseProps.onConnect).toHaveBeenCalledWith("injected");
    expect(screen.queryByRole("button", { name: "PUBLISH TO IPFS" })).not.toBeInTheDocument();
  });

  it("delegates publication to the release orchestrator", () => {
    const onPublish = vi.fn();
    render(<PublishPanel {...baseProps} connected onPublish={onPublish} />);

    fireEvent.click(screen.getByRole("button", { name: "PUBLISH TO IPFS" }));
    expect(onPublish).toHaveBeenCalledOnce();
  });
});
