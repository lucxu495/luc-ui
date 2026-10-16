"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  Field,
  Textarea,
  Timeline,
  toast,
} from "@luc/ui";
import { useI18n } from "@/lib/i18n/provider";

// Signal — a discussion forum.
//
// A forum is a list and a thread, and the thread is where the interesting
// failure lives: nesting, quoting and moderation. This page keeps the nesting
// one level deep (which is what a forum actually reads like) and makes the
// report flow a real confirmation, so the destructive path is escapable.

interface Thread {
  id: string;
  title: string;
  author: string;
  replies: number;
  views: number;
  posted: string;
  topic: string;
  pinned?: boolean;
}

interface Reply {
  id: string;
  author: string;
  body: string;
  posted: string;
  score: number;
  mine: boolean;
}

const THREADS: Thread[] = [
  {
    id: "th1",
    title: "How do you review a migration plan you did not write?",
    author: "Rae Halloway",
    replies: 14,
    views: 412,
    posted: "2 hours ago",
    topic: "Practice",
    pinned: true,
  },
  {
    id: "th2",
    title: "The parity check disagreed by four rows. What would you have done?",
    author: "Ifeoma Nwosu",
    replies: 31,
    views: 1_204,
    posted: "Yesterday",
    topic: "Reliability",
  },
  {
    id: "th3",
    title: "Is a status page a product or a promise?",
    author: "Tomas Lind",
    replies: 8,
    views: 189,
    posted: "2 days ago",
    topic: "Practice",
  },
];

const INITIAL_REPLIES: Reply[] = [
  {
    id: "r1",
    author: "Mei Watanabe",
    body: "Ask for the two numbers the plan is built on: how much data moves, and what the tolerance is. If either is a range rather than a number, you are reviewing a hope.",
    posted: "1 hour ago",
    score: 18,
    mine: false,
  },
  {
    id: "r2",
    author: "Samir Haddad",
    body: "Read the rollback first, forwards. A migration whose rollback has never been run is a one-way door with a plan attached.",
    posted: "48 minutes ago",
    score: 11,
    mine: false,
  },
];

export function SignalForum() {
  const { tcs } = useI18n();
  const [openThread, setOpenThread] = useState<string | null>(null);
  const [replies, setReplies] = useState<Reply[]>(INITIAL_REPLIES);
  const [draft, setDraft] = useState("");
  const [pendingReport, setPendingReport] = useState<Reply | null>(null);

  const thread = THREADS.find((entry) => entry.id === openThread) ?? null;

  const post = () => {
    const body = draft.trim();
    if (body.length < 8) {
      toast.error(tcs("Write a little more before posting"));
      return;
    }
    setReplies((current) => [
      ...current,
      { id: `r${current.length + 1}`, author: "You", body, posted: tcs("Just now"), score: 0, mine: false },
    ]);
    setDraft("");
    toast.success(tcs("Reply posted"));
  };

  const vote = (id: string) => {
    setReplies((current) =>
      current.map((reply) =>
        reply.id === id
          ? { ...reply, score: reply.score + (reply.mine ? -1 : 1), mine: !reply.mine }
          : reply,
      ),
    );
  };

  if (thread) {
    return (
      <div data-slot="signal-thread" className="mx-auto flex w-full max-w-[var(--experience-max)] flex-col gap-6 p-6">
        <Button variant="ghost" size="sm" onClick={() => setOpenThread(null)}>
          {tcs("Back to the topic list")}
        </Button>
        <header className="flex flex-col gap-3">
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral" size="sm">
              {thread.topic}
            </Badge>
            {thread.pinned ? (
              <Badge tone="accent" size="sm">
                {tcs("Pinned")}
              </Badge>
            ) : null}
          </span>
          <h2 className="font-display text-heading font-semibold text-fg-primary text-balance">
            {tcs(thread.title)}
          </h2>
          <p className="flex flex-wrap items-center gap-x-3 text-caption text-fg-muted">
            <span>{thread.author}</span>
            <span aria-hidden="true">·</span>
            <span>{thread.posted}</span>
            <span aria-hidden="true">·</span>
            <span className="luc-numeric">
              {replies.length} {tcs("replies")}
            </span>
          </p>
        </header>

        <ul className="flex list-none flex-col gap-4">
          {replies.map((reply) => (
            <li key={reply.id}>
              <Card variant="default">
                <CardContent className="flex gap-3 p-4">
                  <Avatar name={reply.author} size="sm" fallback={reply.author.slice(0, 1)} />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <span className="flex flex-wrap items-center gap-2 text-caption text-fg-muted">
                      <span className="font-medium text-fg-primary">{reply.author}</span>
                      <span>{reply.posted}</span>
                    </span>
                    <p className="text-body text-fg-secondary text-pretty">{tcs(reply.body)}</p>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={reply.mine ? "accent" : "outline"}
                        aria-pressed={reply.mine}
                        onClick={() => vote(reply.id)}
                      >
                        {tcs("Helpful")} <span className="luc-numeric">{reply.score}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPendingReport(reply)}
                      >
                        {tcs("Report")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>

        <Card variant="raised">
          <CardContent className="flex flex-col gap-3 p-4">
            <Field label={tcs("Add your reply")} description={tcs("Plain text. Nothing is published anywhere.")}>
              <Textarea
                name="reply"
                autoResize
                placeholder={tcs("What would you check first?")}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
            </Field>
            <div className="flex items-center justify-between gap-3">
              <span className="text-caption text-fg-muted luc-numeric">
                {draft.trim().length} {tcs("characters")}
              </span>
              <Button size="sm" variant="accent" onClick={post}>
                {tcs("Post reply")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <AlertDialog
          open={pendingReport !== null}
          onOpenChange={(open) => !open && setPendingReport(null)}
        >
          <AlertDialogContent>
            <AlertDialogTitle>{tcs("Report this reply?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tcs(
                "A moderator reads reports with the reply attached. Reporting is not a downvote and does not hide anything on its own.",
              )}
            </AlertDialogDescription>
            <p className="mt-3 rounded-sm border border-line-subtle bg-surface-sunken p-3 text-caption text-fg-secondary">
              {pendingReport ? tcs(pendingReport.body) : null}
            </p>
            <AlertDialogFooter>
              <AlertDialogCancel>{tcs("Cancel")}</AlertDialogCancel>
              <AlertDialogAction
                tone="primary"
                onClick={() => {
                  setPendingReport(null);
                  toast.info(tcs("Reported — thank you"));
                }}
              >
                {tcs("Send report")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div data-slot="signal-forum" className="mx-auto flex w-full max-w-[var(--experience-max)] flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h2 className="font-display text-heading-sm font-semibold text-fg-primary">Signal</h2>
        <p className="text-caption text-fg-muted">
          {tcs("Questions about running systems, answered by the people running them.")}
        </p>
      </header>

      <ul className="flex list-none flex-col">
        {THREADS.map((entry) => (
          <li key={entry.id} className="border-t border-line-subtle first:border-t-0">
            <button
              type="button"
              onClick={() => setOpenThread(entry.id)}
              className="luc-focus luc-transition flex w-full flex-col items-start gap-2 rounded-sm px-2 py-4 text-left hover:bg-surface-interactive"
            >
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-display text-title font-semibold text-fg-primary text-balance">
                  {tcs(entry.title)}
                </span>
                {entry.pinned ? (
                  <Badge tone="accent" size="sm">
                    {tcs("Pinned")}
                  </Badge>
                ) : null}
              </span>
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-micro text-fg-muted">
                <span>{entry.author}</span>
                <span aria-hidden="true">·</span>
                <span>{entry.topic}</span>
                <span aria-hidden="true">·</span>
                <span>{entry.posted}</span>
                <span aria-hidden="true">·</span>
                <span className="luc-numeric">{entry.replies} {tcs("replies")}</span>
                <span aria-hidden="true">·</span>
                <span className="luc-numeric">{entry.views} {tcs("views")}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Card variant="outline">
        <CardContent className="flex flex-col gap-3 p-4">
          <h3 className="text-label font-semibold text-fg-primary">{tcs("Recent activity")}</h3>
          <Timeline
            density="compact"
            items={THREADS.map((entry) => ({
              id: entry.id,
              title: tcs(entry.title),
              description: entry.author,
              meta: entry.posted,
              tone: entry.pinned ? "accent" : "neutral",
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
