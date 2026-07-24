import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { now } from "../clock.js";
import { notifyOwner } from "../user.js";

const composer = new Composer<Ctx>();

composer.callbackQuery("notification:trigger", async (ctx) => {
  await ctx.answerCallbackQuery();
  const sent = await notifyOwner(ctx, `Movie Explorer activity alert at ${now().toISOString()}.`);
  await ctx.reply(sent ? "The owner has been notified." : "Owner notifications aren't set up yet.");
});

export default composer;
