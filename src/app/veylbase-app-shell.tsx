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
import { formatUnits, getAddress, parseUnits, type Hex } from "viem";
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
import { executionErrorMessage } from "./execution-errors";
// The execution functions pull in @zama-fhe/sdk (large). They are imported
// dynamically inside runAction so the SDK stays out of the initial /app bundle;
// only the (erased) types are imported statically here.
import type {
  BrowserEthereumProvider,
  ExecutionProgress
} from "./confidential-actions";

type FilterKey = "all" | "test" | "private";

interface VeylbaseAppShellProps {
  defaultPairId: string;
  snapshot: UiRegistrySnapshot;
}

interface ActivityEvent {
  id: string;
  title: string;
  tone: "neutral" | "accent" | "success";
  detail?: string;
  txHash?: Hex;
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

interface PrivateBalance {
  raw: bigint;
  formatted: string;
}

interface ExecutionState extends ExecutionProgress {
  status: "running" | "success" | "error";
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
const REVEALED_BALANCE_TTL_MS = 8_000;
const ACTION_SOFT_TIMEOUT_MS = 90_000;

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

function getEthereum(): BrowserEthereumProvider | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { ethereum?: BrowserEthereumProvider }).ethereum;
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
  const [privateBalances, setPrivateBalances] = useState<Record<string, PrivateBalance>>({});
  const [balanceRefreshKey, setBalanceRefreshKey] = useState(0);
  const [execution, setExecution] = useState<ExecutionState | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingUnshield, setPendingUnshield] = useState<{
    pairId: string;
    txHash: Hex;
  } | null>(null);

  const pairs = snapshot.pairs;
  const selectedPair =
    pairs.find((pair) => pair.id === selectedPairId) ?? pairs[0];
  const onSepolia = chainId === SEPOLIA_HEX_CHAIN_ID;
  const wrongNetwork = account != null && chainId != null && !onSepolia;
  const publicBalance = balances[selectedPairId];
  const privateBalance = privateBalances[selectedPairId];
  const executing = execution?.status === "running";

  const pushActivity = useCallback((
    title: string,
    tone: ActivityEvent["tone"],
    detail?: string,
    txHash?: Hex
  ) => {
    setActivity((current) =>
      [
        {
          id: `${Date.now()}-${current.length}`,
          title,
          tone,
          detail,
          txHash
        },
        ...current
      ].slice(0, 6)
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
    setPrivateBalances({});
    setPendingUnshield(null);
    setPlan(null);
    setExecution(null);
    setActionError(null);
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
      setPendingUnshield(null);
      if (!next) {
        setChainId(null);
        setBalances({});
        setPrivateBalances({});
      }
      setPlan(null);
      setExecution(null);
      setActionError(null);
    };
    const onChain = (...args: unknown[]) => {
      setChainId((args[0] as string) ?? null);
      setBalances({});
      setPrivateBalances({});
      setPendingUnshield(null);
      setPlan(null);
      setExecution(null);
      setActionError(null);
    };
    ethereum.on("accountsChanged", onAccounts);
    ethereum.on("chainChanged", onChain);
    return () => {
      ethereum.removeListener?.("accountsChanged", onAccounts);
      ethereum.removeListener?.("chainChanged", onChain);
    };
  }, []);

  // Read the real public balance for the selected pair and refresh after writes.
  useEffect(() => {
    if (!account || !onSepolia || !selectedPair) return;
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
  }, [account, balanceRefreshKey, onSepolia, selectedPair]);

  useEffect(() => {
    if (!account || !onSepolia || !selectedPair) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const actions = await import("./confidential-actions");
        const txHash = await actions.loadPendingUnshieldHash({
          wrapperAddress: getAddress(selectedPair.confidentialAddress)
        });
        if (!cancelled) {
          setPendingUnshield(
            txHash ? { pairId: selectedPair.id, txHash } : null
          );
        }
      } catch {
        if (!cancelled) setPendingUnshield(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [account, onSepolia, selectedPair]);

  useEffect(() => {
    if (!privateBalance || !account || !chainId || !selectedPair) return;
    const pairId = selectedPair.id;
    const timer = window.setTimeout(() => {
      setPrivateBalances((current) => {
        if (!current[pairId]) return current;
        const next = { ...current };
        delete next[pairId];
        return next;
      });
    }, REVEALED_BALANCE_TTL_MS);

    return () => window.clearTimeout(timer);
  }, [account, chainId, privateBalance, selectedPair]);

  useEffect(() => {
    if (!executing) return;
    const timer = window.setTimeout(() => {
      setActionError(
        "This is taking longer than expected. Check your wallet activity before retrying."
      );
      setExecution((current) =>
        current?.status === "running"
          ? {
              ...current,
              status: "error",
              phase: "complete",
              title: "Action is still pending",
              detail:
                "This is taking longer than expected. Check your wallet activity before retrying."
            }
          : current
      );
    }, ACTION_SOFT_TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, [executing]);

  const selectAction = useCallback((next: ActionPlanKey) => {
    setAction(next);
    setPlan(null);
    setPlanError(null);
    setExecution(null);
    setActionError(null);
  }, []);

  const selectPair = useCallback(
    (id: string) => {
      const pair = pairs.find((candidate) => candidate.id === id);
      setSelectedPairId(id);
      setAssetSheetOpen(false);
      setPlan(null);
      setExecution(null);
      setActionError(null);
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
    const underlyingDecimals = selectedPair.decimals;
    const confDecimals = selectedPair.confidentialDecimals;
    // Shielding loses precision only when the underlying carries more decimals
    // than the confidential token can represent.
    const losesPrecision =
      underlyingDecimals != null &&
      confDecimals != null &&
      underlyingDecimals > confDecimals;
    const capped = losesPrecision
      ? floorTo(amountNumber, confDecimals)
      : amountNumber;
    const refund = losesPrecision ? amountNumber - capped : 0;

    if (action === "wrap") {
      return {
        sendLabel: "You shield",
        send: `${formatPlain(amountNumber)} ${selectedPair.symbol}`,
        receiveLabel: "You receive",
        receive: `${formatAmount(capped, confDecimals)} ${selectedPair.confidentialSymbol}`,
        refund: refund > 0 ? `${trimZeros(refund.toFixed(12))} ${selectedPair.symbol}` : null,
        note: losesPrecision
          ? `Wrapped 1:1 · confidential balance is capped at ${confDecimals} decimals.`
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
    if (
      action === "unwrap" &&
      privateBalance &&
      amountNumber > Number(privateBalance.formatted)
    ) {
      return `Exceeds your revealed private ${selectedPair?.confidentialSymbol ?? ""} balance.`;
    }
    return null;
  }, [action, amountNumber, privateBalance, publicBalance, selectedPair]);

  const primaryDisabled =
    executing || (!isReveal && (amountNumber <= 0 || amountErrorText != null));

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

  const buildPlan = useCallback(
    async (intent: ActionPlanKey) => {
      if (!selectedPair || !account) {
        throw new Error("Connect your wallet before building a transaction plan.");
      }

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

      return {
        intent: data.intent,
        steps: data.steps ?? [],
        warnings: data.warnings ?? []
      } satisfies PlanData;
    },
    [account, amount, selectedPair]
  );

  const generatePlan = useCallback(
    async (intent: ActionPlanKey) => {
      if (!selectedPair || !account) return;
      setPlanLoading(true);
      setPlanError(null);
      setPlanOpen(true);
      try {
        setPlan(await buildPlan(intent));
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
    [account, buildPlan, pushActivity, selectedPair]
  );

  const failAction = useCallback(
    (error: unknown) => {
      const message = executionErrorMessage(error);
      setActionError(message);
      setExecution({
        status: "error",
        phase: "complete",
        title: "Action did not complete",
        detail: message
      });
      pushActivity("Action did not complete", "neutral", message);
    },
    [pushActivity]
  );

  const runAction = useCallback(async () => {
    if (!account) {
      void connect();
      return;
    }
    if (wrongNetwork) {
      void switchToSepolia();
      return;
    }

    const provider = getEthereum();
    if (!provider) {
      setWalletError(
        "No EVM wallet detected. Install MetaMask or another browser wallet to continue."
      );
      return;
    }
    if (!selectedPair) return;

    setActionError(null);
    setExecution({
      status: "running",
      phase: "planning",
      title: "Checking live plan",
      detail: "Veylbase is validating the action before opening your wallet."
    });

    try {
      // Load the SDK-heavy execution module on first use only.
      const actions = await import("./confidential-actions");
      const nextPlan = await buildPlan(action);
      setPlan(nextPlan);

      const walletAccount = getAddress(account);
      const onProgress = (progress: ExecutionProgress) => {
        setExecution({ ...progress, status: "running" });
        if (progress.txHash) {
          pushActivity(progress.title, "accent", progress.detail, progress.txHash);
        }
      };

      if (action === "decryptBalance") {
        const revealed = await actions.revealConfidentialBalance({
          account: walletAccount,
          callbacks: { onProgress },
          provider,
          tokenAddress: getAddress(selectedPair.confidentialAddress)
        });
        // The decrypted value is in the confidential token's own decimals.
        const decimals = selectedPair.confidentialDecimals ?? 6;
        const formatted = formatUnits(revealed.value, decimals);
        setPrivateBalances((current) => ({
          ...current,
          [selectedPair.id]: { raw: revealed.value, formatted }
        }));
        setExecution({
          status: "success",
          phase: "complete",
          title: "Private balance revealed",
          detail: `${formatted} ${selectedPair.confidentialSymbol}`
        });
        pushActivity(
          "Private balance revealed",
          "success",
          `${formatted} ${selectedPair.confidentialSymbol}`
        );
        return;
      }

      // shield/faucet take an underlying ERC-20 amount; unshield takes a
      // confidential-token amount, and the two can have different decimals.
      const amountDecimals =
        action === "unwrap"
          ? selectedPair.confidentialDecimals
          : selectedPair.decimals;
      if (amountDecimals == null) {
        throw new Error("Live token decimals are unavailable.");
      }

      const amountBaseUnits = parseUnits(amount || "0", amountDecimals);
      const common = {
        account: walletAccount,
        amount: amountBaseUnits,
        callbacks: { onProgress },
        provider
      };
      const result =
        action === "claimFaucet"
          ? await actions.executeFaucetMint({
              ...common,
              tokenAddress: getAddress(selectedPair.underlyingAddress)
            })
          : action === "wrap"
            ? await actions.executeShield({
                ...common,
                wrapperAddress: getAddress(selectedPair.confidentialAddress)
              })
            : await actions.executeUnshield({
                ...common,
                wrapperAddress: getAddress(selectedPair.confidentialAddress)
              });

      setBalances((current) => {
        const next = { ...current };
        delete next[selectedPair.id];
        return next;
      });
      setPrivateBalances((current) => {
        const next = { ...current };
        delete next[selectedPair.id];
        return next;
      });
      setBalanceRefreshKey((current) => current + 1);
      if (action === "unwrap") setPendingUnshield(null);
      setExecution({
        status: "success",
        phase: "complete",
        title: result.title,
        detail: "Confirmed on Sepolia.",
        txHash: result.txHash
      });
      pushActivity(result.title, "success", "Confirmed on Sepolia.", result.txHash);
    } catch (error) {
      failAction(error);
    }
  }, [
    account,
    action,
    amount,
    buildPlan,
    connect,
    failAction,
    pushActivity,
    selectedPair,
    switchToSepolia,
    wrongNetwork
  ]);

  const resumePendingUnshield = useCallback(async () => {
    if (!account) {
      void connect();
      return;
    }
    if (wrongNetwork) {
      void switchToSepolia();
      return;
    }
    if (!pendingUnshield || pendingUnshield.pairId !== selectedPair?.id) return;

    const provider = getEthereum();
    if (!provider) {
      setWalletError(
        "No EVM wallet detected. Install MetaMask or another browser wallet to continue."
      );
      return;
    }
    if (!selectedPair) return;

    setAction("unwrap");
    setActionError(null);
    setExecution({
      status: "running",
      phase: "planning",
      title: "Resuming pending unshield",
      detail: "Veylbase is recovering the unwrap you already submitted."
    });

    try {
      const actions = await import("./confidential-actions");
      const walletAccount = getAddress(account);
      const onProgress = (progress: ExecutionProgress) => {
        setExecution({ ...progress, status: "running" });
        if (progress.txHash) {
          pushActivity(progress.title, "accent", progress.detail, progress.txHash);
        }
      };
      const result = await actions.executeResumeUnshield({
        account: walletAccount,
        callbacks: { onProgress },
        provider,
        unwrapTxHash: pendingUnshield.txHash,
        wrapperAddress: getAddress(selectedPair.confidentialAddress)
      });

      setBalances((current) => {
        const next = { ...current };
        delete next[selectedPair.id];
        return next;
      });
      setPrivateBalances((current) => {
        const next = { ...current };
        delete next[selectedPair.id];
        return next;
      });
      setPendingUnshield(null);
      setBalanceRefreshKey((current) => current + 1);
      setExecution({
        status: "success",
        phase: "complete",
        title: result.title,
        detail: "Confirmed on Sepolia.",
        txHash: result.txHash
      });
      pushActivity(result.title, "success", "Confirmed on Sepolia.", result.txHash);
    } catch (error) {
      failAction(error);
    }
  }, [
    account,
    connect,
    failAction,
    pendingUnshield,
    pushActivity,
    selectedPair,
    switchToSepolia,
    wrongNetwork
  ]);

  const onPrimary = useCallback(() => {
    void runAction();
  }, [runAction]);

  const openPlanDrawer = useCallback(() => {
    setPlanOpen(true);
    if (account && (isReveal || amountNumber > 0)) void generatePlan(action);
  }, [account, action, amountNumber, generatePlan, isReveal]);

  if (!selectedPair) return null;

  const eyebrow = eyebrowByAction[action];
  const title = titleFor(action, selectedPair);
  const subtitle = subtitleFor(action, selectedPair);
  const primaryLabel = executing
    ? "Working..."
    : primaryLabelFor(action, Boolean(account));
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
        : "...";

  const privateBalanceDisplay = privateBalance
    ? privateBalance.formatted
    : "******";

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
                {publicBalanceDisplay} <span className="vb-accent">· {privateBalanceDisplay}</span>
              </span>
            </span>
            <span className="vb-change">
              Change
              <ChevronDown size={14} aria-hidden="true" />
            </span>
          </button>

          <div className="vb-card-body">
            {pendingUnshield?.pairId === selectedPair.id ? (
              <PendingUnshieldNotice
                chain={snapshot.chain}
                disabled={executing}
                onResume={resumePendingUnshield}
                txHash={pendingUnshield.txHash}
              />
            ) : null}

            {isReveal ? (
              <RevealPanel
                account={account}
                confidentialSymbol={selectedPair.confidentialSymbol}
                cta={revealCta}
                loading={executing}
                revealedValue={privateBalanceDisplay}
                revealed={Boolean(privateBalance)}
                onReveal={onPrimary}
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
            {execution || actionError ? (
              <ExecutionStatus
                chain={snapshot.chain}
                error={actionError}
                execution={execution}
                onRetry={onPrimary}
              />
            ) : null}
          </div>
        </div>

        <ActivityPanel activity={activity} chain={snapshot.chain} />
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

function explorerTxUrl(chain: UiRegistryChain, txHash: Hex) {
  return `${chain.explorerUrl}/tx/${txHash}`;
}

function ExecutionStatus({
  chain,
  error,
  execution,
  onRetry
}: {
  chain: UiRegistryChain;
  error: string | null;
  execution: ExecutionState | null;
  onRetry: () => void;
}) {
  if (!execution && !error) return null;
  const status = execution?.status ?? "error";
  const txHash = execution?.txHash;
  return (
    <div className={cx("vb-execution", `is-${status}`)} role="status">
      <span className="vb-execution-dot" />
      <span className="vb-execution-copy">
        <strong>{execution?.title ?? "Action did not complete"}</strong>
        <small>{error ?? execution?.detail}</small>
      </span>
      {status === "error" ? (
        <button className="vb-execution-link" onClick={onRetry} type="button">
          Retry
        </button>
      ) : txHash ? (
        <a
          className="vb-execution-link"
          href={explorerTxUrl(chain, txHash)}
          rel="noreferrer"
          target="_blank"
        >
          View
        </a>
      ) : null}
    </div>
  );
}

function PendingUnshieldNotice({
  chain,
  disabled,
  onResume,
  txHash
}: {
  chain: UiRegistryChain;
  disabled: boolean;
  onResume: () => void;
  txHash: Hex;
}) {
  return (
    <div className="vb-pending-unshield" role="status">
      <span className="vb-execution-dot" />
      <span className="vb-execution-copy">
        <strong>Pending unshield found</strong>
        <small>Finish the unwrap you already submitted before starting another one.</small>
      </span>
      <span className="vb-pending-actions">
        <a
          className="vb-execution-link"
          href={explorerTxUrl(chain, txHash)}
          rel="noreferrer"
          target="_blank"
        >
          View
        </a>
        <button
          className="vb-execution-link"
          disabled={disabled}
          onClick={onResume}
          type="button"
        >
          Resume
        </button>
      </span>
    </div>
  );
}

function RevealPanel({
  account,
  confidentialSymbol,
  cta,
  loading,
  revealed,
  revealedValue,
  onReveal
}: {
  account: string | null;
  confidentialSymbol: string;
  cta: string;
  loading: boolean;
  revealed: boolean;
  revealedValue: string;
  onReveal: () => void;
}) {
  return (
    <div className="vb-flow">
      <div className="vb-reveal-card">
        <span className="vb-reveal-label">Private holding - {confidentialSymbol}</span>
        <strong className={cx("vb-reveal-hidden", revealed && "is-revealed")}>
          {revealed ? revealedValue : "******"}
        </strong>
        <span className="vb-reveal-hint">
          <Lock size={13} aria-hidden="true" />
          {revealed ? "Revealed in this session" : "Hidden by default - encrypted on-chain"}
        </span>
      </div>
      <p className="vb-reveal-copy">
        Revealing decrypts the balance to your wallet only. You sign a permit - no
        transaction, no on-chain trace.
      </p>
      <button className="vb-primary" disabled={loading} onClick={onReveal} type="button">
        <Eye size={17} aria-hidden="true" />
        {loading ? "Revealing..." : account ? cta : "Connect & reveal"}
      </button>
    </div>
  );
}

function ActivityPanel({
  activity,
  chain
}: {
  activity: ActivityEvent[];
  chain: UiRegistryChain;
}) {
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
              <span className="vb-activity-text">
                <strong>{event.title}</strong>
                {event.detail ? <small>{event.detail}</small> : null}
              </span>
              {event.txHash ? (
                <a
                  className="vb-activity-link"
                  href={explorerTxUrl(chain, event.txHash)}
                  rel="noreferrer"
                  target="_blank"
                >
                  View
                </a>
              ) : null}
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
