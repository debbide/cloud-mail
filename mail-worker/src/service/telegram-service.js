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
		// 如果文本看起来是 HTML，只翻译纯文本部分
		const isHTML = /<[^>]+>/.test(text);

		if (isHTML) {
			// 保留 HTML 结构，只翻译文本节点
			return await this._translateHTML(c, text, targetLang);
		}

		// 纯文本直接翻译
		return await this._translatePlainText(c, text, targetLang);
	},

	async _translateHTML(c, html, targetLang) {
		// 简单的 HTML 文本节点翻译
		// 提取所有文本节点
		const textNodes = [];
		const placeholders = [];

		console.log('[翻译] 开始处理HTML，长度:', html.length);

		// 用占位符替换文本节点
		let processedHtml = html.replace(/>([^<]+)</g, (match, text) => {
			const trimmed = text.trim();
			if (trimmed && trimmed.length > 0) {
				const placeholder = `__TEXT_${textNodes.length}__`;
				textNodes.push(trimmed);
				placeholders.push(placeholder);
				return `>${placeholder}<`;
			}
			return match;
		});

		console.log('[翻译] 提取了', textNodes.length, '个文本节点');

		// 逐个翻译文本节点（避免分隔符问题）
		if (textNodes.length > 0) {
			const translatedNodes = [];

			for (let i = 0; i < textNodes.length; i++) {
				console.log(`[翻译] 正在翻译第 ${i + 1}/${textNodes.length} 个节点`);
				try {
					const translated = await this._translatePlainText(c, textNodes[i], targetLang);
					translatedNodes.push(translated);
				} catch (error) {
					console.error(`[翻译] 第 ${i + 1} 个节点翻译失败:`, error.message);
					// 如果翻译失败，使用原文
					translatedNodes.push(textNodes[i]);
				}
			}

			// 替换回去
			placeholders.forEach((placeholder, index) => {
				const translatedText = translatedNodes[index] || textNodes[index];
				processedHtml = processedHtml.replace(placeholder, translatedText);
			});
		} else {
			console.log('[翻译] 警告: 没有提取到任何文本节点');
		}

		return processedHtml;
	},

	async _translatePlainText(c, text, targetLang) {
		// 获取翻译配置
		const { translateProvider, translateApiKey, translateEnabled } = await settingService.query(c);

		console.log('[翻译] _translatePlainText 被调用, targetLang:', targetLang);
		console.log('[翻译] 翻译配置 - provider:', translateProvider, ', enabled:', translateEnabled);

		// 如果翻译功能未启用，返回原文
		if (!translateEnabled) {
			console.log('[翻译] 翻译功能已禁用');
			return text;
		}

		// 检测源语言
		const sourceLang = this._detectLanguage(text);
		console.log('[翻译] 检测到源语言:', sourceLang);

		// 如果源语言和目标语言相同，跳过翻译
		if (sourceLang === targetLang) {
			console.log('[翻译] 源语言和目标语言相同，跳过翻译');
			return text;
		}

		// 尝试从缓存获取
		const cacheKey = this._generateCacheKey(text, targetLang);
		if (c.env.kv) {
			try {
				const cached = await c.env.kv.get(cacheKey);
				if (cached) {
					console.log('[翻译] 使用缓存结果');
					return cached;
				}
			} catch (e) {
				console.warn('[翻译] 缓存读取失败:', e.message);
			}
		}

		// 执行翻译
		let result;
		switch (translateProvider) {
			case 'cloudflare':
				result = await this._translateWithCloudflare(c, text, targetLang);
				break;

			case 'deepl':
				if (!translateApiKey) {
					console.warn('[翻译] DeepL API 密钥未配置，降级到 Cloudflare');
					result = await this._translateWithCloudflare(c, text, targetLang);
				} else {
					result = await this._translateWithDeepL(translateApiKey, text, targetLang);
				}
				break;

			case 'google':
				if (!translateApiKey) {
					console.warn('[翻译] Google API 密钥未配置，降级到 Cloudflare');
					result = await this._translateWithCloudflare(c, text, targetLang);
				} else {
					result = await this._translateWithGoogle(translateApiKey, text, targetLang);
				}
				break;

			case 'libre':
				result = await this._translateWithLibre(text, targetLang);
				break;

			default:
				console.log('[翻译] 未知的翻译服务提供商，使用 Cloudflare');
				result = await this._translateWithCloudflare(c, text, targetLang);
		}

		// 保存到缓存（24小时过期）
		if (c.env.kv && result && result !== text) {
			try {
				await c.env.kv.put(cacheKey, result, { expirationTtl: 86400 });
				console.log('[翻译] 结果已缓存');
			} catch (e) {
				console.warn('[翻译] 缓存写入失败:', e.message);
			}
		}

		return result;
	},

	_detectLanguage(text) {
		// 简单的启发式语言检测
		// 基于字符模式匹配主要语言
		const sample = text.substring(0, 200);

		const patterns = {
			zh: /[\u4e00-\u9fa5]/,  // 中文字符
			ja: /[\u3040-\u309f\u30a0-\u30ff]/,  // 日文假名
			ko: /[\uac00-\ud7af]/,  // 韩文字符
			ru: /[\u0400-\u04ff]/   // 俄文字符
		};

		// 统计各语言特征字符数量
		for (const [lang, pattern] of Object.entries(patterns)) {
			const matches = sample.match(new RegExp(pattern, 'g'));
			if (matches && matches.length > 5) {  // 至少5个特征字符
				return lang;
			}
		}

		// 默认假设为英语
		return 'en';
	},

	_generateCacheKey(text, targetLang) {
		// 生成缓存键：translate:hash:targetLang
		const hash = this._hashText(text);
		return `translate:${hash}:${targetLang}`;
	},

	_hashText(text) {
		// 简单哈希函数（用于缓存键）
		let hash = 0;
		const maxLen = Math.min(text.length, 200);
		for (let i = 0; i < maxLen; i++) {
			hash = ((hash << 5) - hash) + text.charCodeAt(i);
			hash = hash & hash;
		}
		return Math.abs(hash).toString(36);
	},

	async _translateWithCloudflare(c, text, targetLang) {
		console.log('[翻译] 使用 Cloudflare AI 翻译，目标语言:', targetLang);
		console.log('[翻译] 是否有 AI 绑定:', !!c.env.AI);

		if (!c.env.AI) {
			console.warn('[翻译] 没有 AI 绑定，降级到备用翻译');
			return await this._translateWithLibre(text, targetLang);
		}

		try {
			// Cloudflare AI m2m100 模型语言代码映射
			const langMap = {
				'zh': 'chinese',
				'en': 'english',
				'ja': 'japanese',
				'ko': 'korean',
				'es': 'spanish',
				'fr': 'french',
				'de': 'german',
				'ru': 'russian'
			};

			const targetLanguage = langMap[targetLang] || 'chinese';

			console.log('[翻译] 输入文本长度:', text.length);
			console.log('[翻译] 目标语言映射:', targetLang, '->', targetLanguage);

			const response = await c.env.AI.run('@cf/meta/m2m100-1.2b', {
				text: text,
				source_lang: 'english',  // m2m100-1.2b 模型默认源语言
				target_lang: targetLanguage
			});

			console.log('[翻译] CF AI 响应类型:', typeof response);

			if (response && response.translated_text) {
				console.log('[翻译] 翻译成功，译文长度:', response.translated_text.length);
				return response.translated_text;
			} else {
				console.error('[翻译] AI 返回的响应中没有 translated_text 字段');
				throw new Error('AI 响应格式不正确');
			}
		} catch (error) {
			console.error('[翻译] Cloudflare AI 翻译失败:', error.message);
			console.log('[翻译] 自动降级到备用翻译服务');
			// 自动降级到备用翻译
			return await this._translateWithLibre(text, targetLang);
		}
	},

	async _translateWithDeepL(apiKey, text, targetLang) {
		try {
			console.log('[翻译] 使用 DeepL API 翻译');

			// DeepL 语言代码转换
			const deeplLangMap = {
				'zh': 'ZH',
				'en': 'EN',
				'ja': 'JA',
				'ko': 'KO',
				'es': 'ES',
				'fr': 'FR',
				'de': 'DE',
				'ru': 'RU'
			};

			const targetLanguage = deeplLangMap[targetLang] || 'ZH';

			const response = await fetch('https://api-free.deepl.com/v2/translate', {
				method: 'POST',
				headers: {
					'Authorization': `DeepL-Auth-Key ${apiKey}`,
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: new URLSearchParams({
					'text': text,
					'target_lang': targetLanguage
				})
			});

			if (!response.ok) {
				throw new Error(`DeepL API 响应错误: ${response.status}`);
			}

			const data = await response.json();

			if (data.translations && data.translations.length > 0) {
				console.log('[翻译] DeepL 翻译成功');
				return data.translations[0].text;
			}

			throw new Error('DeepL API 返回数据格式不正确');
		} catch (error) {
			console.error('[翻译] DeepL 翻译失败:', error.message);
			throw error;
		}
	},

	async _translateWithGoogle(apiKey, text, targetLang) {
		try {
			console.log('[翻译] 使用 Google Translate API 翻译');

			const response = await fetch(
				`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						q: text,
						target: targetLang
					})
				}
			);

			if (!response.ok) {
				throw new Error(`Google API 响应错误: ${response.status}`);
			}

			const data = await response.json();

			if (data.data && data.data.translations && data.data.translations.length > 0) {
				console.log('[翻译] Google 翻译成功');
				return data.data.translations[0].translatedText;
			}

			throw new Error('Google API 返回数据格式不正确');
		} catch (error) {
			console.error('[翻译] Google 翻译失败:', error.message);
			throw error;
		}
	},

	async _translateWithLibre(text, targetLang) {
		// 备用翻译方案 - 使用免费的 MyMemory API
		try {
			console.log('[翻译] 使用 LibreTranslate/MyMemory API 翻译');
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
			console.error('[翻译] 备用翻译失败:', error);
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
