import { normalizeAsset } from "@/lib/question-asset";

/** Renders the table or figure attached to a question, above its options. */
export function QuestionAsset({ asset }: { asset: unknown }) {
  const data = normalizeAsset(asset);
  if (!data) return null;

  if (data.kind === "table") {
    return (
      <figure className="overflow-x-auto rounded-xl border border-border bg-secondary/40 p-3">
        <table className="w-full border-collapse text-sm">
          {data.headers.some((h) => h.trim()) ? (
            <thead>
              <tr>
                {data.headers.map((header, i) => (
                  <th
                    key={i}
                    className="border border-border bg-primary/10 px-3 py-2 text-center font-semibold text-foreground"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
          ) : null}
          <tbody>
            {data.rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((value, ci) => (
                  <td
                    key={ci}
                    className="border border-border px-3 py-2 text-center text-foreground"
                  >
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.caption ? (
          <figcaption className="mt-2 text-center text-xs text-muted-foreground">
            {data.caption}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  return (
    <figure className="rounded-xl border border-border bg-card p-3">
      <div
        className="mx-auto max-w-md [&_svg]:h-auto [&_svg]:w-full"
        // Sanitized server-side and again here by normalizeAsset (no scripts, no remote refs).
        dangerouslySetInnerHTML={{ __html: data.svg }}
      />
      {data.caption ? (
        <figcaption className="mt-2 text-center text-xs text-muted-foreground">
          {data.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
