import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export function ReviewMarkdown({ content }: { content: string }) {
  return (
    <div className="max-w-4xl min-w-0 text-sm leading-6 text-muted-foreground [&>h1]:mb-4 [&>h1]:mt-0 [&>h1]:text-xl [&>h1]:font-semibold [&>h1]:tracking-tight [&>h2]:mb-3 [&>h2]:mt-7 [&>h2]:border-b [&>h2]:border-border/60 [&>h2]:pb-2 [&>h2]:text-lg [&>h2]:font-semibold [&>h3]:mb-2 [&>h3]:mt-5 [&>h3]:text-base [&>h3]:font-semibold [&>h4]:mb-2 [&>h4]:mt-4 [&>h4]:font-semibold [&>p]:my-3 [&>ul]:my-3 [&>ul]:list-disc [&>ul]:space-y-1 [&>ul]:pl-6 [&>ol]:my-3 [&>ol]:list-decimal [&>ol]:space-y-1 [&>ol]:pl-6 [&_li>p]:my-0 [&_strong]:font-semibold [&_strong]:text-foreground [&_em]:text-foreground/90 [&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_hr]:my-6 [&_hr]:border-border/70 [&_a]:break-words [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a]:transition-colors [&_a:hover]:text-primary/80 [&_table]:my-4 [&_table]:w-full [&_table]:min-w-[520px] [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:bg-muted/60 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_tr:nth-child(even)]:bg-muted/20"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children, ...props }) => {
            const isExternal = href?.startsWith("http://") || href?.startsWith("https://");
            return <a href={href} {...(isExternal ? { target: "_blank", rel: "noreferrer" } : {})} {...props}>{children}</a>;
          },
          code: ({ className, children, ...props }) => (
            <code className={cn("rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground", className)} {...props}>
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="my-4 max-w-full overflow-x-auto rounded-lg border border-border/80 bg-zinc-950 p-4 font-mono text-xs leading-5 text-zinc-100 shadow-sm dark:bg-black/40">
              {children}
            </pre>
          ),
          table: ({ children }) => <div className="my-4 max-w-full overflow-x-auto"><table>{children}</table></div>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
