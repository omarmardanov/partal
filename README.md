# Partal

Поисковик автозапчастей для Азербайджана: продавцы загружают каталог, покупатели находят деталь и связываются напрямую.

Прод: https://az.partal.app

## Запуск

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # тесты поиска и разбора CSV
npm run build    # сборка в dist/
```

Деплой — Vercel, автоматически при пуше в `main`.

## Структура

```
src/
  main.jsx          точка входа
  App.jsx           роутинг экранов, auth-listener
  firebase.js       конфиг Firebase, App Check
  analytics.js      Google Analytics (gaEvent)
  i18n.js           строки интерфейса (AZ)
  styles.css
  data/cars.js      марки и модели
  lib/              чистая логика: поиск, CSV, форматирование, регионы (+ тесты)
  components/       мелкие переиспользуемые компоненты
  screens/          экраны приложения
```
