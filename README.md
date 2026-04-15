# Wedding Invite

Формальное приглашение на свадьбу с выбором меню и отправкой ответов в Google Таблицу.

## Запуск

1. Скопируйте `.env.example` в `.env` и заполните:
  - `GOOGLE_SCRIPT_URL`
2. В PowerShell задайте переменную окружения и запустите сервер:

```powershell
$env:GOOGLE_SCRIPT_URL="https://script.google.com/macros/s/ВАШ_DEPLOYMENT_ID/exec"
node .\server.js
```

1. Откройте `http://localhost:3000`.

## Google Apps Script для записи в таблицу

1. Создайте Google Таблицу и откройте `Расширения` -> `Apps Script`.
2. Вставьте код:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Ответы");
  const data = JSON.parse(e.postData.contents);
  const guests = data.guests || [];

  for (const guest of guests) {
    sheet.appendRow([
      new Date(data.submittedAt || Date.now()),
      guest.guestName || "",
      JSON.stringify(guest.selections || {}),
      data.comment || ""
    ]);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

1. Создайте лист с названием `Ответы`.
2. Нажмите `Deploy` -> `New deployment` -> `Web app`.
3. В доступе выберите `Anyone` (или `Anyone with the link`).
4. Скопируйте URL веб-приложения и вставьте его в `GOOGLE_SCRIPT_URL`.

