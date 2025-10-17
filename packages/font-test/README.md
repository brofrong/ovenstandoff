# Font Test Website

Простой сайт для тестирования шрифта Eurostile Regular с картинкой из `/worker/test-img/img-names-4.png`.

## Запуск

```bash
# Установить зависимости
bun install

# Запустить локальный сервер
bun run dev
```

Сайт будет доступен по адресу `http://localhost:3000`

## Возможности

- Отображение картинки в центре экрана
- Текст сверху с шрифтом Eurostile Regular
- Интерактивные элементы управления:
  - Изменение размера шрифта
  - Изменение цвета текста
  - Ввод собственного текста для тестирования

## Файлы

- `index.html` - основной HTML файл с CSS и JavaScript
- `font/Eurostile-Reg.ttf` - шрифт Eurostile
- Картинка загружается из `../worker/test-img/img-names-4.png`
