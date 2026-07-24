import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { movieApiReady, movieList, nowPlaying } from "../movie-api.js";
import { regionFromPlace, user } from "../user.js";

registerMainMenuItem({ label: "🎬 Now playing", data: "now_playing:start", order: 10 });
const composer = new Composer<Ctx>();
const locationKeyboard = {
  keyboard: [[{ text: "Share location", request_location: true }]],
  resize_keyboard: true,
  one_time_keyboard: true,
  input_field_placeholder: "Type a city, ZIP, or two-letter country code",
};

async function showListings(ctx: Ctx, place: string) {
  const profile = user(ctx);
  if (profile) profile.location = place;
  if (!movieApiReady()) {
    await ctx.reply("Movie listings aren't set up yet. Ask the owner to add the movie data API key.");
    return;
  }
  try {
    const movies = await nowPlaying(regionFromPlace(place));
    if (!movies.length) {
      await ctx.reply("No movies are listed there right now — try a nearby city or country code.");
      return;
    }
    await ctx.reply(movieList(movies, `Now playing near ${place}`) + "\n\nShowtimes vary by cinema, so check your local theater before you go.", {
      reply_markup: inlineKeyboard([...movies.slice(0, 5).map((movie) => [inlineButton(movie.title.slice(0, 24), `movie:${movie.id}`)]), [inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
  } catch {
    await ctx.reply("I couldn't load nearby movies just now. Try again in a moment.");
  }
}

composer.callbackQuery("now_playing:start", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "awaiting_city";
  await ctx.reply("Share your location to find movies nearby, or type a city, ZIP, or two-letter country code.", { reply_markup: locationKeyboard });
});

composer.on("message:location", async (ctx) => {
  if (ctx.session.step !== "awaiting_city") return;
  ctx.session.step = undefined;
  await showListings(ctx, "your area");
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "awaiting_city") return next();
  const place = ctx.message.text.trim();
  if (place.length < 2 || place.length > 80) {
    await ctx.reply("That doesn't look like a city or ZIP. Try again with a nearby place.");
    return;
  }
  ctx.session.step = undefined;
  await showListings(ctx, place);
});

export default composer;
