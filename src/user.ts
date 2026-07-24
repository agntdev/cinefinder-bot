import type { Ctx } from "./bot.js";

export function user(ctx: Ctx) {
  if (!ctx.from) return undefined;
  return (ctx.session.user ??= {
    telegramId: ctx.from.id,
    favoriteGenres: [],
    favoriteMoods: [],
    trendingAlerts: false,
  });
}

export function regionFromPlace(value: string): string {
  const code = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : "US";
}

export async function notifyOwner(ctx: Ctx, message: string): Promise<boolean> {
  const owner = typeof process === "undefined" ? undefined : process.env.ADMIN_CHAT_ID;
  if (!owner || !/^[-]?\d+$/.test(owner)) return false;
  try {
    await ctx.api.sendMessage(owner, message);
    return true;
  } catch {
    return false;
  }
}
