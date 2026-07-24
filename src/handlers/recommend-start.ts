import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { movieApiReady, movieList, recommendations } from "../movie-api.js";
import { notifyOwner, user } from "../user.js";

registerMainMenuItem({ label: "✨ Pick a mood", data: "recommend:start", order: 40 });
const composer = new Composer<Ctx>();

const choices = ["Action", "Comedy", "Drama", "Romance", "Horror", "Sci-Fi"];

async function recommend(ctx: Ctx, choice: string) {
  const profile = user(ctx);
  if (profile && !profile.favoriteMoods.includes(choice)) profile.favoriteMoods.push(choice);
  if (!movieApiReady()) {
    await ctx.reply("Recommendations aren't set up yet. Ask the owner to add the movie data API key.");
    return;
  }
  try {
    const movies = await recommendations(choice);
    await notifyOwner(ctx, "A user asked for movie recommendations.");
    await ctx.reply(movieList(movies, `Movies for a ${choice.toLowerCase()} mood`, `Picked for their popular ${choice.toLowerCase()} feel.`), {
      reply_markup: inlineKeyboard([...movies.slice(0, 5).map((movie) => [inlineButton(movie.title.slice(0, 24), `movie:${movie.id}`)]), [inlineButton("Pick another mood", "recommend:start")], [inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
  } catch {
    await ctx.reply("I couldn't find recommendations just now. Try another mood in a moment.");
  }
}

composer.callbackQuery("recommend:start", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply("Pick the kind of movie you're in the mood for.", {
    reply_markup: inlineKeyboard([
      [inlineButton("Action", "recommend:Action"), inlineButton("Comedy", "recommend:Comedy")],
      [inlineButton("Drama", "recommend:Drama"), inlineButton("Romance", "recommend:Romance")],
      [inlineButton("Horror", "recommend:Horror"), inlineButton("Sci-Fi", "recommend:Sci-Fi")],
      [inlineButton("Type your own", "recommend:custom")],
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

composer.callbackQuery(/^recommend:(Action|Comedy|Drama|Romance|Horror|Sci-Fi)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  await recommend(ctx, ctx.callbackQuery.data.slice("recommend:".length));
});

composer.callbackQuery("recommend:custom", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "awaiting_recommendation";
  await ctx.reply("Tell me a mood or genre, like mystery or family.", {
    reply_markup: { force_reply: true, input_field_placeholder: "Type a mood or genre" },
  });
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "awaiting_recommendation") return next();
  const choice = ctx.message.text.trim();
  if (!/^[\p{L}\p{N}][\p{L}\p{N} -]{1,39}$/u.test(choice)) {
    await ctx.reply("Use a short mood or genre made of letters and numbers, then try again.");
    return;
  }
  ctx.session.step = undefined;
  await recommend(ctx, choice);
});

export default composer;
