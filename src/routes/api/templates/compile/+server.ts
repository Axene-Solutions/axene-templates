import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { templates } from "$lib/server/db/schema";
import { eq, and } from "drizzle-orm";
import { injectVariables } from "$lib/server/injector";
import { blocksToMjml } from "$lib/mjml"; // <-- Import your builder
import mjml2html from "mjml";

export const POST: RequestHandler = async ({ request, url }) => {
  const categoryQuery = url.searchParams.get("category") || "otp";
  const versionQuery = url.searchParams.get("version") || "v1";

  const { data: dynamicData } = await request.json();

  try {
    const [templateRecord] = await db
      .select()
      .from(templates)
      .where(
        and(
          eq(templates.category, categoryQuery),
          eq(templates.version, versionQuery),
          eq(templates.isPublic, true),
        ),
      )
      .limit(1);

    if (!templateRecord) {
      return json({ error: "Template not found" }, { status: 404 });
    }

    // 1. Convert the JSON block definition into base MJML using your utility
    // We cast to `any` or `Block[]` depending on your schema type definitions
    const rawMjml = blocksToMjml(templateRecord.blocks as any);

    // 2. Pass the base MJML to Handlebars to evaluate `{{otp}}` or `{{#each items}}`
    const injectedMjml = injectVariables(rawMjml, dynamicData || {});

    // 3. Compile the fully hydrated MJML into HTML
    const result = mjml2html(injectedMjml, {
      keepComments: false,
      minify: true,
      validationLevel: "soft",
    });

    return json({
      html: result.html,
      errors: result.errors,
      subject: dynamicData?.subject || "Notification",
    });
  } catch (err: any) {
    return json(
      { error: err.message || "Template compilation failed" },
      { status: 500 },
    );
  }
};
