import ReactMarkdown, { type Components } from "react-markdown";

const isExternal = (href: string | undefined) => !!href && /^https?:\/\//.test(href);

const components: Components = {
  h2: ({ children }) => <h2 className="mt-6 text-lg font-bold">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-4 font-semibold">{children}</h3>,
  p: ({ children }) => <p className="leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-medium text-primary underline underline-offset-2"
      {...(isExternal(href) ? { target: "_blank", rel: "nofollow noopener noreferrer" } : {})}
    >
      {children}
    </a>
  ),
  // Admin content never embeds images/HTML in MVP (uploads go through Cloudinary in P5/P12).
  img: () => null,
};

/**
 * Admin-edited catalog markdown (intro / description). react-markdown does not render raw HTML
 * by default, so stored content can't inject markup (CLAUDE.md: no raw HTML from users).
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="flex flex-col gap-3 text-foreground/90">
      <ReactMarkdown components={components} skipHtml>
        {children}
      </ReactMarkdown>
    </div>
  );
}
