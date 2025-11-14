import orm from '../entity/orm';
import email from '../entity/email';
import settingService from './setting-service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);
import { eq } from 'drizzle-orm';
import jwtUtils from '../utils/jwt-utils';
import emailMsgTemplate from '../template/email-msg';
import emailTextTemplate from '../template/email-text';
import emailHtmlTemplate from '../template/email-html';
import verifyUtils from '../utils/verify-utils';
import domainUtils from "../utils/domain-uitls";

const telegramService = {

	async getEmailContent(c, params) {

		const { token } = params

		const result = await jwtUtils.verifyToken(c, token);

		if (!result) {
			return emailTextTemplate('Access denied')
		}

		const emailRow = await orm(c).select().from(email).where(eq(email.emailId, result.emailId)).get();

		if (emailRow) {

			if (emailRow.content) {
				const { r2Domain } = await settingService.query(c);
				return emailHtmlTemplate(emailRow.content || '', r2Domain)
			} else {
				return emailTextTemplate(emailRow.text || '')
			}

		} else {
			return emailTextTemplate('The email does not exist')
		}

	},

	async translateText(c, text, targetLang) {
		try {
			// 如果文本过长，分段翻译
			const maxLength = 3000;
			if (text.length > maxLength) {
				const chunks = [];
				for (let i = 0; i < text.length; i += maxLength) {
					chunks.push(text.substring(i, i + maxLength));
				}

				const translatedChunks = await Promise.all(
					chunks.map(chunk => this._translateChunk(c, chunk, targetLang))
				);

				return translatedChunks.join('');
			}

			return await this._translateChunk(c, text, targetLang);
		} catch (error) {
			console.error('翻译服务错误:', error);
			throw new Error('翻译失败: ' + error.message);
		}
	},

	async _translateChunk(c, text, targetLang) {
		// 使用 Cloudflare AI Workers 进行翻译
		// 如果环境中没有绑定 AI，则使用免费的翻译 API
		if (c.env.AI) {
			try {
				const response = await c.env.AI.run('@cf/meta/m2m100-1.2b', {
					text: text,
					source_lang: 'auto',
					target_lang: targetLang
				});

				return response.translated_text || text;
			} catch (error) {
				console.error('Cloudflare AI 翻译失败:', error);
			}
		}

		// 备用方案：使用 LibreTranslate API (需要部署或使用公共实例)
		// 或者使用其他免费翻译服务
		return await this._fallbackTranslate(text, targetLang);
	},

	async _fallbackTranslate(text, targetLang) {
		// 备用翻译方案 - 使用免费的 MyMemory API
		try {
			const encodedText = encodeURIComponent(text);
			const langPair = `auto|${targetLang}`;
			const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=${langPair}`;

			const response = await fetch(url, {
				headers: {
					'User-Agent': 'CloudMail/1.0'
				}
			});

			if (!response.ok) {
				throw new Error('翻译服务响应失败');
			}

			const data = await response.json();

			if (data.responseStatus === 200 && data.responseData) {
				return data.responseData.translatedText;
			}

			throw new Error('翻译服务返回错误');
		} catch (error) {
			console.error('备用翻译失败:', error);
			// 如果所有翻译方案都失败，返回原文
			return text;
		}
	},

	async sendEmailToBot(c, email) {

		const { tgBotToken, tgChatId, customDomain, tgMsgTo, tgMsgFrom, tgMsgText } = await settingService.query(c);

		const tgChatIds = tgChatId.split(',');

		const jwtToken = await jwtUtils.generateToken(c, { emailId: email.emailId })

		const webAppUrl = customDomain ? `${domainUtils.toOssDomain(customDomain)}/api/telegram/getEmail/${jwtToken}` : 'https://www.cloudflare.com/404'

		await Promise.all(tgChatIds.map(async chatId => {
			try {
				const res = await fetch(`https://api.telegram.org/bot${tgBotToken}/sendMessage`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						chat_id: chatId,
						parse_mode: 'HTML',
						text: emailMsgTemplate(email, tgMsgTo, tgMsgFrom, tgMsgText),
						reply_markup: {
							inline_keyboard: [
								[
									{
										text: '查看',
										web_app: { url: webAppUrl }
									}
								]
							]
						}
					})
				});
				if (!res.ok) {
					console.error(`转发 Telegram 失败: chatId=${chatId}, 状态码=${res.status}`);
				}
			} catch (e) {
				console.error(`转发 Telegram 失败: chatId=${chatId}`, e.message);
			}
		}));

	}

}

export default telegramService
