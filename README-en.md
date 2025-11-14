
<p align="center">
  <img src="doc/demo/logo.png" width="80px" />
</p>

<div align="center">
<h1>Cloud Mail</h1>
</div>
<div align="center">
    <h4>Serverless responsive email service with sending capabilities, deployable on the Cloudflare platform 🎉</h4> 
</div>


## Project Showcase

- [Online Demo](https://skymail.ink)<br>
- [Deployment Guide](https://doc.skymail.ink/en/)<br>
- [UI Deployment](https://doc.skymail.ink/en/guide/via-ui.html)


| ![](/doc/demo/demo1.png) | ![](/doc/demo/demo2.png) |
|--------------------------|--------------------------|
| ![](/doc/demo/demo3.png) | ![](/doc/demo/demo4.png) |

## Features

- **💰 Low-Cost Usage**: No server required — deploy to Cloudflare Workers to reduce costs.

- **💻 Responsive Design**: Automatically adapts to both desktop and most mobile browsers.

- **📧 Email Sending**: Integrated with Resend for bulk email sending, embedded images, attachments, and status tracking.

- **🛡️ Admin Features**: Admins can manage users and emails, with RBAC permission control to limit access to features and resources.

- **📦 Attachment Support**: Send and receive attachments, stored and downloaded via R2 object storage.

- **🔔 Email Push**: Forward received emails to Telegram bots or other email providers.

- **🌍 Email Translation**: ✨ NEW! One-click translation for Telegram email previews, supporting 8 languages

- **📡 Open API**: Supports batch user creation via API and multi-condition email queries

- **📈 Data Visualization**: Use Echarts to visualize system data, including user email growth.

- **🎨 Personalization**: Customize website title, login background, and transparency.

- **🤖 CAPTCHA**: Integrated with Turnstile CAPTCHA to prevent automated registration.

- **📜 More Features**: Under development...

## Tech Stack

- **Serverless**: [Cloudflare Workers](https://developers.cloudflare.com/workers/)

- **Web Framework**: [Hono](https://hono.dev/)

- **ORM**: [Drizzle](https://orm.drizzle.team/)

- **Frontend Framework**: [Vue3](https://vuejs.org/)

- **UI Framework**: [Element Plus](https://element-plus.org/)

- **Email Service**: [Resend](https://resend.com/)

- **Cache**: [Cloudflare KV](https://developers.cloudflare.com/kv/)

- **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/)

- **File Storage**: [Cloudflare R2](https://developers.cloudflare.com/r2/)

## Directory Structure

```
cloud-mail
├── mail-worker				    # Backend worker project
│   ├── src
│   │   ├── api	 			    # API layer
│   │   ├── const  			    # Project constants
│   │   ├── dao                 # Data access layer
│   │   ├── email			    # Email processing and handling
│   │   ├── entity			    # Database entities
│   │   ├── error			    # Custom exceptions
│   │   ├── hono			    # Web framework, middleware, error handling
│   │   ├── i18n			    # Internationalization
│   │   ├── init			    # Database and cache initialization
│   │   ├── model			    # Response data models
│   │   ├── security			# Authentication and authorization
│   │   ├── service			    # Business logic layer
│   │   ├── template			# Message templates (with translation UI)
│   │   ├── utils			    # Utility functions
│   │   └── index.js			# Entry point
│   ├── package.json			# Project dependencies
│   └── wrangler.toml			# Project configuration
│
├─ mail-vue				        # Frontend Vue project
│   ├── src
│   │   ├── axios 			    # Axios configuration
│   │   ├── components			# Custom components
│   │   ├── echarts			    # ECharts integration
│   │   ├── i18n			    # Internationalization
│   │   ├── init			    # Startup initialization
│   │   ├── layout			    # Main layout components
│   │   ├── perm			    # Permissions and access control
│   │   ├── request			    # API request layer
│   │   ├── router			    # Router configuration
│   │   ├── store			    # Global state management
│   │   ├── utils			    # Utility functions
│   │   ├── views			    # Page components
│   │   ├── app.vue			    # Root component
│   │   ├── main.js			    # Entry JS file
│   │   └── style.css			# Global styles
│   ├── package.json			# Project dependencies
│   └── env.release				# Environment configuration
│
└── doc                         # Documentation
    ├── telegram-translate.md   # Translation feature documentation
    └── test-translate.html     # Translation feature test page

```

## ✨ New Feature: Telegram Email Translation

### Features

When emails are pushed to Telegram, users can translate the email content directly within the embedded preview page:

- 🌍 **Multi-language Support**: Supports 8 languages including Chinese, English, Japanese, Korean, Spanish, French, German, and Russian
- 🎨 **Beautiful Interface**: Fixed bottom translation toolbar with purple gradient design
- ⚡ **One-click Translation**: Translate with a single button click
- 🔄 **Reset Function**: Restore original email content anytime
- 🤖 **Smart Engine**: Prioritizes Cloudflare AI, falls back to MyMemory API
- 📱 **Responsive**: Perfect adaptation for mobile and desktop

### How to Use

1. Receive email push notification in Telegram
2. Click the "View" button in the message
3. Find the translation toolbar at the bottom of the email page
4. Select target language (e.g., Chinese, English)
5. Click the "Translate" button
6. Wait 2-5 seconds for the email to be translated
7. To view the original text, click the "Reset" button

### Configuration

#### Option A: Use Cloudflare AI (Recommended)

Add to `mail-worker/wrangler.toml`:

```toml
[ai]
binding = "AI"
```

**Benefits:**
- Free quota: 10,000 translations/day
- High translation quality
- Fast response time

#### Option B: Use Default Fallback

No configuration needed—the system automatically uses MyMemory free translation API.

**Features:**
- Completely free
- 1,000 characters/day/IP
- Average translation quality

### Technical Implementation

- **Frontend UI**: Translation UI integrated in email templates at `mail-worker/src/template/`
- **Translation API**: `POST /api/telegram/translate`
- **Translation Service**: `mail-worker/src/service/telegram-service.js`
- **Dual Engine**: Cloudflare AI → MyMemory API → Return original text

### Documentation

View full documentation: [doc/telegram-translate.md](doc/telegram-translate.md)

Test page: [doc/test-translate.html](doc/test-translate.html)

## Support

<a href="https://doc.skymail.ink/support.html">
<img width="170px" src="./doc/images/support.png" alt="">
</a>

## License

This project is licensed under the [MIT](LICENSE) license.

## Communication

[Telegram](https://t.me/cloud_mail_tg)
