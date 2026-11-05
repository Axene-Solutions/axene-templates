import type { Handle } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";
import { verifyAccessToken } from "$lib/server/auth/jwt";
import { db } from "$lib/server/db";
import { users, templates } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { starterTemplates } from "$lib/defaults";
import { safeNext } from "$lib/safe-next";

// Seed starter templates on first request (idempotent)
let seeded = false;
async function seedStarters() {
  if (seeded) return;
  seeded = true;
  try {
    // Upsert on every boot: inserts missing starters and re-asserts the canonical
    // category on existing starter rows (only starters, never user templates).
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
        .onConflictDoUpdate({
          target: templates.id,
          set: { category: starter.category || "general" },
          setWhere: eq(templates.isStarter, true),
        });
    }
    console.log(`Synced ${starterTemplates.length} starter templates`);
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
      try {
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
      } catch (e) {
        // A database failure must not take every page down: treat as signed out.
        console.error("User lookup failed:", e);
      }
    }
  }

  const path = event.url.pathname;

	if ((path.startsWith("/editor") || path.startsWith("/settings")) && !event.locals.user) {
		// Keep the target so sign in returns here (for example a Mailer deep link). Only a safe relative path is kept.
		const next = safeNext(path + event.url.search);
		throw redirect(302, next ? `/login?next=${encodeURIComponent(next)}` : "/login");
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
