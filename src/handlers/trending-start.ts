import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { movieApiReady, movieList, trending } from "../movie-api.js";
import { notifyOwner } from "../user.js";

registerMainMenuItem({ label: "🔥 Trending", data: "trending:start", order: 20 });
const composer = new Composer<Ctx>();

async function showPage(ctx: Ctx, page: number) {
  if (!movieApiReady()) {
    await ctx.reply("Trending movies aren't set up yet. Ask the owner to add the movie data API key.");
    return;
  }
  try {
    const result = await trending(page + 1);
    if (!result.movies.length) {
      await ctx.reply("No trending movies are available right now — check back soon.");
      return;
    }
    const rows = [];
    if (page > 0) rows.push(inlineButton("‹ Previous", `trending:page:${page - 1}`));
    if (page + 1 < result.pages) rows.push(inlineButton("Next ›", `trending:page:${page + 1}`));
    await ctx.reply(movieList(result.movies, `Trending movies · page ${page + 1}`), {
      reply_markup: inlineKeyboard([...result.movies.slice(0, 5).map((movie) => [inlineButton(movie.title.slice(0, 24), `movie:${movie.id}`)]), ...[rows].filter((row) => row.length > 0), [inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
  } catch {
    await ctx.reply("I couldn't load trending movies just now. Try again in a moment.");
  }
}

composer.callbackQuery("trending:start", async (ctx) => {
  await ctx.answerCallbackQuery();
  await notifyOwner(ctx, "A user opened trending movies.");
  await showPage(ctx, 0);
});

composer.callbackQuery(/^trending:page:\d+$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await showPage(ctx, Number(ctx.callbackQuery.data.split(":")[2]));
});

export default composer;
