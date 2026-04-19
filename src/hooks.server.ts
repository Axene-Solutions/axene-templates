import type { Handle } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";
import { verifyAccessToken } from "$lib/server/auth/jwt";
import { db } from "$lib/server/db";
import { users, templates } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { starterTemplates } from "$lib/defaults";

// Seed starter templates on first request (idempotent)
let seeded = false;
async function seedStarters() {
  if (seeded) return;
  seeded = true;
  try {
    const existing = await db
      .select({ id: templates.id })
      .from(templates)
      .where(eq(templates.isStarter, true))
      .limit(1);
    if (existing.length > 0) return; // already seeded

    for (const starter of starterTemplates) {
      await db
        .insert(templates)
        .values({
          id: starter.id,
          name: starter.name,
          category: starter.category || "general", 

          blocks: starter.blocks,
          isStarter: true,
          isPublic: true,
          userId: null,
        })
        .onConflictDoNothing();
    }
    console.log(`Seeded ${starterTemplates.length} starter templates`);
  } catch (e) {
    seeded = false; // retry on next request if DB isn't ready yet
    console.error("Failed to seed starters:", e);
  }
}

export const handle: Handle = async ({ event, resolve }) => {
  await seedStarters();
  const token = event.cookies.get("access_token");
  event.locals.user = null;

  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.sub))
        .limit(1);
      if (user && user.isActive) {
        event.locals.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
        };
      }
    }
  }

  const path = event.url.pathname;

	if (path.startsWith("/editor") && !event.locals.user) {
		throw redirect(302, "/login");
	}

  if (path.startsWith("/api/templates") && !event.locals.user) {
    const method = event.request.method;
    if (method === "POST" || method === "DELETE" || method === "PATCH") {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  return resolve(event);
};
