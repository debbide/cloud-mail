# Telegram 邮件翻译功能说明

## 功能概述

为 Telegram 推送的邮件内嵌页面添加了实时翻译功能，支持多语言互译。用户可以在查看邮件时直接翻译邮件内容。

## 功能特性

✅ **多语言支持**：支持中文、英文、日语、韩语、西班牙语、法语、德语、俄语等 8 种语言
✅ **一键翻译**：点击翻译按钮即可翻译邮件内容
✅ **还原功能**：支持还原到原始邮件内容
✅ **自动分段**：长文本自动分段翻译，提高成功率
✅ **双层翻译引擎**：优先使用 Cloudflare AI，备用 MyMemory API
✅ **响应式设计**：底部固定翻译栏，不影响邮件阅读

## 使用方法

### 1. 用户端使用

当用户在 Telegram 中收到邮件推送时：

1. 点击 Telegram 消息中的「查看」按钮，打开邮件内容页面
2. 在页面底部会看到翻译工具栏（紫色渐变背景）
3. 在下拉菜单中选择目标语言
4. 点击「翻译 Translate」按钮
5. 等待几秒，邮件内容将被翻译成目标语言
6. 如需查看原文，点击「还原 Reset」按钮

### 2. 管理员配置（可选）

#### 方案 A：使用 Cloudflare AI（推荐）

Cloudflare AI Workers 提供免费的翻译服务，质量较好且无需额外配置。

**步骤：**

1. 在 `wrangler.toml` 中添加 AI 绑定：

```toml
[ai]
binding = "AI"
```

2. 重新部署 Worker：

```bash
cd mail-worker
wrangler deploy
```

完成！系统会自动使用 Cloudflare AI 进行翻译。

#### 方案 B：使用备用翻译服务（默认）

如果未配置 Cloudflare AI，系统会自动使用 MyMemory 免费翻译 API 作为备用方案。无需额外配置即可使用。

**特点：**
- 完全免费
- 无需注册
- 每日限制：1000 字符/IP
- 翻译质量一般

## 技术实现

### 架构设计

```
前端 (邮件页面)
    ↓ POST /api/telegram/translate
后端翻译服务
    ↓
优先：Cloudflare AI (@cf/meta/m2m100-1.2b)
    ↓ (失败时)
备用：MyMemory API
    ↓
返回翻译结果
```

### 核心文件

- **mail-worker/src/template/email-html.js** - HTML 邮件模板（含翻译 UI）
- **mail-worker/src/template/email-text.js** - 纯文本邮件模板（含翻译 UI）
- **mail-worker/src/api/telegram-api.js** - 翻译 API 接口
- **mail-worker/src/service/telegram-service.js** - 翻译服务逻辑

### API 接口

**POST /api/telegram/translate**

请求体：
```json
{
  "text": "要翻译的文本内容",
  "targetLang": "zh"
}
```

支持的语言代码：
- `zh` - 中文
- `en` - 英文
- `ja` - 日语
- `ko` - 韩语
- `es` - 西班牙语
- `fr` - 法语
- `de` - 德语
- `ru` - 俄语

响应体：
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "translatedText": "翻译后的文本"
  }
}
```

## 限制与注意事项

### Cloudflare AI

- 免费额度：每天 10,000 次请求
- 单次翻译长度：建议不超过 3000 字符
- 支持的语言对有限

### MyMemory API（备用方案）

- 免费额度：每天 1,000 字符/IP
- 单次翻译长度：建议不超过 500 字符
- 翻译速度较慢
- 翻译质量一般

### 自动优化

系统已实现以下优化：

1. **自动分段**：超过 3000 字符的文本自动分段翻译
2. **并发翻译**：多个段落并发翻译，提高速度
3. **降级处理**：Cloudflare AI 失败时自动切换到备用服务
4. **容错机制**：所有翻译服务失败时返回原文

## 界面预览

翻译工具栏样式：
- 位置：页面底部固定
- 颜色：紫色渐变（#667eea → #764ba2）
- 包含元素：
  - 语言选择下拉框
  - 翻译按钮
  - 还原按钮（翻译后显示）
  - 加载动画（翻译中显示）

## 常见问题

### Q1: 为什么翻译失败？

**可能原因：**
- 文本内容为空
- 超过 API 配额限制
- 网络连接问题
- 不支持的语言对

**解决方法：**
1. 检查邮件是否有内容
2. 等待一段时间后重试（可能是配额问题）
3. 检查网络连接
4. 尝试其他语言

### Q2: 翻译质量不好怎么办？

**建议：**
1. 配置 Cloudflare AI 以获得更好的翻译质量
2. 或者集成其他翻译服务（如 Google Translate API、DeepL API）

### Q3: 如何自定义翻译服务？

修改 `mail-worker/src/service/telegram-service.js` 中的 `_fallbackTranslate` 方法，替换为你想使用的翻译 API。

示例（使用 Google Translate）：

```javascript
async _fallbackTranslate(text, targetLang) {
    const apiKey = 'YOUR_GOOGLE_TRANSLATE_API_KEY';
    const url = `https://translation.googleapis.com/language/translate/v2`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            q: text,
            target: targetLang,
            key: apiKey
        })
    });

    const data = await response.json();
    return data.data.translations[0].translatedText;
}
```

## 未来优化方向

- [ ] 添加更多语言支持
- [ ] 支持语言自动检测
- [ ] 保存用户偏好的目标语言
- [ ] 添加翻译缓存机制
- [ ] 支持术语表（专业词汇翻译）
- [ ] 集成更高质量的翻译服务

## 贡献

欢迎提交 Issue 和 Pull Request！
