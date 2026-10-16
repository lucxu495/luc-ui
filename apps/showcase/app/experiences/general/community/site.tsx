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
  IconButton,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Textarea,
  toast,
} from "@luc/ui";
import { RiMore2Line, RiPushpin2Line } from "@remixicon/react";
import { useI18n } from "@/lib/i18n/provider";
import { FEED, REACTIONS, type Post, type ReactionId } from "./data";

// Common room — a community product.
//
// A social feed is where a component library is most likely to lie to itself,
// because a screenshot of a feed looks identical to a working one. Every action
// below changes real state: posting prepends a card, a reaction increments its
// own count, a reply is appended to that post, following flips, and deleting
// removes the post after a confirmation the reader can cancel.
//
// The moderation path is the reason this page exists. A delete button that acts
// immediately is the commonest destructive-action defect in community software,
// and the confirmation has to quote the post and be escapable.

function emptyReactions(): Post["reactions"] {
  return {
    insightful: { count: 0, mine: false },
    same: { count: 0, mine: false },
    solved: { count: 0, mine: false },
  };
}

export function CommonRoomSite() {
  const { tcs } = useI18n();
  const [posts, setPosts] = useState<Post[]>(FEED);
  const [draft, setDraft] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [pendingDelete, setPendingDelete] = useState<Post | null>(null);
  const [showOnlyFollowing, setShowOnlyFollowing] = useState(false);

  const visible = showOnlyFollowing ? posts.filter((post) => post.author.following) : posts;

  const publish = () => {
    const body = draft.trim();
    if (body.length < 12) {
      toast.error(tcs("Write at least a sentence before posting"), {
        description: tcs("Short notes are fine — twelve characters or more."),
      });
      return;
    }
    setPosts((current) => [
      {
        id: `post-${current.length + 1}`,
        author: { name: "You", handle: "you", role: "Member", following: false },
        body,
        posted: tcs("Just now"),
        topics: ["New"],
        reactions: emptyReactions(),
        comments: [],
      },
      ...current,
    ]);
    setDraft("");
    toast.success(tcs("Posted to the room"));
  };

  const react = (postId: string, reaction: ReactionId) => {
    setPosts((current) =>
      current.map((post) => {
        if (post.id !== postId) return post;
        const entry = post.reactions[reaction];
        return {
          ...post,
          reactions: {
            ...post.reactions,
            [reaction]: {
              count: Math.max(0, entry.count + (entry.mine ? -1 : 1)),
              mine: !entry.mine,
            },
          },
        };
      }),
    );
  };

  const comment = (postId: string) => {
    const body = (commentDrafts[postId] ?? "").trim();
    if (!body) return;
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [
                ...post.comments,
                {
                  id: `${postId}-c${post.comments.length + 1}`,
                  author: "You",
                  body,
                  posted: tcs("Just now"),
                },
              ],
            }
          : post,
      ),
    );
    setCommentDrafts((current) => ({ ...current, [postId]: "" }));
  };

  const toggleFollow = (postId: string) => {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? { ...post, author: { ...post.author, following: !post.author.following } }
          : post,
      ),
    );
  };

  return (
    <div data-slot="common-room" className="flex flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line-subtle px-6 py-4">
        <div className="flex flex-col">
          <h2 className="font-display text-heading-sm font-semibold text-fg-primary">
            {tcs("Common room")}
          </h2>
          <p className="text-caption text-fg-muted">
            {tcs("Notes from people building and running systems.")}
          </p>
        </div>
        <Button
          size="sm"
          variant={showOnlyFollowing ? "accent" : "outline"}
          aria-pressed={showOnlyFollowing}
          onClick={() => setShowOnlyFollowing((value) => !value)}
        >
          {showOnlyFollowing ? tcs("Showing who you follow") : tcs("Show who you follow")}
        </Button>
      </header>

      <div className="mx-auto flex w-full max-w-[var(--experience-max)] flex-col gap-5 px-6 py-6">
        <Card variant="raised">
          <CardContent className="flex flex-col gap-3 p-4">
            <Field
              label={tcs("Start a note")}
              description={tcs("Markdown is not parsed yet — plain text only.")}
            >
              <Textarea
                name="post"
                autoResize
                placeholder={tcs("What did you learn today?")}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
            </Field>
            <div className="flex items-center justify-between gap-3">
              <span className="text-caption text-fg-muted luc-numeric">
                {draft.trim().length} {tcs("characters")}
              </span>
              <Button size="sm" variant="accent" onClick={publish}>
                {tcs("Post to the room")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <ul className="flex list-none flex-col gap-4">
          {visible.map((post) => (
            <li key={post.id}>
              <Card variant="default" as="article">
                <CardContent className="flex flex-col gap-4 p-5">
                  <header className="flex items-start gap-3">
                    <Avatar
                      name={post.author.name}
                      size="sm"
                      fallback={post.author.name.slice(0, 1)}
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-label font-semibold text-fg-primary">
                          {post.author.name}
                        </span>
                        <span className="text-micro text-fg-muted luc-numeric">
                          @{post.author.handle}
                        </span>
                        {post.pinned ? (
                          <Badge tone="accent" size="sm">
                            <RiPushpin2Line aria-hidden="true" className="size-3" />
                            {tcs("Pinned")}
                          </Badge>
                        ) : null}
                      </span>
                      <span className="text-micro text-fg-muted">
                        {tcs(post.author.role)} · {post.posted}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant={post.author.following ? "ghost" : "outline"}
                      aria-pressed={post.author.following}
                      disabled={post.author.handle === "you"}
                      onClick={() => toggleFollow(post.id)}
                    >
                      {post.author.following ? tcs("Following") : tcs("Follow")}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <IconButton
                          variant="ghost"
                          size="sm"
                          label={tcs("Post actions")}
                          icon={<RiMore2Line aria-hidden="true" />}
                        />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => toast.info(tcs("Saved to your bookmarks"))}>
                          {tcs("Save")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => toast.info(tcs("Thanks — a moderator will look at it"))}
                        >
                          {tcs("Report")}
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onSelect={() => setPendingDelete(post)}>
                          {tcs("Delete post")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </header>

                  <p className="max-w-[68ch] text-body-lg text-fg-secondary text-pretty">
                    {tcs(post.body)}
                  </p>

                  <ul className="flex list-none flex-wrap gap-1.5">
                    {post.topics.map((entry) => (
                      <li
                        key={entry}
                        className="rounded-xs border border-line-subtle bg-surface-interactive px-1.5 py-0.5 text-micro text-fg-muted"
                      >
                        {entry}
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap items-center gap-2 border-t border-line-subtle pt-3">
                    {REACTIONS.map((reaction) => {
                      const entry = post.reactions[reaction.id];
                      return (
                        <Button
                          key={reaction.id}
                          size="sm"
                          variant={entry.mine ? "accent" : "outline"}
                          aria-pressed={entry.mine}
                          onClick={() => react(post.id, reaction.id)}
                        >
                          {tcs(reaction.label)}
                          <span className="luc-numeric">{entry.count}</span>
                        </Button>
                      );
                    })}
                    <span className="ml-auto text-caption text-fg-muted luc-numeric">
                      {post.comments.length
                        ? `${post.comments.length} ${tcs("replies")}`
                        : tcs("No replies yet")}
                    </span>
                  </div>

                  {post.comments.length > 0 ? (
                    <ul className="flex list-none flex-col gap-3 border-t border-line-subtle pt-3">
                      {post.comments.map((entry) => (
                        <li key={entry.id} className="flex gap-3">
                          <Avatar name={entry.author} size="xs" fallback={entry.author.slice(0, 1)} />
                          <div className="flex min-w-0 flex-col">
                            <span className="text-caption font-medium text-fg-primary">
                              {entry.author}
                              <span className="ml-2 font-normal text-fg-muted">{entry.posted}</span>
                            </span>
                            <span className="text-body text-fg-secondary text-pretty">
                              {tcs(entry.body)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <div className="flex items-end gap-2">
                    <Field label={tcs("Reply")} className="flex-1">
                      <Textarea
                        name={`reply-${post.id}`}
                        size="sm"
                        autoResize
                        placeholder={tcs("Add a reply…")}
                        value={commentDrafts[post.id] ?? ""}
                        onChange={(event) =>
                          setCommentDrafts((current) => ({
                            ...current,
                            [post.id]: event.target.value,
                          }))
                        }
                      />
                    </Field>
                    <Button size="sm" variant="outline" onClick={() => comment(post.id)}>
                      {tcs("Reply")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>

        {visible.length === 0 ? (
          <p className="rounded-md border border-dashed border-line-default bg-surface-sunken p-6 text-center text-body text-fg-muted">
            {tcs("Nobody you follow has posted yet. Turn the filter off to see the whole room.")}
          </p>
        ) : null}
      </div>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogTitle>{tcs("Delete this post?")}</AlertDialogTitle>
          <AlertDialogDescription>
            {tcs(
              "It disappears for everyone in the room, including the replies. This cannot be undone.",
            )}
          </AlertDialogDescription>
          <p className="mt-3 rounded-sm border border-line-subtle bg-surface-sunken p-3 text-caption text-fg-secondary">
            {pendingDelete ? tcs(pendingDelete.body) : null}
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel>{tcs("Keep it")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const id = pendingDelete?.id;
                setPosts((current) => current.filter((post) => post.id !== id));
                setPendingDelete(null);
                toast.success(tcs("Post deleted"), {
                  description: tcs("Undo is not available in this demo."),
                });
              }}
            >
              {tcs("Delete post")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
