import { json } from "@sveltejs/kit";
import { escapeDeep } from "$lib/server/mailer/validate";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { templates } from "$lib/server/db/schema";
import { eq, and } from "drizzle-orm";
import { renderTemplateHtml } from "$lib/server/render-starter";
import { readJson } from "$lib/server/mailer/http";
import { compiledHtmlProblem, unsafeUrlInHtml } from "$lib/server/sanitize-blocks";

export const POST: RequestHandler = async (event) => {
  const { url } = event;
  const categoryQuery = url.searchParams.get("category") || "otp";
  const versionQuery = url.searchParams.get("version") || "v1";

  // A body that is not a JSON object, or data that is not an object, is the caller's mistake: 400.
  const body = await readJson(event);
  if (!body) return json({ error: "Invalid JSON body" }, { status: 400 });
  const dynamicData = body.data ?? {};
  if (typeof dynamicData !== "object" || dynamicData === null || Array.isArray(dynamicData)) {
    return json({ error: "data must be an object" }, { status: 400 });
  }

  try {
    const [templateRecord] = await db
      .select()
      .from(templates)
      .where(
        and(
          eq(templates.category, categoryQuery),
          eq(templates.version, versionQuery),
          // Only the seeded starters. A user-published template with the same category and version
          // must never be able to take over the email other services render through this endpoint.
          eq(templates.isStarter, true),
        ),
      )
      .limit(1);

    if (!templateRecord) {
      return json({ error: "Template not found" }, { status: 404 });
    }

    // The injector runs Handlebars with noEscape (MJML needs raw strings), so values from the
    // caller must be HTML-escaped here, including inside arrays and objects used by {{#each}}.
    const result = renderTemplateHtml(templateRecord.blocks, escapeDeep(dynamicData) as Record<string, any>);

    // Caller values land in links (verify_url and friends) unchecked by the block sanitiser, so the
    // compiled result gets the same checks as Send: the tripwire and the URL scheme policy.
    const problem = compiledHtmlProblem(result.html) ?? (unsafeUrlInHtml(result.html) ? "it contains a URL with a scheme that is not allowed" : null);
    if (problem) {
      return json({ error: `The email was not compiled because ${problem}. Links must be http, https, mailto or tel.`, code: "unsafe_html" }, { status: 422 });
    }

    const subject = (dynamicData as Record<string, unknown>).subject;
    return json({
      html: result.html,
      errors: result.errors,
      subject: typeof subject === "string" && subject ? subject : "Notification",
    });
  } catch (err: any) {
    console.error("starter compile failed:", err?.message ?? "unknown");
    return json(
      { error: "Template compilation failed" },
      { status: 500 },
    );
  }
};
