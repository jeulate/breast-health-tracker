import { Bot } from "grammy";
import {
  TELEGRAM_MESSAGES,
  telegramLinkFailureMessage,
} from "@/features/telegram/telegram-messages";
import { TelegramLinkService } from "@/services/telegram-link.service";

export function createTelegramBot(token: string, links = new TelegramLinkService()): Bot {
  const bot = new Bot(token);

  bot.command("start", async (context) => {
    const linkToken = context.match.trim();
    if (!linkToken || !context.from) {
      await context.reply(TELEGRAM_MESSAGES.welcome);
      return;
    }

    try {
      const result = await links.consume(linkToken, {
        telegramUserId: String(context.from.id),
        telegramChatId: String(context.chat.id),
      });
      await context.reply(
        result.success ? TELEGRAM_MESSAGES.linked : telegramLinkFailureMessage(result.reason),
      );
    } catch {
      await context.reply(TELEGRAM_MESSAGES.invalidCommand);
    }
  });

  bot.command("help", async (context) => context.reply(TELEGRAM_MESSAGES.welcome));
  return bot;
}
