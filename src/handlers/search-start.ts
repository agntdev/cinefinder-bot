import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { movieApiReady, movieList, searchMovies } from "../movie-api.js";
import { notifyOwner } from "../user.js";

registerMainMenuItem({ label: "🔎 Search", data: "search:start", order: 30 });
const composer = new Composer<Ctx>();

composer.callbackQuery("search:start", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "awaiting_search";
  await ctx.reply("Tell me a movie title or actor to look for.", {
    reply_markup: { force_reply: true, input_field_placeholder: "Type a title or actor" },
  });
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "awaiting_search") return next();
  const query = ctx.message.text.trim();
  if (query.length < 2 || query.length > 100) {
    await ctx.reply("Use at least two letters so I can find the right movie or actor.");
    return;
  }
  ctx.session.step = undefined;
  if (!movieApiReady()) {
    await ctx.reply("Search isn't set up yet. Ask the owner to add the movie data API key.");
    return;
  }
  try {
    const movies = await searchMovies(query);
    await notifyOwner(ctx, "A user searched for movies.");
    if (!movies.length) {
      await ctx.reply("I couldn't find a movie with that name. Check the spelling and try again.");
      return;
    }
    await ctx.reply(movieList(movies, `Results for “${query}”`), {
      reply_markup: inlineKeyboard([...movies.slice(0, 5).map((movie) => [inlineButton(movie.title.slice(0, 24), `movie:${movie.id}`)]), [inlineButton("Search again", "search:start")], [inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
  } catch {
    await ctx.reply("I couldn't search movies just now. Try again in a moment.");
  }
});

export default composer;
