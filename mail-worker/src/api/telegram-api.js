import app from '../hono/hono';
import telegramService from '../service/telegram-service';
import result from '../model/result';

app.get('/telegram/getEmail/:token', async (c) => {
	const content = await telegramService.getEmailContent(c, c.req.param());
	c.header('Cache-Control', 'public, max-age=604800, immutable');
	return c.html(content)
});

app.post('/telegram/translate', async (c) => {
	try {
		const { text, targetLang } = await c.req.json();

		if (!text || !targetLang) {
			return c.json(result.fail('缺少必要参数'));
		}

		const translatedText = await telegramService.translateText(c, text, targetLang);

		return c.json(result.ok({ translatedText }));
	} catch (error) {
		console.error('翻译API错误:', error);
		return c.json(result.fail(error.message || '翻译失败'));
	}
});

