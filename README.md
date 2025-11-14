<p align="center">
  <img src="doc/demo/logo.png" width="80px" />
</p>

<div align="center">
<h1>Cloud Mail</h1>
</div>
<div align="center">
    <h4>Serverless 响应式邮箱服务，支持邮件发送，可部署到Cloudflare平台 🎉</h4> 
</div>
<div align="center">
    <span>简体中文 | <a href="/README-en.md" style="margin-left: 5px">English </a></span>
</div>

## 项目简介

只需要一个域名，就可以创建多个不同的邮箱，类似各大邮箱平台，本项目可部署到 Cloudflare Workers ，降低服务器成本，搭建自己的邮箱服务

## 项目展示

- [在线演示](https://skymail.ink)<br>
- [部署文档](https://doc.skymail.ink)<br>
- [界面部署](https://doc.skymail.ink/guide/via-ui.html)

| ![](/doc/demo/demo1.png) | ![](/doc/demo/demo2.png) |
|-----------------------|-----------------------|
| ![](/doc/demo/demo3.png) | ![](/doc/demo/demo4.png) |




## 功能介绍

- **💰 低成本使用**： 部署到 Cloudflare Workers 降低服务器成本

- **💻 响应式设计**：响应式布局自动适配PC和大部分手机端浏览器

- **📧 邮件发送**：集成Resend发送邮件，支持群发，内嵌图片和附件发送，发送状态查看

- **🛡️ 管理员功能**：可以对用户，邮件进行管理，RABC权限控制对功能及使用资源限制

- **📦 附件收发**：支持收发附件，使用R2对象存储保存和下载文件

- **🔔 邮件推送**：接收邮件后可以转发到TG机器人或其他服务商邮箱

- **🌍 邮件翻译**：✨ NEW! Telegram 推送邮件支持一键翻译，支持8种语言互译

- **📡 开放API**：支持使用API批量生成用户，多条件查询邮件

- **📈 数据可视化**：使用Echarts对系统数据详情，用户邮件增长可视化显示

- **🎨 个性化设置**：可以自定义网站标题，登录背景，透明度

- **🤖 人机验证**：集成Turnstile人机验证，防止人机批量注册

- **📜 更多功能**：正在开发中...



## 技术栈

- **Serverless**：[Cloudflare Workers](https://developers.cloudflare.com/workers/)

- **Web框架**：[Hono](https://hono.dev/)

- **ORM：**[Drizzle](https://orm.drizzle.team/)

- **前端框架**：[Vue3](https://vuejs.org/) 

- **UI框架**：[Element Plus](https://element-plus.org/) 

- **邮件推送：** [Resend](https://resend.com/)

- **缓存**：[Cloudflare KV](https://developers.cloudflare.com/kv/)

- **数据库**：[Cloudflare D1](https://developers.cloudflare.com/d1/)

- **文件存储**：[Cloudflare R2](https://developers.cloudflare.com/r2/)

## 目录结构

```
cloud-mail
├── mail-worker				    # worker后端项目
│   ├── src
│   │   ├── api	 			    # api接口层
│   │   ├── const  			    # 项目常量
│   │   ├── dao                 # 数据访问层
│   │   ├── email			    # 邮件处理接收
│   │   ├── entity			    # 数据库实体
│   │   ├── error			    # 自定义异常
│   │   ├── hono			    # web框架配置、拦截器、全局异常等
│   │   ├── i18n			    # 语言国际化
│   │   ├── init			    # 数据库缓存初始化
│   │   ├── model			    # 响应体数据封装
│   │   ├── security			# 身份权限认证
│   │   ├── service			    # 业务服务层
│   │   ├── template			# 消息模板（含翻译界面）
│   │   ├── utils			    # 工具类
│   │   └── index.js			# 入口文件
│   ├── pageckge.json			# 项目依赖
│   └── wrangler.toml			# 项目配置
│
├── mail-vue				    # vue前端项目
│   ├── src
│   │   ├── axios 			    # axios配置
│   │   ├── components			# 自定义组件
│   │   ├── echarts			    # echarts组件导入
│   │   ├── i18n			    # 语言国际化
│   │   ├── init			    # 入站初始化
│   │   ├── layout			    # 主体布局组件
│   │   ├── perm			    # 权限认证
│   │   ├── request			    # api接口
│   │   ├── router			    # 路由配置
│   │   ├── store			    # 全局状态管理
│   │   ├── utils			    # 工具类
│   │   ├── views			    # 页面组件
│   │   ├── app.vue			    # 入口组件
│   │   ├── main.js			    # 入口js
│   │   └── style.css			# 全局css
│   ├── package.json			# 项目依赖
│   └── env.release				# 项目配置
│
└── doc                         # 文档目录
    ├── telegram-translate.md   # 翻译功能详细文档
    └── test-translate.html     # 翻译功能测试页面
```

## ✨ 新功能：Telegram 邮件翻译

### 功能特点

当邮件推送到 Telegram 时，用户可以直接在内嵌页面中翻译邮件内容：

- 🌍 **多语言支持**：支持中文、英文、日语、韩语、西班牙语、法语、德语、俄语 8 种语言
- 🎨 **美观界面**：底部固定翻译工具栏，紫色渐变设计
- ⚡ **一键翻译**：点击按钮即可实时翻译
- 🔄 **还原功能**：支持还原到原始邮件内容
- 🤖 **智能引擎**：优先使用 Cloudflare AI，备用 MyMemory API
- 📱 **响应式**：完美适配移动端和桌面端

### 使用方法

1. 在 Telegram 中收到邮件推送通知
2. 点击消息中的「查看」按钮
3. 在打开的邮件页面底部找到翻译工具栏
4. 选择目标语言（如：中文、英文等）
5. 点击「翻译 Translate」按钮
6. 等待 2-5 秒，邮件内容将被翻译
7. 如需查看原文，点击「还原 Reset」按钮

### 配置说明

#### 方案 A：使用 Cloudflare AI（推荐）

在 `mail-worker/wrangler.toml` 中添加：

```toml
[ai]
binding = "AI"
```

**优势：**
- 免费额度：10,000 次/天
- 翻译质量高
- 响应速度快

#### 方案 B：使用默认备用方案

无需配置，系统会自动使用 MyMemory 免费翻译 API。

**特点：**
- 完全免费
- 1,000 字符/天/IP
- 翻译质量一般

### 技术实现

- **前端界面**：在 `mail-worker/src/template/` 中的邮件模板集成翻译 UI
- **翻译 API**：`POST /api/telegram/translate`
- **翻译服务**：`mail-worker/src/service/telegram-service.js`
- **双层引擎**：Cloudflare AI → MyMemory API → 返回原文

### 详细文档

查看完整文档：[doc/telegram-translate.md](doc/telegram-translate.md)

测试页面：[doc/test-translate.html](doc/test-translate.html)

## 赞助

<a href="https://doc.skymail.ink/support.html" >
<img width="170px" src="./doc/images/support.png" alt="">
</a>

## 许可证

本项目采用 [MIT](LICENSE) 许可证	


## 交流

[Telegram](https://t.me/cloud_mail_tg)



