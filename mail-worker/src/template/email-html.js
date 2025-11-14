import { parseHTML } from 'linkedom';
import domainUtils from '../utils/domain-uitls';

export default function emailHtmlTemplate(html, domain) {

	const { document } = parseHTML(html);
	document.querySelectorAll('script').forEach(script => script.remove());
	html = document.toString();
	html = html.replace(/{{domain}}/g, domainUtils.toOssDomain(domain) + '/');

	return `<!DOCTYPE html>
<html lang='en' >
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            background: #FFF;
        }

        .content-box {
        		padding: 15px 10px 60px 10px;
            width: 100%;
            height: 100%;
            overflow: auto; /* 改为 auto 允许滚动 */
            font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .content-html {
            width: 100%;
            height: 100%;
        }

        .translate-bar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 10px 15px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
        }

        .translate-bar select {
            background: rgba(255,255,255,0.9);
            border: none;
            border-radius: 6px;
            padding: 6px 10px;
            font-size: 13px;
            color: #333;
            cursor: pointer;
            outline: none;
            flex: 1;
            max-width: 120px;
        }

        .translate-bar button {
            background: #fff;
            border: none;
            border-radius: 6px;
            padding: 6px 16px;
            font-size: 13px;
            font-weight: 600;
            color: #667eea;
            cursor: pointer;
            margin-left: 10px;
            transition: all 0.2s;
        }

        .translate-bar button:hover {
            transform: scale(1.05);
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        .translate-bar button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .translate-bar .reset-btn {
            background: rgba(255,255,255,0.2);
            color: #fff;
            padding: 6px 12px;
        }

        .translate-bar .reset-btn:hover {
            background: rgba(255,255,255,0.3);
        }

        .loading-spinner {
            display: inline-block;
            width: 14px;
            height: 14px;
            border: 2px solid #667eea;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-right: 5px;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class='content-box'>
        <div id='container' class='content-html'></div>
    </div>

    <div class='translate-bar'>
        <select id='targetLang'>
            <option value='zh'>中文</option>
            <option value='en'>English</option>
            <option value='ja'>日本語</option>
            <option value='ko'>한국어</option>
            <option value='es'>Español</option>
            <option value='fr'>Français</option>
            <option value='de'>Deutsch</option>
            <option value='ru'>Русский</option>
        </select>
        <button id='translateBtn' onclick='translateContent()'>翻译 Translate</button>
        <button id='resetBtn' class='reset-btn' onclick='resetContent()' style='display:none;'>还原 Reset</button>
    </div>

    <script>

        function renderHTML(html) {
            const container = document.getElementById('container');
            const shadowRoot = container.attachShadow({ mode: 'open' });

            // 提取 <body> 的 style 属性
            const bodyStyleRegex = /<body[^>]*style="([^"]*)"[^>]*>/i;
            const bodyStyleMatch = html.match(bodyStyleRegex);
            const bodyStyle = bodyStyleMatch ? bodyStyleMatch[1] : '';

            // 移除 <body> 标签
            const cleanedHtml = html.replace(/<\\/?body[^>]*>/gi, '');

            // 渲染内容
            shadowRoot.innerHTML = \`
                <style>
                    :host {
                        all: initial;
                        width: 100%;
                        height: 100%;
                        font-family: Inter, -apple-system, BlinkMacSystemFont,
                                    'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        font-size: 14px;
                        line-height: 1.5;
                        color: #13181D;
                        word-break: break-word;
                        overflow: auto; /* 添加滚动 */
                    }

                    h1, h2, h3, h4 {
                        font-size: 18px;
                        font-weight: 700;
                    }

                    p {
                        margin: 0;
                    }

                    a {
                        text-decoration: none;
                        color: #0E70DF;
                    }

                    .shadow-content {
                        background: #FFFFFF;
                        width: fit-content;
                        height: fit-content;
                        min-width: 100%;
                        \${bodyStyle ? bodyStyle : ''} /* 注入 body 的 style */
                    }

                    img:not(table img) {
                        max-width: 100% !important;
                        height: auto !important;
                    }
                </style>
                <div class="shadow-content">
                    \${cleanedHtml}
                </div>
            \`;

            // 自动缩放
            autoScale(shadowRoot, container);
        }

        function autoScale(shadowRoot, container) {

            if (!shadowRoot || !container) return;

            const parent = container;
            const shadowContent = shadowRoot.querySelector('.shadow-content');

            if (!shadowContent) return;

            const parentWidth = parent.offsetWidth;
            const childWidth = shadowContent.scrollWidth;

            if (childWidth === 0) return;

            const scale = parentWidth / childWidth;

            const hostElement = shadowRoot.host;
            hostElement.style.zoom = scale;
        }

        // 使用示例
        const exampleHtml = \`${html}\`;
        let originalHtml = exampleHtml;
        let currentHtml = exampleHtml;

        // 渲染HTML
        renderHTML(exampleHtml);

        // 翻译功能
        async function translateContent() {
            const targetLang = document.getElementById('targetLang').value;
            const translateBtn = document.getElementById('translateBtn');
            const resetBtn = document.getElementById('resetBtn');

            translateBtn.disabled = true;
            translateBtn.innerHTML = '<span class="loading-spinner"></span>翻译中...';

            try {
                const container = document.getElementById('container');
                const shadowRoot = container.shadowRoot;
                const shadowContent = shadowRoot.querySelector('.shadow-content');

                // 提取文本内容
                const textContent = shadowContent.innerText || shadowContent.textContent;

                if (!textContent.trim()) {
                    throw new Error('没有可翻译的内容');
                }

                // 调用翻译API
                const response = await fetch('/api/telegram/translate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        text: textContent,
                        targetLang: targetLang
                    })
                });

                if (!response.ok) {
                    throw new Error('翻译失败');
                }

                const data = await response.json();

                if (data.code !== 200) {
                    throw new Error(data.msg || '翻译失败');
                }

                // 保存当前HTML并更新为翻译后的内容
                const translatedText = data.data.translatedText;
                currentHtml = \`<div style="white-space: pre-wrap; font-family: inherit; line-height: 1.6;">\${translatedText}</div>\`;

                renderHTML(currentHtml);

                translateBtn.innerHTML = '翻译 Translate';
                resetBtn.style.display = 'block';

            } catch (error) {
                console.error('翻译错误:', error);
                alert('翻译失败: ' + error.message);
                translateBtn.innerHTML = '翻译 Translate';
            } finally {
                translateBtn.disabled = false;
            }
        }

        // 还原功能
        function resetContent() {
            currentHtml = originalHtml;
            renderHTML(currentHtml);
            document.getElementById('resetBtn').style.display = 'none';
        }
    </script>
</body>
</html>`
}
