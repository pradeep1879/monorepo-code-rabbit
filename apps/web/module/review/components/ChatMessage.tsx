import type { ConversationMessage } from "@/module/review/types";
import { Loader2 } from "lucide-react";

const inlineMarkdown = (value: string) =>
  value.split(/(`[^`]+`|https?:\/\/[^\s]+)/g).map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index} className="rounded bg-background/70 px-1 py-0.5 font-mono text-[0.8em]">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("http://") || part.startsWith("https://")) {
      return <a key={index} href={part} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">{part}</a>;
    }
    return part;
  });

export function ChatMessage({ message }: { message: ConversationMessage }) {
  const isUser = message.role === "USER";
  if (!isUser && !message.message) {
    return (
      <div className="flex justify-start">
        <div className="text-sm leading-6 text-foreground">
          <p className="mb-1 text-[11px] font-medium text-muted-foreground">AI Review</p>
          <div className="inline-flex items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2 text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> Thinking...
          </div>
        </div>
      </div>
    );
  }
  const sections = message.message.split("```");

  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div className={isUser ? "max-w-[85%] rounded-2xl rounded-br-md bg-primary/10 px-3.5 py-2.5 text-sm leading-6" : "max-w-[92%] text-sm leading-6 text-foreground"}>
        <p className="mb-1 text-[11px] font-medium text-muted-foreground">{isUser ? "You" : "AI Review"}</p>
        {sections.map((section, sectionIndex) => {
          if (sectionIndex % 2 === 1) {
            return <pre key={sectionIndex} className="my-2 overflow-x-auto rounded-lg bg-muted p-3 text-xs leading-5"><code>{section.trim()}</code></pre>;
          }

          return section.split("\n").map((line, lineIndex) => {
            const key = `${sectionIndex}-${lineIndex}`;
            if (!line.trim()) return <div key={key} className="h-2" />;
            const heading = line.match(/^(#{1,3})\s+(.+)/);
            if (heading) return <h4 key={key} className="mt-2 font-semibold">{inlineMarkdown(heading[2] ?? "")}</h4>;
            const bullet = line.match(/^[-*]\s+(.+)/);
            if (bullet) return <li key={key} className="ml-4 list-disc">{inlineMarkdown(bullet[1] ?? "")}</li>;
            const numbered = line.match(/^\d+\.\s+(.+)/);
            if (numbered) return <li key={key} className="ml-4 list-decimal">{inlineMarkdown(numbered[1] ?? "")}</li>;
            return <p key={key}>{inlineMarkdown(line)}</p>;
          });
        })}
      </div>
    </div>
  );
}
