export default function emailTextTemplate(text) {
	return `<!DOCTYPE html>
<html lang='en' >
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        html {
            margin: 0;
            padding: 0;
            background: #FFF;
        }

        body {
        		box-sizing: border-box;
        		margin: 0;
        		padding: 10px 10px 60px 10px;
            width: 100%;
            height: 100%;
            overflow: auto; /* 改为 auto 允许滚动 */
        }

        span {
        		font-family: inherit;
						white-space: pre-wrap;
						word-break: break-word;
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
<span id="content">${text}</span>

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
    const originalText = \`${text}\`;

    async function translateContent() {
        const targetLang = document.getElementById('targetLang').value;
        const translateBtn = document.getElementById('translateBtn');
        const resetBtn = document.getElementById('resetBtn');
        const contentEl = document.getElementById('content');

        translateBtn.disabled = true;
        translateBtn.innerHTML = '<span class="loading-spinner"></span>翻译中...';

        try {
            const textContent = contentEl.innerText || contentEl.textContent;

            if (!textContent.trim()) {
                throw new Error('没有可翻译的内容');
            }

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

            contentEl.textContent = data.data.translatedText;
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

    function resetContent() {
        document.getElementById('content').innerHTML = originalText;
        document.getElementById('resetBtn').style.display = 'none';
    }
</script>
</body>
</html>`
}
