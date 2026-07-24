import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { user } from "../user.js";

registerMainMenuItem({ label: "⚙️ Preferences", data: "preferences:start", order: 50 });
const composer = new Composer<Ctx>();

function text(ctx: Ctx): string {
  const profile = user(ctx);
  if (!profile) return "Your preferences are ready when you are.";
  const genres = profile.favoriteGenres.length ? profile.favoriteGenres.join(", ") : "none yet";
  const moods = profile.favoriteMoods.length ? profile.favoriteMoods.join(", ") : "none yet";
  return `Your movie preferences\n\nFavorite genres: ${genres}\nFavorite moods: ${moods}\nTrending alerts: ${profile.trendingAlerts ? "on" : "off"}`;
}

function keyboard(ctx: Ctx) {
  const profile = user(ctx);
  return inlineKeyboard([
    [inlineButton("Add a genre", "preferences:genre")],
    [inlineButton(profile?.trendingAlerts ? "Turn off alerts" : "Turn on alerts", "preferences:alerts")],
    [inlineButton("⬅️ Back to menu", "menu:main")],
  ]);
}

composer.callbackQuery("preferences:start", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(text(ctx), { reply_markup: keyboard(ctx) });
});

composer.callbackQuery("preferences:genre", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "awaiting_genre";
  await ctx.reply("Type a favorite genre to save it.", {
    reply_markup: { force_reply: true, input_field_placeholder: "Type a genre" },
  });
});

composer.callbackQuery("preferences:alerts", async (ctx) => {
  await ctx.answerCallbackQuery();
  const profile = user(ctx);
  if (profile) profile.trendingAlerts = !profile.trendingAlerts;
  await ctx.reply(profile?.trendingAlerts ? "Trending alerts are on. I'll only send them when the owner has enabled a release alert." : "Trending alerts are off.", { reply_markup: keyboard(ctx) });
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "awaiting_genre") return next();
  const genre = ctx.message.text.trim();
  if (!/^[\p{L}\p{N}][\p{L}\p{N} -]{1,39}$/u.test(genre)) {
    await ctx.reply("Use a short genre made of letters and numbers, then try again.");
    return;
  }
  ctx.session.step = undefined;
  const profile = user(ctx);
  if (profile && !profile.favoriteGenres.some((value) => value.toLowerCase() === genre.toLowerCase())) profile.favoriteGenres.push(genre);
  await ctx.reply(`Saved ${genre} to your favorite genres.`, { reply_markup: keyboard(ctx) });
});

export default composer;
