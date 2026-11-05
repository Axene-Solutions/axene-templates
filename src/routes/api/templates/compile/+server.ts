import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { templates } from "$lib/server/db/schema";
import { eq, and } from "drizzle-orm";
import { renderTemplateHtml } from "$lib/server/render";

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

    const result = renderTemplateHtml(templateRecord.blocks, dynamicData || {});

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
