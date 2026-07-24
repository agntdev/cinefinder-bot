import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { movieApiReady, movieDetails } from "../movie-api.js";

const composer = new Composer<Ctx>();

composer.callbackQuery(/^movie:\d+$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!movieApiReady()) {
    await ctx.reply("Movie details aren't set up yet. Ask the owner to add the movie data API key.");
    return;
  }
  try {
    const movie = await movieDetails(Number(ctx.callbackQuery.data.slice("movie:".length)));
    const facts = [movie.releaseDate, movie.runtime ? `${movie.runtime} min` : "", movie.rating ? `${movie.rating.toFixed(1)}/10` : ""].filter(Boolean).join(" · ");
    const cast = movie.cast.length ? `\nCast: ${movie.cast.join(", ")}` : "";
    await ctx.reply(`${movie.title}\n${facts}\n\n${movie.overview.slice(0, 3_500)}${cast}`, {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
  } catch {
    await ctx.reply("I couldn't load that movie's details just now. Try again in a moment.");
  }
});

export default composer;
