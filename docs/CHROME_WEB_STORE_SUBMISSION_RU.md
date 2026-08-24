# MaglaSync Free 1.2.0 — заполнение Chrome Web Store

Этот файл предназначен для первой публикации. Тексты ниже можно копировать в форму Google без переписывания.

## 1. Аккаунт разработчика

- Publisher name: `MAGLA`
- Contact email: укажите рабочую почту владельца и подтвердите её по письму Google.
- Включите двухэтапную проверку Google-аккаунта — без неё Google не разрешает публикацию.
- Физический адрес для текущей бесплатной версии без покупок и подписки внутри расширения не требуется.

## 2. Загрузка пакета

В кабинете нажмите **Add new item**, выберите `01-upload-to-chrome-web-store.zip` и нажмите **Upload**.

## 3. Store listing / Страница продукта

- Default language: `English`
- Category: `Workflow & Planning`
- Mature content: `No`

### Summary

```text
Continue one project across the ChatGPT, Claude, and Gemini chats you choose. Free, local, and no API key.
```

### Detailed description

```text
MaglaSync keeps one long-running project continuous across ChatGPT, Claude, and Gemini.

Start a new supported AI chat without explaining the entire project again. Every chat starts disconnected. Only after you click Connect chat can that conversation add recent messages and project updates to the local journal. You review and can edit the complete handoff before placing it in the chat box, and you press Send yourself.

Free edition features:

• one local project;
• explicit per-chat connection and project isolation;
• review and editing before context is placed in a chat;
• structured decisions, reported completed results, blockers, and next steps;
• 24 recent messages by default, with longer history as an opt-in;
• local JSON backup and verified restore;
• history integrity checks;
• no MaglaSync account, AI API key, analytics, advertising, or backend.

MaglaSync Free stores project data in the browser profile. When you press Send, the selected AI provider receives the prepared context under that provider's own privacy terms.
```

### URLs

- Homepage: `https://340867-ux.github.io/MaglaSync/en/`
- Support: `https://github.com/340867-ux/MaglaSync/issues`
- Official URL: пока оставить пустым; добавить `sync.magla.ru` после настройки и подтверждения домена.

### Изображения

- Screenshot 1: `03-store-assets/screenshot-chat-sync.png` — 1280×800
- Screenshot 2: `03-store-assets/screenshot-dashboard.png` — 1280×800
- Small promo tile: `03-store-assets/promo-small.png` — 440×280
- Marquee image: `03-store-assets/promo-marquee.png` — 1400×560

Иконка 128×128 уже находится внутри пакета. Если форма отдельно попросит иконку, используйте `03-store-assets/icon128.png`.

## 4. Privacy / Конфиденциальность

### Single purpose

```text
MaglaSync provides local project continuity between supported AI chat websites by saving messages only from chats the user explicitly connects and preparing reviewed context for a chat box.
```

### Permission justification: storage

```text
Stores the user's project passport, explicit chat connections, connected-chat messages, structured state, settings, backup verification data, and integrity hashes locally in the browser profile.
```

### Host permission justification

```text
Access to chatgpt.com, claude.ai, and gemini.google.com is required to display MaglaSync status, read visible messages only after the user connects that exact chat, and place—but never submit—reviewed context in an empty composer.
```

### Remote code

Выберите: `No, I am not using remote code`.

```text
All runtime JavaScript and CSS are included in the extension package. MaglaSync loads no remote scripts and uses no eval, Function constructor, or remote executable code.
```

### Data usage

Консервативно отметьте только те категории, с которыми расширение действительно работает:

- `Personal communications` — сообщения выбранных пользователем ИИ-чатов;
- `Website content` — видимый текст только тех чатов, которые пользователь явно подключил.

Не отмечайте пароли, платёжные данные, геолокацию, историю браузера или данные аутентификации: MaglaSync их не читает и не хранит.

Подтвердите все пункты Limited Use: данные не продаются, не используются для рекламы или кредитных решений, не передаются людям для чтения и применяются только для заявленной функции продолжения проекта.

### Privacy policy URL

```text
https://340867-ux.github.io/MaglaSync/privacy/
```

## 5. Distribution / Распространение

- Visibility: `Public`
- Regions: `All regions`
- Бесплатное расширение; покупок, рекламы и платной функции внутри этой версии нет.

## 6. Test instructions / Инструкция проверяющему

Данные для входа не требуются.

```text
1. Install the extension and open its options page.
2. Create one project with a name and goal.
3. Open ChatGPT, Claude, or Gemini and reload the tab.
4. Confirm the MaglaSync panel says the chat is not connected and no messages are saved.
5. Click Connect chat, then Review context.
6. Edit the preview and choose Place in chat.
7. Confirm the text is placed but not submitted. Press Send manually.
8. Confirm only this explicitly connected chat appears in the local journal.
```

## 7. Перед отправкой

Убедитесь, что возле разделов **Store listing**, **Privacy**, **Distribution** и **Test instructions** нет красных ошибок. Сохраните черновик. Кнопку **Submit for review** нажимайте только после финальной проверки всей карточки.
