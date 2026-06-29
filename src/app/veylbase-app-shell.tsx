"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Code2,
  Droplet,
  Eye,
  Lock,
  RotateCw,
  Search,
  Shield,
  Wallet,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getAddress, parseUnits } from "viem";
import type {
  ActionPlanKey,
  UiRegistryChain,
  UiRegistryPair,
  UiRegistrySnapshot
} from "./app-types";
import {
  readPublicBalance,
  SEPOLIA_HEX_CHAIN_ID,
  type TokenBalance
} from "./chain-reads";

type FilterKey = "all" | "test" | "private";

interface EthereumProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, handler: (...args: unknown[]) => void): void;
  removeListener?(event: string, handler: (...args: unknown[]) => void): void;
}

interface VeylbaseAppShellProps {
  defaultPairId: string;
  snapshot: UiRegistrySnapshot;
}

interface ActivityEvent {
  id: number;
  title: string;
  tone: "neutral" | "accent" | "success";
}

interface PlanStep {
  id: string;
  kind: string;
  title: string;
  description: string;
  contractCall?: {
    target: string;
    signature: string;
  };
}

interface PlanData {
  intent: string;
  steps: PlanStep[];
  warnings: string[];
}

const actionTabs: Array<{ key: ActionPlanKey; label: string; Icon: LucideIcon }> = [
  { key: "wrap", label: "Shield", Icon: Shield },
  { key: "unwrap", label: "Unshield", Icon: RotateCw },
  { key: "decryptBalance", label: "Reveal", Icon: Eye },
  { key: "claimFaucet", label: "Test tokens", Icon: Droplet }
];

const filterTabs: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "test", label: "Test tokens" },
  { key: "private", label: "Private" }
];

const planTitleByAction: Record<ActionPlanKey, string> = {
  wrap: "Shield (wrap)",
  unwrap: "Unshield (unwrap)",
  decryptBalance: "Reveal (decrypt)",
  claimFaucet: "Get test tokens (faucet)"
};

const eyebrowByAction: Record<ActionPlanKey, string> = {
  wrap: "Shield",
  unwrap: "Unshield",
  decryptBalance: "Reveal",
  claimFaucet: "Test tokens"
};

const FAUCET_PER_CALL_LIMIT = 1_000_000;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function monoBadge(symbol: string) {
  return symbol.slice(0, 2).toUpperCase();
}

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function floorTo(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.floor((value + 1e-12) * factor) / factor;
}

function formatAmount(value: number, decimals: number | null) {
  const max = decimals == null ? 6 : Math.min(decimals, 6);
  return value.toLocaleString("en-US", {
    minimumFractionDigits: Math.min(2, max),
    maximumFractionDigits: max
  });
}

function formatPlain(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 8 });
}

function trimZeros(value: string) {
  return value.replace(/0+$/u, "").replace(/\.$/u, "");
}

function getEthereum(): EthereumProvider | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { ethereum?: EthereumProvider }).ethereum;
}

export function VeylbaseAppShell({
  defaultPairId,
  snapshot
}: VeylbaseAppShellProps) {
  const [action, setAction] = useState<ActionPlanKey>("wrap");
  const [selectedPairId, setSelectedPairId] = useState(defaultPairId);
  const [amount, setAmount] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [assetSheetOpen, setAssetSheetOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [balances, setBalances] = useState<Record<string, TokenBalance>>({});

  const pairs = snapshot.pairs;
  const selectedPair =
    pairs.find((pair) => pair.id === selectedPairId) ?? pairs[0];
  const onSepolia = chainId === SEPOLIA_HEX_CHAIN_ID;
  const wrongNetwork = account != null && chainId != null && !onSepolia;
  const publicBalance = balances[selectedPairId];

  const pushActivity = useCallback((title: string, tone: ActivityEvent["tone"]) => {
    setActivity((current) =>
      [{ id: current.length + 1, title, tone }, ...current].slice(0, 6)
    );
  }, []);

  const connect = useCallback(async () => {
    const ethereum = getEthereum();
    if (!ethereum) {
      setWalletError(
        "No EVM wallet detected. Install MetaMask or another browser wallet to continue."
      );
      return;
    }
    setWalletError(null);
    setConnecting(true);
    try {
      const accounts = (await ethereum.request({
        method: "eth_requestAccounts"
      })) as string[];
      const next = accounts?.[0] ?? null;
      const currentChain = (await ethereum.request({ method: "eth_chainId" })) as string;
      setAccount(next);
      setChainId(currentChain);
      if (next) pushActivity(`Wallet connected · ${shortAddress(next)}`, "success");
    } catch {
      setWalletError("Wallet connection was rejected.");
    } finally {
      setConnecting(false);
    }
  }, [pushActivity]);

  const disconnect = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setBalances({});
    setPlan(null);
    pushActivity("Wallet disconnected", "neutral");
  }, [pushActivity]);

  const switchToSepolia = useCallback(async () => {
    const ethereum = getEthereum();
    if (!ethereum) return;
    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_HEX_CHAIN_ID }]
      });
      setChainId(SEPOLIA_HEX_CHAIN_ID);
    } catch {
      setWalletError("Could not switch the wallet to Sepolia.");
    }
  }, []);

  // Keep account / chain in sync with the injected wallet.
  useEffect(() => {
    const ethereum = getEthereum();
    if (!ethereum?.on || !ethereum.removeListener) return;
    const onAccounts = (...args: unknown[]) => {
      const next = (args[0] as string[] | undefined)?.[0] ?? null;
      setAccount(next);
      if (!next) {
        setChainId(null);
        setBalances({});
      }
    };
    const onChain = (...args: unknown[]) => {
      setChainId((args[0] as string) ?? null);
      setBalances({});
    };
    ethereum.on("accountsChanged", onAccounts);
    ethereum.on("chainChanged", onChain);
    return () => {
      ethereum.removeListener?.("accountsChanged", onAccounts);
      ethereum.removeListener?.("chainChanged", onChain);
    };
  }, []);

  // Read the real public balance for the selected pair once connected on Sepolia.
  useEffect(() => {
    if (!account || !onSepolia || !selectedPair) return;
    if (balances[selectedPair.id]) return;
    let cancelled = false;
    void (async () => {
      try {
        const balance = await readPublicBalance(
          getAddress(selectedPair.underlyingAddress),
          getAddress(account),
          selectedPair.decimals
        );
        if (!cancelled) {
          setBalances((current) => ({ ...current, [selectedPair.id]: balance }));
        }
      } catch {
        // Leave the balance unread; the UI keeps the honest placeholder.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [account, balances, onSepolia, selectedPair]);

  const selectAction = useCallback((next: ActionPlanKey) => {
    setAction(next);
    setPlan(null);
    setPlanError(null);
  }, []);

  const selectPair = useCallback(
    (id: string) => {
      const pair = pairs.find((candidate) => candidate.id === id);
      setSelectedPairId(id);
      setAssetSheetOpen(false);
      setPlan(null);
      if (action === "claimFaucet" && pair && !pair.faucet) setAction("wrap");
    },
    [action, pairs]
  );

  const isReveal = action === "decryptBalance";

  const amountNumber = useMemo(() => {
    const parsed = Number.parseFloat(amount);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [amount]);

  const preview = useMemo(() => {
    if (!selectedPair) return null;
    const decimals = selectedPair.decimals;
    const capped =
      decimals != null && decimals > 6 ? floorTo(amountNumber, 6) : amountNumber;
    const refund =
      decimals != null && decimals > 6 ? amountNumber - capped : 0;

    if (action === "wrap") {
      return {
        sendLabel: "You shield",
        send: `${formatPlain(amountNumber)} ${selectedPair.symbol}`,
        receiveLabel: "You receive",
        receive: `${formatAmount(capped, decimals)} ${selectedPair.confidentialSymbol}`,
        refund: refund > 0 ? `${trimZeros(refund.toFixed(12))} ${selectedPair.symbol}` : null,
        note:
          decimals != null && decimals > 6
            ? "Wrapped 1:1 · confidential balance is capped at 6 decimals."
            : "Wrapped 1:1 into a confidential balance."
      };
    }
    if (action === "unwrap") {
      return {
        sendLabel: "You unshield",
        send: `${formatPlain(amountNumber)} ${selectedPair.confidentialSymbol}`,
        receiveLabel: "You receive",
        receive: `${formatPlain(amountNumber)} ${selectedPair.symbol}`,
        refund: null,
        note: "Two-step: request then finalize. Funds arrive after confirmation."
      };
    }
    return {
      sendLabel: "You mint",
      send: `${formatPlain(amountNumber)} ${selectedPair.symbol}`,
      receiveLabel: "You receive",
      receive: `${formatPlain(amountNumber)} ${selectedPair.symbol}`,
      refund: null,
      note: "Public mock faucet · up to 1,000,000 per call. Sepolia testing only."
    };
  }, [action, amountNumber, selectedPair]);

  const amountErrorText = useMemo(() => {
    if (action === "claimFaucet" && amountNumber > FAUCET_PER_CALL_LIMIT) {
      return "Faucet mints up to 1,000,000 tokens per call.";
    }
    if (
      action === "wrap" &&
      publicBalance &&
      amountNumber > Number(publicBalance.formatted)
    ) {
      return `Exceeds your public ${selectedPair?.symbol ?? ""} balance.`;
    }
    return null;
  }, [action, amountNumber, publicBalance, selectedPair]);

  const primaryDisabled =
    !isReveal && (amountNumber <= 0 || amountErrorText != null);

  const maxDisabled =
    (action === "wrap" && !publicBalance) ||
    action === "unwrap" ||
    action === "decryptBalance";

  const setMax = useCallback(() => {
    if (action === "claimFaucet") {
      setAmount(String(FAUCET_PER_CALL_LIMIT));
      return;
    }
    if (action === "wrap" && publicBalance) {
      setAmount(publicBalance.formatted);
    }
  }, [action, publicBalance]);

  const generatePlan = useCallback(
    async (intent: ActionPlanKey) => {
      if (!selectedPair || !account) return;
      setPlanLoading(true);
      setPlanError(null);
      setPlanOpen(true);
      try {
        let body: Record<string, unknown>;
        if (intent === "decryptBalance") {
          body = { intent, pairId: selectedPair.id, account };
        } else {
          if (selectedPair.decimals == null) {
            throw new Error(
              "Live token decimals are unavailable. Enable the live registry to plan amounts."
            );
          }
          const amountBaseUnits = parseUnits(
            amount || "0",
            selectedPair.decimals
          ).toString();
          body = {
            intent,
            pairId: selectedPair.id,
            account,
            amountBaseUnits
          };
        }

        const response = await fetch("/api/transactions/plan", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body)
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error ?? "Unable to build transaction plan.");
        }
        setPlan({
          intent: data.intent,
          steps: data.steps ?? [],
          warnings: data.warnings ?? []
        });
        pushActivity(`Plan generated · ${planTitleByAction[intent]}`, "accent");
      } catch (error) {
        setPlan(null);
        setPlanError(
          error instanceof Error ? error.message : "Unable to build transaction plan."
        );
      } finally {
        setPlanLoading(false);
      }
    },
    [account, amount, pushActivity, selectedPair]
  );

  const onPrimary = useCallback(() => {
    if (!account) {
      void connect();
      return;
    }
    if (wrongNetwork) {
      void switchToSepolia();
      return;
    }
    void generatePlan(action);
  }, [account, action, connect, generatePlan, switchToSepolia, wrongNetwork]);

  const openPlanDrawer = useCallback(() => {
    setPlanOpen(true);
    if (account && (isReveal || amountNumber > 0)) void generatePlan(action);
  }, [account, action, amountNumber, generatePlan, isReveal]);

  if (!selectedPair) return null;

  const eyebrow = eyebrowByAction[action];
  const title = titleFor(action, selectedPair);
  const subtitle = subtitleFor(action, selectedPair);
  const primaryLabel = primaryLabelFor(action, Boolean(account));
  const revealCta = account ? "Sign & reveal" : "Connect & reveal";
  const amountLabel =
    action === "unwrap" ? "Amount to unshield" : action === "claimFaucet" ? "Amount to mint" : "Amount to shield";
  const fromSymbol = action === "unwrap" ? selectedPair.confidentialSymbol : selectedPair.symbol;
  const publicBalanceDisplay = !account
    ? "Connect"
    : wrongNetwork
      ? "Wrong network"
      : publicBalance
        ? formatAmount(Number(publicBalance.formatted), selectedPair.decimals)
        : "…";

  return (
    <main className="vb-app">
      <Topbar
        account={account}
        chain={snapshot.chain}
        connecting={connecting}
        onConnect={connect}
        onDisconnect={disconnect}
        onOpenPlan={openPlanDrawer}
      />

      {walletError ? <div className="vb-wallet-error" role="alert">{walletError}</div> : null}

      {wrongNetwork ? (
        <div className="vb-wallet-error vb-network-warn" role="alert">
          <span>Your wallet is on the wrong network. Veylbase runs on Sepolia.</span>
          <button className="vb-ghost" onClick={switchToSepolia} type="button">
            Switch to Sepolia
          </button>
        </div>
      ) : null}

      <div className="vb-column">
        <header className="vb-heading">
          <span className="vb-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </header>

        <div className="vb-tabs" role="tablist" aria-label="Asset actions">
          {actionTabs.map(({ Icon, key, label }) => {
            const disabled = key === "claimFaucet" && !selectedPair.faucet;
            return (
              <button
                aria-selected={action === key}
                className={cx("vb-tab", action === key && "is-active")}
                disabled={disabled}
                key={key}
                onClick={() => selectAction(key)}
                role="tab"
                type="button"
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </div>

        <div className="vb-card">
          <button
            className="vb-asset-select"
            onClick={() => {
              setQuery("");
              setAssetSheetOpen(true);
            }}
            type="button"
          >
            <span className="vb-asset-mono">{monoBadge(selectedPair.symbol)}</span>
            <span className="vb-asset-id">
              <strong>
                {selectedPair.symbol}
                <span className="vb-dim"> / {selectedPair.confidentialSymbol}</span>
              </strong>
              <small>{selectedPair.name}</small>
            </span>
            <span className="vb-asset-bal">
              <small>Public · Private</small>
              <span>
                {publicBalanceDisplay} <span className="vb-accent">· ••••••</span>
              </span>
            </span>
            <span className="vb-change">
              Change
              <ChevronDown size={14} aria-hidden="true" />
            </span>
          </button>

          <div className="vb-card-body">
            {isReveal ? (
              <RevealPanel
                account={account}
                confidentialSymbol={selectedPair.confidentialSymbol}
                cta={revealCta}
                onReveal={() => (account ? void generatePlan("decryptBalance") : void connect())}
              />
            ) : (
              <div className="vb-flow">
                <div className="vb-field">
                  <div className="vb-field-top">
                    <span>{amountLabel}</span>
                    <button
                      className="vb-max"
                      disabled={maxDisabled}
                      onClick={setMax}
                      title={
                        action === "unwrap"
                          ? "Private balance is revealed via decrypt"
                          : "Use your full balance"
                      }
                      type="button"
                    >
                      MAX
                    </button>
                  </div>
                  <div className="vb-amount">
                    <input
                      inputMode="decimal"
                      onChange={(event) => setAmount(event.target.value)}
                      placeholder="0.00"
                      value={amount}
                    />
                    <span className="vb-amount-sym">{fromSymbol}</span>
                  </div>
                  {amountErrorText ? (
                    <span className="vb-amount-error">{amountErrorText}</span>
                  ) : null}
                </div>

                {preview ? (
                  <div className="vb-preview">
                    <div className="vb-preview-row">
                      <span>{preview.sendLabel}</span>
                      <span className="vb-mono">{preview.send}</span>
                    </div>
                    <div className="vb-preview-row">
                      <span>{preview.receiveLabel}</span>
                      <span className="vb-mono vb-accent">{preview.receive}</span>
                    </div>
                    {preview.refund ? (
                      <div className="vb-preview-row vb-preview-refund">
                        <span>Refunded — exceeds the wrapper&rsquo;s 6-decimal precision</span>
                        <span className="vb-mono">{preview.refund}</span>
                      </div>
                    ) : null}
                    <div className="vb-preview-note">
                      <Lock size={13} aria-hidden="true" />
                      <span>{preview.note}</span>
                    </div>
                  </div>
                ) : null}

                <button
                  className="vb-primary"
                  disabled={primaryDisabled}
                  onClick={onPrimary}
                  type="button"
                >
                  {primaryLabel}
                </button>
              </div>
            )}
          </div>
        </div>

        <ActivityPanel activity={activity} />
      </div>

      {assetSheetOpen ? (
        <AssetSheet
          filter={filter}
          onClose={() => setAssetSheetOpen(false)}
          onFilter={setFilter}
          onQuery={setQuery}
          onSelect={selectPair}
          pairs={pairs}
          query={query}
          selectedId={selectedPair.id}
        />
      ) : null}

      {planOpen ? (
        <PlanDrawer
          chain={snapshot.chain}
          connected={Boolean(account)}
          error={planError}
          loading={planLoading}
          onClose={() => setPlanOpen(false)}
          plan={plan}
          title={planTitleByAction[action]}
        />
      ) : null}
    </main>
  );
}

function titleFor(action: ActionPlanKey, pair: UiRegistryPair) {
  if (action === "wrap") return `Make ${pair.symbol} private`;
  if (action === "unwrap") return `Return ${pair.confidentialSymbol} to public`;
  if (action === "decryptBalance") return "Reveal a private balance";
  return `Get ${pair.symbol} test tokens`;
}

function subtitleFor(action: ActionPlanKey, pair: UiRegistryPair) {
  if (action === "wrap") {
    return `Wrap your public balance into a confidential ${pair.confidentialSymbol} position. Amounts and balances stay encrypted on-chain.`;
  }
  if (action === "unwrap") {
    return `Unwrap confidential ${pair.confidentialSymbol} back to public ${pair.symbol}. This is a two-step confirmation.`;
  }
  if (action === "decryptBalance") {
    return "Decrypt your confidential balance privately. You sign a permit — nothing is broadcast.";
  }
  return `Mint mock ${pair.symbol} so you have something to shield. Sepolia testing only.`;
}

function primaryLabelFor(action: ActionPlanKey, connected: boolean) {
  if (action === "unwrap") return connected ? "Unshield balance" : "Connect & unshield";
  if (action === "claimFaucet") return connected ? "Get test tokens" : "Connect & mint";
  return connected ? "Shield balance" : "Connect & shield";
}

function Topbar({
  account,
  chain,
  connecting,
  onConnect,
  onDisconnect,
  onOpenPlan
}: {
  account: string | null;
  chain: UiRegistryChain;
  connecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onOpenPlan: () => void;
}) {
  return (
    <header className="vb-topbar">
      <Link className="vb-brand" href="/">
        <span className="vb-brand-mark">V</span>
        <span className="vb-brand-name">
          <strong>Veylbase</strong>
          <small>The confidential wrapper registry for Zama</small>
        </span>
      </Link>

      <nav className="vb-topnav" aria-label="Session">
        <span className="vb-chain">
          <span className="vb-dot vb-dot-success" />
          {chain.name}
        </span>
        <button className="vb-ghost" onClick={onOpenPlan} type="button">
          <Code2 size={15} aria-hidden="true" />
          Developer plan
        </button>
        {account ? (
          <button className="vb-ghost" onClick={onDisconnect} type="button">
            <span className="vb-dot vb-dot-success" />
            {shortAddress(account)}
          </button>
        ) : (
          <button
            className="vb-connect"
            disabled={connecting}
            onClick={onConnect}
            type="button"
          >
            <Wallet size={15} aria-hidden="true" />
            {connecting ? "Connecting…" : "Connect wallet"}
          </button>
        )}
      </nav>
    </header>
  );
}

function RevealPanel({
  account,
  confidentialSymbol,
  cta,
  onReveal
}: {
  account: string | null;
  confidentialSymbol: string;
  cta: string;
  onReveal: () => void;
}) {
  return (
    <div className="vb-flow">
      <div className="vb-reveal-card">
        <span className="vb-reveal-label">Private holding · {confidentialSymbol}</span>
        <strong className="vb-reveal-hidden">••••••</strong>
        <span className="vb-reveal-hint">
          <Lock size={13} aria-hidden="true" />
          Hidden by default — encrypted on-chain
        </span>
      </div>
      <p className="vb-reveal-copy">
        Revealing decrypts the balance to your wallet only. You sign a permit — no
        transaction, no on-chain trace.
      </p>
      <button className="vb-primary" onClick={onReveal} type="button">
        <Eye size={17} aria-hidden="true" />
        {account ? cta : "Connect & reveal"}
      </button>
    </div>
  );
}

function ActivityPanel({ activity }: { activity: ActivityEvent[] }) {
  return (
    <div className="vb-activity">
      <span className="vb-activity-title">Activity</span>
      {activity.length === 0 ? (
        <p className="vb-activity-empty">Connect your wallet to begin.</p>
      ) : (
        <div className="vb-activity-list">
          {activity.map((event) => (
            <div className="vb-activity-row" key={event.id}>
              <span className={cx("vb-dot", `vb-dot-${event.tone}`)} />
              <span className="vb-activity-text">{event.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AssetSheet({
  filter,
  onClose,
  onFilter,
  onQuery,
  onSelect,
  pairs,
  query,
  selectedId
}: {
  filter: FilterKey;
  onClose: () => void;
  onFilter: (key: FilterKey) => void;
  onQuery: (value: string) => void;
  onSelect: (id: string) => void;
  pairs: UiRegistryPair[];
  query: string;
  selectedId: string;
}) {
  const normalized = query.trim().toLowerCase();
  const filtered = pairs.filter((pair) => {
    const matchesQuery =
      !normalized ||
      `${pair.symbol} ${pair.confidentialSymbol} ${pair.name}`
        .toLowerCase()
        .includes(normalized);
    const matchesFilter =
      filter === "all" ||
      (filter === "test" && pair.faucet) ||
      filter === "private";
    return matchesQuery && matchesFilter;
  });

  return (
    <div className="vb-overlay" onClick={onClose} role="presentation">
      <div
        aria-label="Choose an asset"
        className="vb-sheet"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="vb-sheet-head">
          <strong>Choose an asset</strong>
          <button aria-label="Close" className="vb-icon-btn" onClick={onClose} type="button">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="vb-sheet-controls">
          <label className="vb-search">
            <Search size={17} aria-hidden="true" />
            <span className="vb-sr-only">Search assets</span>
            <input
              onChange={(event) => onQuery(event.target.value)}
              placeholder="Search assets"
              type="search"
              value={query}
            />
          </label>
          <div className="vb-sheet-filters" role="group" aria-label="Asset filters">
            {filterTabs.map((tab) => (
              <button
                aria-pressed={filter === tab.key}
                className={cx("vb-pill", filter === tab.key && "is-active")}
                key={tab.key}
                onClick={() => onFilter(tab.key)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="vb-sheet-list">
          {filtered.length === 0 ? (
            <p className="vb-activity-empty">No matching asset.</p>
          ) : (
            filtered.map((pair) => (
              <button
                className={cx("vb-pair-row", pair.id === selectedId && "is-selected")}
                key={pair.id}
                onClick={() => onSelect(pair.id)}
                type="button"
              >
                <span className="vb-pair-mono">{monoBadge(pair.symbol)}</span>
                <span className="vb-pair-id">
                  <strong>
                    {pair.symbol}
                    <span className="vb-dim"> / {pair.confidentialSymbol}</span>
                  </strong>
                  <small>{pair.name}</small>
                </span>
                <span className="vb-pair-tags">
                  <span className={cx("vb-tag", pair.faucet ? "vb-tag-accent" : "vb-tag-muted")}>
                    {pair.faucet ? "Test" : "Restricted"}
                  </span>
                  {pair.testOnly ? <span className="vb-tag vb-tag-warn">Test only</span> : null}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function PlanDrawer({
  chain,
  connected,
  error,
  loading,
  onClose,
  plan,
  title
}: {
  chain: UiRegistryChain;
  connected: boolean;
  error: string | null;
  loading: boolean;
  onClose: () => void;
  plan: PlanData | null;
  title: string;
}) {
  return (
    <div className="vb-overlay vb-overlay-right" onClick={onClose} role="presentation">
      <aside
        aria-label="Transaction plan"
        className="vb-drawer"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="vb-drawer-head">
          <div>
            <strong>Transaction plan</strong>
            <small>{title}</small>
          </div>
          <button aria-label="Close" className="vb-icon-btn" onClick={onClose} type="button">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="vb-drawer-meta">
          <div>
            <span>Network</span>
            <span className="vb-mono">
              {chain.name} · {chain.chainId}
            </span>
          </div>
          <div>
            <span>Registry</span>
            <span className="vb-mono">{shortAddress(chain.registryAddress)}</span>
          </div>
        </div>

        <div className="vb-drawer-body">
          {!connected ? (
            <p className="vb-drawer-hint">
              Connect your wallet, then run an action to generate the live transaction
              plan from the Veylbase planner.
            </p>
          ) : loading ? (
            <p className="vb-drawer-hint">Building plan…</p>
          ) : error ? (
            <p className="vb-drawer-hint vb-drawer-error">{error}</p>
          ) : plan ? (
            <>
              {plan.steps.map((step, index) => (
                <div className="vb-step" key={step.id}>
                  <div className="vb-step-head">
                    <span className="vb-step-n">{index + 1}</span>
                    <strong>{step.title}</strong>
                    <span className={cx("vb-kind", kindIsWrite(step.kind) && "vb-kind-write")}>
                      {step.kind}
                    </span>
                  </div>
                  <p>{step.description}</p>
                  {step.contractCall ? (
                    <div className="vb-step-call">
                      <span className="vb-accent">{step.contractCall.signature}</span>
                      <span className="vb-dim">→ {shortAddress(step.contractCall.target)}</span>
                    </div>
                  ) : null}
                </div>
              ))}
              {plan.warnings.map((warning) => (
                <p className="vb-drawer-warn" key={warning}>
                  {warning}
                </p>
              ))}
              <p className="vb-drawer-foot">
                Plan derived from the Veylbase transaction planner. References: Zama
                wrapper-registry &amp; confidential-wrapper docs.
              </p>
            </>
          ) : (
            <p className="vb-drawer-hint">Run an action to generate a plan.</p>
          )}
        </div>
      </aside>
    </div>
  );
}

function kindIsWrite(kind: string) {
  return kind === "contract-write" || kind === "wallet-signature";
}
