# План реализации графика из Figma (node 1609:6785)

## 1. Контекст и цель
- Цель: реализовать интерактивный график и контролы в соответствии с Figma-макетом `Bobsbookkeepers--Copy-` и уточнениями из `qa-specs.md`.
- Важно: текущий план по `growth.tlb.org` неактуален для этой версии и заменен данным документом.
- Приоритет: сначала корректная математика и интерактивность, затем визуальный паритет.

## 2. Подтвержденные требования (из QA + Figma)
- Линии на графике:
  - Зеленая: `Revenue` (растущая).
  - Красная (светлая): `Variable expenses` (зависит от revenue).
  - Серая (светлая, горизонтальная): `Fixed expenses`.
  - Черная (более акцентная): `Total expenses = variable + fixed`.
- Ключевое событие: пересечение зеленой и черной линий (`breakeven`).
- Управление:
  - Радио: `Weekly | Monthly | Quarterly | Yearly`.
  - 4 поля: `Revenue`, `Gross margin`, `Fixed expenses`, `Growth rate`.
  - 4 drag-ручки на графике (как в дизайне): старт Revenue, наклон Revenue, уровень Fixed, доля Variable.
- Подписи под графиком:
  - `Profitable at: ...`
  - `$1B/y revenue at: ...`

## 3. Математическая модель (единый source of truth)
- Параметры состояния:
  - `revenue0`
  - `growthRatePerUnit`
  - `grossMargin`
  - `fixedExpensesPerUnit`
  - `units` (`week|month|quarter|year`)
- Производные формулы:
  - `Revenue(t) = revenue0 * (1 + growthRatePerUnit)^t`
  - `VariableExpenses(t) = Revenue(t) * (1 - grossMargin)`
  - `FixedExpenses(t) = fixedExpensesPerUnit`
  - `TotalExpenses(t) = VariableExpenses(t) + FixedExpenses(t)`
- Точка безубыточности:
  - Решаем `Revenue(t) = TotalExpenses(t)`.
  - Аналитически: если `grossMargin <= 0`, безубыточность недостижима.
  - Иначе: `Revenue(t) * grossMargin = FixedExpenses`,
    `t = log(FixedExpenses / (revenue0 * grossMargin)) / log(1 + growthRatePerUnit)`.
  - Граничные случаи (нулевой рост, уже прибыльно на старте, NaN/Infinity) обрабатываются явно.
- `$1B/y revenue at`:
  - Находим момент достижения `1_000_000_000` в годовом эквиваленте.
  - Внутренне считаем в активных единицах через конвертацию в annualized target.

## 4. Архитектура реализации (минимально надежная)
- `src/model/graphModel.js`
  - Хранит state, валидирует входы, считает series/метрики.
- `src/chart/chartRenderer.js`
  - Canvas/SVG рендер сетки, осей, 4 линий, подписей, ручек.
- `src/chart/interactions.js`
  - Hit-testing, drag, hover, синхронизация с моделью.
- `src/ui/controls.js`
  - Радио + текстовые поля, парсинг/форматирование валюты/процентов.
- `src/index.js`
  - Инициализация, связывание модулей, resize/devicePixelRatio.

## 5. Порядок работ
1. Базовый каркас проекта
- Создать `src/` структуру и скрипты `dev/build/test` в `package.json`.

2. Реализовать модель и тестируемые вычисления
- Формулы revenue/expenses/breakeven/$1B.
- Юнит-тесты на крайние кейсы:
  - `grossMargin <= 0`
  - `growthRate = 0`
  - старт уже выше total expenses
  - очень малые/очень большие значения.

3. Реализовать график
- Сетка, оси, шкалы и подписи как в Figma.
- Визуальные приоритеты линий: черная толще, variable/fixed светлее.

4. Добавить интерактивность
- Drag-ручки с двусторонней синхронизацией с инпутами.
- Переключение единиц времени с корректным пересчетом значений.

5. Верификация и доводка
- Сверка с макетом по spacing/типографике/цветам.
- Проверка на desktop/mobile.
- Проверка UX-логики из `qa-specs.md`.

## 6. QA критерии приемки
- Математика:
  - Все 4 линии соответствуют формулам.
  - `Total expenses` всегда равно `variable + fixed`.
  - `Profitable at` и `$1B/y revenue at` корректны и стабильны при изменении входов.
- UX:
  - Любое изменение в ручках отражается в инпутах и наоборот.
  - Переключение `Weekly/Monthly/Quarterly/Yearly` не ломает логику и масштаб.
- Визуал:
  - Структура и композиция соответствуют Figma (контролы сверху, график, метрики, инпуты).

## 7. Риски и решения
- Риск: неоднозначность интерпретации `gross margin` vs `variable %`.
  - Решение: в UI оставить label как в Figma (`Gross margin`), во внутренних формулах явно документировать связь: `variable = 1 - grossMargin`.
- Риск: численная нестабильность при малом росте.
  - Решение: epsilon-проверки, ветвление формул для `growthRate ~ 0`.
- Риск: расхождения между drag UX и текстовым вводом.
  - Решение: единый state-store и нормализация значений после каждого изменения.

## 8. Договоренности по работе
- Работаем итерациями:
  1. Модель + тесты.
  2. Базовый график.
  3. Интерактивность.
  4. Pixel/behavior polish по Figma.
- Любые спорные детали фиксируем сразу в `qa-specs.md`, чтобы не плодить разные трактовки.
