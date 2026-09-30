"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { GameComponentProps } from "@rarefriends/friendsdk/runtime";
import { formatGameAmount } from "@rarefriends/friendsdk/ui";
import { createFriendSoundKit, type FriendSoundKit } from "@rarefriends/friendsdk/sounds";
import { createFriendReader, spriteFrame } from "@rarefriends/friendsdk/sprites";
import type { GamePlay, GameSnapshot } from "@rarefriends/friendsdk/game";
import {
  PREVIEW_FRIEND_ID,
  PREVIEW_IDLE,
  assets,
  chanceLabel,
  definition,
  expectedPayout,
  maximumPayout,
} from "./definition";
import { PixelArt } from "./pixels";
import "./style.css";

export type OwnedChip = Readonly<{ id: bigint; label: string }>;

export type PitScore = {
  friendId: string;
  net: string;
  biggestName: string;
  biggestHit: string;
  seals: number;
};

export type PitHost = Readonly<{
  onStandFriend?: (id: bigint) => void;
  onResetBook?: () => void;
  onConnect?: () => void;
  onScore?: (score: PitScore) => void;
  boardSlot?: ReactNode;
  accountSlot?: ReactNode;
  walletNote?: string;
  owned?: readonly OwnedChip[];
}>;

type Phase = "boot" | "idle" | "working" | "cracking" | "reveal";

type Print = Readonly<{ id: number; text: string; detail: string }>;

type Flow = {
  spent: bigint;
  redeemed: bigint;
  seals: number;
  biggest: bigint;
  biggestName: string;
};

const emptyFlow = (): Flow => ({ spent: 0n, redeemed: 0n, seals: 0, biggest: 0n, biggestName: "" });

const rf = (value: bigint) => `${formatGameAmount(value, 18)} RF`;

function wait(ms: number) {
  if (ms <= 0) return Promise.resolve();
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function typingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
}

/** SDK game entry. The runtime passes the verified Friend and the chance client. */
export default function MidnightPit({ friendId, client, paused, host }: GameComponentProps & { host?: PitHost }) {
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [phase, setPhase] = useState<Phase>("boot");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Simulated book. No wallet spend in this preview.");
  const [reveal, setReveal] = useState<GamePlay | null>(null);
  const [prints, setPrints] = useState<readonly Print[]>([]);
  const [flow, setFlow] = useState<Flow>(emptyFlow);
  const [muted, setMuted] = useState(true);
  const [shake, setShake] = useState(true);
  const [hit, setHit] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [desk, setDesk] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);
  const [draft, setDraft] = useState(friendId.toString());
  const [clip, setClip] = useState<readonly (readonly string[])[]>(PREVIEW_IDLE);
  const [frame, setFrame] = useState(0);
  const [family, setFamily] = useState(friendId === PREVIEW_FRIEND_ID ? "Family" : "Friend");
  const [artNote, setArtNote] = useState(friendId === PREVIEW_FRIEND_ID ? "Cached canonical pixels." : "Reading artwork…");
  const sound = useRef<FriendSoundKit | null>(null);
  const epoch = useRef(0);
  const printId = useRef(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<Flow>(emptyFlow());

  const calm = reduced;

  useEffect(() => {
    const version = ++epoch.current;
    sound.current?.dispose();
    sound.current = createFriendSoundKit({ muted: true });
    setSnapshot(null);
    setPhase("boot");
    setReveal(null);
    setError("");
    setPrints([]);
    const cleared = emptyFlow();
    flowRef.current = cleared;
    setFlow(cleared);
    setDraft(friendId.toString());
    setStatus(client.mode === "preview" ? "Simulated book. No wallet spend in this preview." : "Live book. Wallet prompts spend real gas.");
    void client.read().then((value) => {
      if (version !== epoch.current) return;
      setSnapshot(value);
      setPhase("idle");
    }).catch((cause: unknown) => {
      if (version !== epoch.current) return;
      setError(cause instanceof Error ? cause.message : "Could not read the book.");
      setPhase("idle");
    });
    return () => {
      epoch.current += 1;
      sound.current?.dispose();
      sound.current = null;
    };
  }, [client, friendId]);

  useEffect(() => {
    sound.current?.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    let alive = true;
    if (friendId === PREVIEW_FRIEND_ID) {
      setClip(PREVIEW_IDLE);
      setFamily("Family");
      setArtNote("Cached canonical pixels.");
    } else {
      setArtNote("Reading artwork…");
    }
    const reader = createFriendReader();
    void reader.read(friendId).then((sprites) => {
      if (!alive) return;
      const frames = [0, 1, 2, 3].map((index) => spriteFrame(sprites, "down", false, index).frame.rows);
      const unique: string[][] = [];
      for (const rows of frames) {
        const key = rows.join("");
        if (!unique.some((existing) => existing.join("") === key)) unique.push([...rows]);
      }
      setClip(unique.length > 0 ? unique : PREVIEW_IDLE);
      setFamily(sprites.familyName);
      setArtNote("Canonical pixels from Robinhood.");
    }).catch(() => {
      if (!alive) return;
      if (friendId !== PREVIEW_FRIEND_ID) {
        setClip(PREVIEW_IDLE);
        setFamily("Unread");
        setArtNote("Could not read that Friend. The book still uses this id.");
      }
    });
    return () => {
      alive = false;
      reader.clear();
    };
  }, [friendId]);

  useEffect(() => {
    if (calm || clip.length < 2) return;
    const timer = window.setInterval(() => setFrame((current) => (current + 1) % clip.length), 480);
    return () => window.clearInterval(timer);
  }, [calm, clip]);

  useEffect(() => {
    if (phase === "reveal") dialogRef.current?.focus();
  }, [phase]);

  function punch(rare: boolean) {
    if (calm || !shake) return;
    setHit(true);
    window.setTimeout(() => setHit(false), rare ? 420 : 280);
  }

  function postScore(next: Flow) {
    flowRef.current = next;
    setFlow(next);
    if (next.seals < 1 || !next.biggestName) return;
    host?.onScore?.({
      friendId: friendId.toString(),
      net: (next.redeemed - next.spent).toString(),
      biggestName: next.biggestName,
      biggestHit: next.biggest.toString(),
      seals: next.seals,
    });
  }
  function pushPrint(text: string, detail: string) {
    const id = ++printId.current;
    setPrints((current) => [{ id, text, detail }, ...current].slice(0, 6));
  }

  async function refresh(version: number) {
    const value = await client.read();
    if (version !== epoch.current) return null;
    setSnapshot(value);
    return value;
  }

  async function deploy() {
    if (paused || phase === "working" || phase === "cracking" || !snapshot) return;
    const version = epoch.current;
    setError("");
    setPhase("working");
    setStatus("Committing the seal…");
    void sound.current?.unlock();
    try {
      const pending = snapshot.plays.find((play) => play.outcomeId === null);
      let play = pending;
      if (!play && snapshot.consumables === 0n) {
        await client.buy(1n);
        if (version !== epoch.current) return;
        const spent = {
          ...flowRef.current,
          spent: flowRef.current.spent + client.definition.price,
        };
        flowRef.current = spent;
        setFlow(spent);
        sound.current?.play("purchase");
      }
      if (!play) {
        const opened = await client.play(1n);
        play = opened[0];
      }
      if (!play) throw new Error("The seal did not open a roll.");
      setPhase("cracking");
      setStatus("Chance is committed. Cracking the seal…");
      sound.current?.play("anticipation");
      const settled = await client.settle(play.id);
      if (version !== epoch.current) return;
      if (settled.outcomeId === null) {
        setStatus("Roll pending. Resume it. Nothing was revealed.");
        setPhase("idle");
        await refresh(version);
        return;
      }
      await wait(calm ? 0 : 720);
      if (version !== epoch.current) return;
      const outcome = client.definition.outcomes[settled.outcomeId - 1];
      if (!outcome) throw new Error("The roll named an unknown asset.");
      await refresh(version);
      if (version !== epoch.current) return;
      const rare = outcome.chanceBps <= 400;
      sound.current?.play(outcome.chanceBps <= 100 ? "reveal-legendary" : rare ? "reveal-rare" : "reveal-common");
      punch(rare);
      pushPrint(`DEPLOY ${outcome.name}`, rf(outcome.reward));
      postScore({
        ...flowRef.current,
        seals: flowRef.current.seals + 1,
        biggest: outcome.reward > flowRef.current.biggest ? outcome.reward : flowRef.current.biggest,
        biggestName: outcome.reward > flowRef.current.biggest ? outcome.name : flowRef.current.biggestName,
      });
      setReveal(settled);
      setPhase("reveal");
      setStatus(`Deployed ${outcome.name}. Book ${rf(outcome.reward)}. Sell it or keep it on your Friend.`);
    } catch (cause) {
      if (version !== epoch.current) return;
      setError(cause instanceof Error ? cause.message : "The seal failed.");
      setStatus("The book rejected that seal.");
      setPhase("idle");
      await refresh(version);
    }
  }

  async function sell(outcomeId: number, quantity: bigint) {
    if (paused || phase === "working") return;
    const version = epoch.current;
    const outcome = client.definition.outcomes[outcomeId - 1];
    if (!outcome) return;
    setPhase("working");
    setError("");
    void sound.current?.unlock();
    try {
      await client.redeem(outcomeId, quantity);
      if (version !== epoch.current) return;
      const paid = outcome.reward * quantity;
      postScore({ ...flowRef.current, redeemed: flowRef.current.redeemed + paid });
      sound.current?.play("reward");
      punch(false);
      pushPrint(`SELL ${quantity.toString()} ${outcome.name}`, rf(paid));
      setReveal(null);
      setStatus(`Market paid ${rf(paid)} for ${outcome.name}.`);
      setPhase("idle");
      await refresh(version);
    } catch (cause) {
      if (version !== epoch.current) return;
      setError(cause instanceof Error ? cause.message : "The market refused the sale.");
      setPhase(reveal ? "reveal" : "idle");
    }
  }

  function keep() {
    setReveal(null);
    setPhase("idle");
    setStatus("Kept on your Friend. It still redeems at book, with no expiry.");
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (typingTarget(event.target) || paused) return;
      if (event.key === "Escape") {
        if (phase === "reveal") keep();
        else {
          setDesk(false);
          setBoardOpen(false);
        }
      }
      if ((event.key === "d" || event.key === "D") && phase === "idle" && !boardOpen) {
        event.preventDefault();
        void deploy();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const shown = clip[frame % clip.length] ?? clip[0] ?? PREVIEW_IDLE[0];
  const modeLabel = snapshot?.mode === "chain" ? "Live" : "Simulated";
  const pending = snapshot?.plays.some((play) => play.outcomeId === null) ?? false;
  const heldSeal = (snapshot?.consumables ?? 0n) > 0n;
  const backed = snapshot ? snapshot.freeStake >= maximumPayout : false;
  const funded = snapshot ? snapshot.rfBalance >= client.definition.price : false;
  const canDeploy = Boolean(snapshot) && phase === "idle" && !paused && (pending || heldSeal || (funded && backed));
  const deployLabel = pending ? "Resume roll" : heldSeal ? "Crack held seal" : `Deploy seal · ${rf(client.definition.price)}`;
  const blockReason = !snapshot
    ? ""
    : pending || heldSeal
      ? "A seal is already committed."
      : !funded
        ? "Not enough RF in this book."
        : !backed
          ? "Free backing is under the 10 RF reserve. Sell a kept asset."
          : "D deploys a seal. Chance picks the asset. The pit buys it back for RF.";

  const revealed = reveal?.outcomeId ? client.definition.outcomes[reveal.outcomeId - 1] : null;
  const revealedAsset = revealed ? assets.find((item) => item.name === revealed.name) : null;

  function standFriend(event: FormEvent) {
    event.preventDefault();
    try {
      const next = BigInt(draft.trim());
      if (next < 1n) throw new Error("Friend ids start at 1.");
      host?.onStandFriend?.(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That Friend id is not valid.");
    }
  }

  return (
    <section
      className={hit && !calm ? "cabinet is-hit" : calm ? "cabinet is-calm" : "cabinet"}
      aria-label={definition.name}
      aria-busy={phase === "working" || phase === "cracking" || phase === "boot"}
    >
      <header className="pit-top">
        <div>
          <p className="kicker">Rare Friends · $RAREFRIENDS</p>
          <h1>Midnight Pit</h1>
          <p className="identity">
            <strong>Friend #{friendId.toString()}</strong>
            {" · "}
            {family}
            {" · "}
            {artNote}
          </p>
        </div>
        <div className="balance">
          {host?.accountSlot}
          <span className="pill">{modeLabel}</span>
          <b>{snapshot ? rf(snapshot.rfBalance) : "—"}</b>
          <span>Book balance</span>
        </div>
      </header>

      <div className="stage" inert={phase === "reveal" || paused ? true : undefined}>
        <div className="dealer">
          <div className="friend-card">
            <div className={calm ? "friend-frame" : "friend-frame is-alive"}>
              <PixelArt rows={shown} label={`${family} Friend ${friendId.toString()}`} />
            </div>
            <div>
              <h2>Pit boss</h2>
              <p>This NFT stands the book. Assets you keep sit on its wallet until you sell them.</p>
            </div>
          </div>
          <ol className="steps">
            <li>Deploy a seal for 1 RF.</li>
            <li>Chance picks one asset type.</li>
            <li>Sell it to the market, or keep it.</li>
          </ol>
          <div className="deploy-bar">
            <button type="button" className="wax" disabled={!canDeploy} onClick={() => void deploy()}>
              <span className={phase === "cracking" && !calm ? "seal-mark is-cracking" : "seal-mark"} aria-hidden="true" />
              {phase === "working" ? "Writing the book…" : phase === "cracking" ? "Cracking…" : deployLabel}
            </button>
            <p className="reason">{blockReason}</p>
          </div>
          <p className="note">
            Expected {rf(expectedPayout)} on a {rf(client.definition.price)} seal. Max prize {rf(maximumPayout)}, reserved up front.
            {snapshot ? ` Free backing ${rf(snapshot.freeStake)}.` : ""}
          </p>
        </div>

        <div className="book">
          <div className="book-head">
            <div>
              <h2>RF market</h2>
              <p>Every asset is paired to $RAREFRIENDS at a fixed book. No other coin clears here.</p>
            </div>
            <div className="toggles">
              <button type="button" aria-expanded={desk} onClick={() => setDesk((open) => !open)}>
                {desk ? "Close desk" : "Desk"}
              </button>
              {host?.boardSlot ? (
                <button type="button" aria-expanded={boardOpen} aria-controls="leaderboard-title" onClick={() => setBoardOpen((open) => !open)}>
                  {boardOpen ? "Close leaders" : "Leaders"}
                </button>
              ) : null}
            </div>
          </div>
          <div className="quotes">
            {client.definition.outcomes.map((outcome, index) => {
              const asset = assets.find((item) => item.name === outcome.name);
              const held = snapshot?.inventory[index] ?? 0n;
              if (!asset) return null;
              return (
                <article className="quote" data-tone={asset.tone} key={outcome.name}>
                  <div className="quote-icon">
                    <PixelArt rows={asset.rows} label={asset.name} />
                  </div>
                  <div>
                    <h3>{outcome.name}</h3>
                    <p>
                      {chanceLabel(outcome.chanceBps)}
                      {" · book "}
                      {rf(outcome.reward)}
                      {" · held "}
                      {held.toString()}
                    </p>
                  </div>
                  <div className="quote-actions">
                    <button
                      type="button"
                      className="brass"
                      disabled={paused || phase !== "idle" || held < 1n}
                      onClick={() => void sell(index + 1, 1n)}
                    >
                      Sell 1
                    </button>
                    {held > 1n ? (
                      <button
                        type="button"
                        disabled={paused || phase !== "idle"}
                        onClick={() => void sell(index + 1, held)}
                      >
                        Sell {held.toString()}
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
          <ul className="tape" aria-label="Market tape">
            {prints.length === 0 ? <li><span>No prints yet.</span><span>Deploy to open the tape.</span></li> : null}
            {prints.map((print) => (
              <li key={print.id}>
                <span>{print.text}</span>
                <span>{print.detail}</span>
              </li>
            ))}
          </ul>
          <p className="note">
            Session flow · spent {rf(flow.spent)} · redeemed {rf(flow.redeemed)} · net {rf(flow.redeemed - flow.spent)}
          </p>
          {desk ? (
            <div className="settings">
              <h2>Desk</h2>
              <div className="toggles">
                <button
                  type="button"
                  aria-pressed={!muted}
                  onClick={() => {
                    const next = !muted;
                    setMuted(next);
                    if (!next) void sound.current?.unlock();
                  }}
                >
                  {muted ? "Sound off" : "Sound on"}
                </button>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={reduced}
                    onChange={(event) => setReduced(event.target.checked)}
                  />
                  Reduce motion
                </label>
                <label className="check">
                  <input type="checkbox" checked={shake} onChange={(event) => setShake(event.target.checked)} />
                  Screen shake
                </label>
              </div>
              {host?.onStandFriend ? (
                <form className="stand" onSubmit={standFriend}>
                  <label>
                    Friend id
                    <input
                      inputMode="numeric"
                      aria-label="Friend id"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                    />
                  </label>
                  <button type="submit" className="brass">Stand Friend</button>
                </form>
              ) : null}
              {host?.onStandFriend ? <p>Standing a Friend resets this simulated book to 20 RF and 100 RF of backing.</p> : null}
              {host?.owned && host.owned.length > 0 ? (
                <div className="owned">
                  {host.owned.slice(0, 12).map((friend) => (
                    <button key={friend.id.toString()} type="button" onClick={() => host.onStandFriend?.(friend.id)}>
                      {friend.label || `#${friend.id.toString()}`}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="toggles">
                {host?.onConnect ? (
                  <button type="button" onClick={host.onConnect}>Connect wallet</button>
                ) : null}
                {host?.onResetBook ? (
                  <button type="button" onClick={host.onResetBook}>Reset simulated book</button>
                ) : null}
              </div>
              {host?.walletNote ? <p>{host.walletNote}</p> : null}
              <p>Odds are fixed. The crack animation never changes the roll. Reloading clears the preview ledger.</p>
            </div>
          ) : null}
        </div>
      </div>

      <footer className="pit-foot">
        <p className="status" role={error ? "alert" : "status"} data-tone={error ? "alert" : "ok"}>
          {error || status}
        </p>
        <span className="desktop-hint">D deploy · Esc close</span>
      </footer>

      {boardOpen && host?.boardSlot ? (
        <div
          className="board-layer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="leaderboard-title"
          onClick={() => setBoardOpen(false)}
        >
          <div className="board-sheet" onClick={(event) => event.stopPropagation()}>
            {host.boardSlot}
            <button type="button" className="brass" onClick={() => setBoardOpen(false)}>
              Close
            </button>
          </div>
        </div>
      ) : null}

      {reveal && revealed && revealedAsset && (phase === "reveal" || phase === "working") ? (
        <div
          className="reveal-layer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reveal-title"
          ref={dialogRef}
          tabIndex={-1}
        >
          <div className="reveal" data-tone={revealedAsset.tone}>
            <p className="kicker">Asset deployed</p>
            <div className="pixel-wrap">
              <PixelArt rows={revealedAsset.rows} label={revealed.name} />
            </div>
            <h3 id="reveal-title">{revealed.name}</h3>
            <p>
              {chanceLabel(revealed.chanceBps)} chance · book {rf(revealed.reward)}. {revealedAsset.note}
            </p>
            <div className="actions">
              <button type="button" onClick={keep}>Keep on Friend</button>
              <button type="button" className="wax" onClick={() => void sell(reveal?.outcomeId ?? 1, 1n)}>
                Sell to market · {rf(revealed.reward)}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
