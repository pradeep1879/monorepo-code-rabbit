"use client";

import { Loader2, Send, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  useApproveChatAction,
  useReviewChat,
  useSendReviewChatMessage,
} from "@/hooks/reviewHooks/useReviewChat";
import { ChatMessage } from "@/module/review/components/ChatMessage";
import { cn } from "@/lib/utils";

const prompts = [
  "Summarize the key issues",
  "Explain the most important finding",
  "How can I fix these issues?",
  "Why was this code flagged?",
];

export function ReviewChat({ reviewId }: { reviewId: string }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [panelWidth, setPanelWidth] = useState(448);
  const [isResizing, setIsResizing] = useState(false);
  const isSubmittingRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatQuery = useReviewChat(reviewId, open);
  const sendMessageMutation = useSendReviewChatMessage(reviewId);
  const approveActionMutation = useApproveChatAction(reviewId);
  const messages = useMemo(() => chatQuery.data ?? [], [chatQuery.data]);

  useEffect(() => {
    if (!isResizing) return;

    const handlePointerMove = (event: PointerEvent) => {
      const maxWidth = Math.min(900, window.innerWidth - 24);
      setPanelWidth(
        Math.max(360, Math.min(maxWidth, window.innerWidth - event.clientX)),
      );
    };
    const stopResizing = () => setIsResizing(false);

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", stopResizing);
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", stopResizing);
    };
  }, [isResizing]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submitMessage = (event?: FormEvent) => {
    event?.preventDefault();
    const message = input.trim();
    if (!message || sendMessageMutation.isPending || isSubmittingRef.current)
      return;
    isSubmittingRef.current = true;
    setInput("");
    sendMessageMutation.mutate(
      { message },
      { onSettled: () => (isSubmittingRef.current = false) },
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="outline" size="sm" className="gap-1.5" />}
      >
        <Sparkles className="size-3.5 text-primary" /> Ask AI
      </SheetTrigger>
      <SheetContent
        side="right"
        className={cn(
          "max-w-none gap-0 p-0 sm:max-w-none",
          isResizing && "transition-none",
        )}
        style={{
          width: `min(${panelWidth}px, calc(100vw - 1rem))`,
          maxWidth: "calc(100vw - 1rem)",
        }}
      >
        <div
          role="separator"
          aria-label="Resize chat panel"
          aria-orientation="vertical"
          aria-valuemin={360}
          aria-valuemax={900}
          aria-valuenow={panelWidth}
          tabIndex={0}
          onPointerDown={(event) => {
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            setIsResizing(true);
          }}
          onPointerCancel={() => setIsResizing(false)}
          onKeyDown={(event) => {
            const amount = event.shiftKey ? 48 : 16;
            if (event.key === "ArrowLeft")
              setPanelWidth((width) => Math.min(900, width + amount));
            if (event.key === "ArrowRight")
              setPanelWidth((width) => Math.max(360, width - amount));
          }}
          className="group absolute inset-y-0 left-0 z-10 hidden w-3 -translate-x-1/2 cursor-col-resize items-center justify-center outline-none sm:flex"
        >
          <span className="h-12 w-1 rounded-full bg-border opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100" />
        </div>
        <SheetHeader className="border-b px-5 py-4 pr-12">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" /> Ask AI about this
            review
          </SheetTitle>
          <SheetDescription>
            Ask questions about the findings and get help understanding or
            fixing them.
          </SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            {chatQuery.isLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {chatQuery.error && (
              <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                Unable to load this conversation.
              </p>
            )}
            {!chatQuery.isLoading && !chatQuery.error && !messages.length && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10">
                  <Sparkles className="size-6 text-primary" />
                </div>
                <h3 className="font-semibold">Ask AI about this review</h3>
                <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                  Ask questions about the findings, understand why something was
                  flagged, or get help fixing it.
                </p>
              </div>
            )}
            <div className="space-y-5">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onApprove={(approvalId, toolName) =>
                    approveActionMutation.mutate({ approvalId, toolName })
                  }
                  isApproving={approveActionMutation.isPending}
                />
              ))}
              <div ref={bottomRef} />
            </div>
          </div>
          <div className="border-t bg-muted/20 px-5 py-4">
            {!messages.length && (
              <div className="mb-3 flex flex-wrap gap-2">
                {prompts.map((prompt) => (
                  <Badge
                    key={prompt}
                    variant="outline"
                    className="h-auto cursor-pointer whitespace-normal px-2.5 py-1.5 text-left"
                    onClick={() => setInput(prompt)}
                  >
                    {prompt}
                  </Badge>
                ))}
              </div>
            )}
            {sendMessageMutation.error && (
              <p className="mb-2 text-sm text-destructive">
                {sendMessageMutation.error.message ||
                  "Unable to send your question. Please try again."}
              </p>
            )}
            {approveActionMutation.error && (
              <p className="mb-2 text-sm text-destructive">
                {approveActionMutation.error.message ||
                  "Unable to approve this action. Please try again."}
              </p>
            )}
            <form onSubmit={submitMessage} className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    submitMessage();
                  }
                }}
                placeholder="Ask about this review..."
                rows={2}
                disabled={sendMessageMutation.isPending}
                className="min-h-0 resize-none"
              />
              <Button
                type="submit"
                size="icon"
                disabled={sendMessageMutation.isPending || !input.trim()}
                aria-label="Send question"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
