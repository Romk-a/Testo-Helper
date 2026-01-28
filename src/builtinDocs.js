// Документация для встроенных функций Testo

const builtinDocs = {
    // === ДЕЙСТВИЯ С ВИРТУАЛЬНЫМИ МАШИНАМИ ===

    'wait': {
        category: 'Действия с ВМ',
        syntax: 'wait <select_expr> [timeout <time>] [interval <time>]',
        description: 'Дождаться появления на экране события. Если за указанное время выражение не обнаружено — генерируется ошибка.',
        params: [
            '`select_expr` — строка, изображение (`img "path"`) или JS-запрос (`js "..."`)',
            '`timeout` — максимальное время ожидания (по умолчанию 1 минута)',
            '`interval` — частота проверки экрана (по умолчанию 1 секунда)'
        ],
        example: 'wait "Hello world"\nwait !"Применение изменений" timeout 30m interval 15s\nwait img "${IMG_DIR}/icon.png"\nwait ("аудит" || "Аудит") && ("уведомление" || "информация")\nwait js """return find_text("/usr/bin/sleep").size() > 2"""'
    },

    'check': {
        category: 'Действия с ВМ',
        syntax: 'check <select_expr> [timeout <time>] [interval <time>]',
        description: 'Проверяет наличие события на экране. Возвращает `true` если найдено, `false` если нет. Используется в условиях `if`.',
        params: [
            '`select_expr` — строка, изображение или JS-запрос',
            '`timeout` — время ожидания (без timeout — мгновенная проверка)',
            '`interval` — частота проверки экрана'
        ],
        example: 'if (check "Login" timeout 10s) {\n    print "Найдено"\n}'
    },

    'press': {
        category: 'Действия с ВМ',
        syntax: 'press <key>[,key2,key3...] [interval <time>]',
        description: 'Нажимает клавиши клавиатуры. Поддерживает комбинации (`Ctrl+Alt+Delete`), повторения (`Down*6`) и последовательности.',
        params: [
            '`key` — клавиша или комбинация (регистронезависимо)',
            '`*N` — повторить N раз (например `Tab*3`)',
            '`interval` — задержка между нажатиями (по умолчанию 30ms)'
        ],
        example: 'press Enter\npress Down*6, Enter interval 150ms\npress LeftCtrl+LeftAlt+Delete'
    },

    'type': {
        category: 'Действия с ВМ',
        syntax: 'type <text> [interval <time>] [autoswitch <key>]',
        description: 'Набирает текст с клавиатуры ВМ. Переносы строк преобразуются в Enter, табуляции — в Tab.',
        params: [
            '`text` — строка для ввода',
            '`interval` — задержка между нажатиями (по умолчанию 30ms)',
            '`autoswitch` — комбинация для автопереключения раскладки',
            '⚠️ `autoswitch` нестабилен — лучше использовать макросы `enrus()` и `rusen()`'
        ],
        example: 'type "Hello world" interval 100ms'
    },

    'sleep': {
        category: 'Действия с ВМ',
        syntax: 'sleep <time>',
        description: 'Безусловное ожидание в течение указанного времени.',
        params: [
            '`time` — спецификатор времени (например `10s`, `5m`, `1h`)'
        ],
        example: 'sleep 10s\nsleep "${timeout}"'
    },

    'mouse': {
        category: 'Действия с ВМ',
        syntax: 'mouse <action> [destination] [timeout <time>]',
        description: 'Действия с мышью: перемещение, клики, зажатие/отпускание кнопок, прокрутка колесика.',
        params: [
            '**action (действия):**',
            '`move` — переместить курсор',
            '`click`/`lclick` — левый клик, `rclick` — правый клик, `dclick` — двойной клик',
            '`hold <lbtn|rbtn>` — зажать кнопку, `release` — отпустить',
            '`wheel-up`/`wheel-down` — прокрутка [scroll N] [timeout] [interval]',
            '**destination (куда):**',
            '`X Y` — координаты в пикселях (`100 250`)',
            '`"Текст"` — надпись на экране',
            '`img "path"` — изображение',
            '`js "return ..."` — JS-селектор (должен вернуть `{x, y}`)',
            '**Спецификаторы (через точку):**',
            'Выбор экземпляра: `.from_top(N)`, `.from_bottom(N)`, `.from_left(N)`, `.from_right(N)`',
            'Позиция курсора: `.center()`, `.left_top()`, `.right_bottom()`, `.left_center()`, `.right_center()`, `.center_top()`, `.center_bottom()`, `.left_bottom()`, `.right_top()`',
            'Смещение: `.move_left(N)`, `.move_right(N)`, `.move_up(N)`, `.move_down(N)`'
        ],
        example: 'mouse click "OK"\nmouse move 400 0\nmouse rclick "Корзина" timeout 10m\nmouse dclick img "icon.png".from_bottom(0)\nmouse click "DNS-сервер".right_center().move_right(30)\nmouse hold lbtn\nmouse release\nmouse wheel-down scroll 5'
    },

    'exec': {
        category: 'Действия с ВМ',
        syntax: 'exec <interpreter> <script> [with <cmd> as <user>] [expect <regex>] [timeout <time>]',
        description: 'Выполняет скрипт в ВМ через указанный интерпретатор. Требует testo-guest-additions. При ошибке (код возврата ≠ 0) тест завершается с ошибкой.',
        params: [
            '`interpreter` — `bash`, `cmd`, `python`, `python2`, `python3`',
            '`script` — строка со скриптом',
            '`with` — команда запуска: `systemd-run`, `pdp-exec` (опционально)',
            '`as` — пользователь для `with` (обязателен если указан `with`)',
            '`expect` — regex для проверки вывода (синтаксис egrep, экранирование `\\\\`)',
            '`timeout` — максимальное время выполнения (по умолчанию 10 минут)'
        ],
        example: 'exec bash "echo Hello"\nexec python """\nprint("Hello")\n""" timeout 5m\nexec bash "cmd" with systemd-run as "user"\nexec bash "./test.sh" expect "PASSED|OK"'
    },

    'print': {
        category: 'Действия с ВМ',
        syntax: 'print <message>',
        description: 'Выводит сообщение в stdout.',
        params: [
            '`message` — строка для вывода'
        ],
        example: 'print "Тест выполнен успешно"'
    },

    'abort': {
        category: 'Действия с ВМ',
        syntax: 'abort <error_message>',
        description: 'Аварийно завершает тест с ошибкой.',
        params: [
            '`error_message` — сообщение об ошибке'
        ],
        example: 'abort "Критическая ошибка: файл не найден"'
    },

    'screenshot': {
        category: 'Действия с ВМ',
        syntax: 'screenshot <path>',
        description: 'Сохраняет скриншот текущего состояния экрана ВМ.',
        params: [
            '`path` — путь к файлу для сохранения'
        ],
        example: 'screenshot "/tmp/screenshot.png"'
    },

    'step': {
        category: 'Действия с ВМ',
        syntax: 'step',
        description: 'Маркер шага теста.  \nВыводит в лог `======== STEP N ========`  \nНомера шагов автоинкрементируются.',
        params: [],
        example: 'step #1\nwait "Логин"\ntype "admin"\n\nstep #2\npress Enter\nwait "Главное меню"'
    },

    // === УПРАВЛЕНИЕ ВМ ===

    'start': {
        category: 'Управление ВМ',
        syntax: 'start',
        description: 'Запускает виртуальную машину. ВМ должна быть выключена.',
        params: [],
        example: 'start'
    },

    'stop': {
        category: 'Управление ВМ',
        syntax: 'stop',
        description: 'Останавливает ВМ, имитируя обрыв электропитания (жёсткая остановка).',
        params: [],
        example: 'stop'
    },

    'shutdown': {
        category: 'Управление ВМ',
        syntax: 'shutdown [timeout <time>]',
        description: 'Мягкая остановка ВМ через сигнал ACPI. Ждёт завершения работы ОС.',
        params: [
            '`timeout` — максимальное время ожидания (по умолчанию 1 минута)'
        ],
        example: 'shutdown timeout 2m'
    },

    'snapshot': {
        category: 'Управление ВМ',
        syntax: 'snapshot <action>',
        description: 'Управление временными снимками всех ВМ в тесте.',
        params: [
            '`create` — создать временный снимок',
            '`revert` — откатить к созданному снимку',
            '⚠️ При откате значения динамических переменных `$<VAR>` также откатываются'
        ],
        example: 'snapshot create\n# ... действия ...\nif (check "Ошибка") {\n    snapshot revert\n}'
    },

    // === КЛАВИШИ ===

    'hold': {
        category: 'Клавиши',
        syntax: 'hold <key>',
        description: 'Зажимает и удерживает клавиши до вызова `release`.',
        params: [
            '`key` — клавиша или комбинация для зажатия'
        ],
        example: 'hold LeftCtrl+LeftAlt\npress Delete\nrelease'
    },

    'release': {
        category: 'Клавиши',
        syntax: 'release [key]',
        description: 'Отпускает зажатые клавиши. Без аргументов — отпускает все.',
        params: [
            '`key` — конкретные клавиши для отпускания (опционально)'
        ],
        example: 'release\nrelease LeftCtrl'
    },

    // === ПОДКЛЮЧЕНИЕ УСТРОЙСТВ ===

    'plug': {
        category: 'Устройства',
        syntax: 'plug <device_type> <name>',
        description: 'Подключает устройство к ВМ.',
        params: [
            '`device_type` — `flash`, `nic`, `link`, `dvd`, `hostdev usb`',
            '`name` — имя устройства или путь к ISO'
        ],
        example: 'plug flash my_flash\nplug dvd "/path/to/image.iso"\nplug nic internet_nic'
    },

    'unplug': {
        category: 'Устройства',
        syntax: 'unplug <device_type> [name]',
        description: 'Отключает устройство от ВМ.',
        params: [
            '`device_type` — `flash`, `nic`, `link`, `dvd`, `hostdev usb`',
            '`name` — имя устройства (для некоторых типов)'
        ],
        example: 'unplug flash my_flash\nunplug dvd'
    },

    // === КОПИРОВАНИЕ ФАЙЛОВ ===

    'copyto': {
        category: 'Копирование',
        syntax: 'copyto <from> <to> [nocheck] [timeout <time>]',
        description: 'Копирует файл/папку с хоста на ВМ. Требует testo-guest-additions.',
        params: [
            '`from` — путь на хосте',
            '`to` — полный путь на ВМ',
            '`nocheck` — не проверять существование файла',
            '`timeout` — таймаут (по умолчанию 10 минут)'
        ],
        example: 'copyto "/home/user/file.txt" "/tmp/file.txt"'
    },

    'copyfrom': {
        category: 'Копирование',
        syntax: 'copyfrom <from> <to> [timeout <time>]',
        description: 'Копирует файл/папку с ВМ на хост. Требует testo-guest-additions.',
        params: [
            '`from` — путь на ВМ',
            '`to` — полный путь на хосте',
            '`timeout` — таймаут (по умолчанию 10 минут)'
        ],
        example: 'copyfrom "/var/log/app.log" "/tmp/app.log"'
    },

    // === ОБЪЯВЛЕНИЯ ===

    'test': {
        category: 'Объявления',
        syntax: 'test <name> [: parent1, parent2...] { }',
        description: 'Объявление теста. Может наследовать состояние от родительских тестов.',
        params: [
            '`name` — имя теста',
            '`parent` — родительские тесты (опционально)'
        ],
        example: 'test my_test {\n    vm_name {\n        start\n        wait "Пароль"\n    }\n}'
    },

    'macro': {
        category: 'Объявления',
        syntax: 'macro <name>([arg1, arg2, argN="default"]) { }',
        description: 'Объявление макроса — переиспользуемого именованного блока кода.',
        params: [
            '`name` — уникальное имя макроса (идентификатор)',
            '`args` — аргументы (только строки), могут иметь значения по умолчанию'
        ],
        example: 'macro login(user, pass="${DEFAULT_PASS}") {\n    wait "login:"; type "${user}"; press Enter\n    wait "Password:"; type "${pass}"; press Enter\n}\n\n# Вызов:\nmy_vm login("root")'
    },

    'param': {
        category: 'Объявления',
        syntax: 'param <name> <value>',
        description: 'Объявление параметра (глобальной константы).',
        params: [
            '`name` — имя параметра',
            '`value` — значение'
        ],
        example: 'param TIMEOUT "30s"\nparam IMG_DIR "/images"'
    },

    'include': {
        category: 'Объявления',
        syntax: 'include "<path>"',
        description: 'Включение другого файла с тестовыми сценариями.',
        params: [
            '`path` — путь к файлу .testo'
        ],
        example: 'include "macros.testo"\ninclude "../common/utils.testo"'
    },

    'machine': {
        category: 'Объявления',
        syntax: 'machine <name> { }',
        description: 'Объявление виртуальной машины.',
        params: [
            '`name` — имя ВМ'
        ],
        example: 'machine my_vm {\n    cpus: 2\n    ram: 4Gb\n    disk: "/path/to/disk.qcow2"\n}'
    },

    'flash': {
        category: 'Объявления',
        syntax: 'flash <name> { }',
        description: 'Объявление виртуального флеш-накопителя.',
        params: [
            '`name` — имя флешки'
        ],
        example: 'flash my_flash {\n    size: 1Gb\n}'
    },

    'network': {
        category: 'Объявления',
        syntax: 'network <name> { }',
        description: 'Объявление виртуальной сети.',
        params: [
            '`name` — имя сети'
        ],
        example: 'network internal_net {\n    mode: "internal"\n}'
    },

    // === УПРАВЛЕНИЕ ПОТОКОМ ===

    'if': {
        category: 'Управление потоком',
        syntax: 'if (<expression>) { } [else [if (<expr2>)] { }]',
        description: 'Условный оператор. Поддерживает каскадные конструкции `else if`.',
        params: [
            '**Выражения (expression):**',
            '`"строка"` — пустая = false, непустая = true',
            '`DEFINED var` — true если параметр определён',
            '`check <expr> [timeout] [interval]` — проверка экрана (только для ВМ)',
            '`NOT <expr>` — отрицание',
            '`<expr1> AND <expr2>` — логическое И',
            '`<expr1> OR <expr2>` — логическое ИЛИ',
            '**Сравнения строк:**',
            '`STREQUAL` — равенство, `STRMATCH` — regex, `STRLESS`/`STRGREATER` — лексикографически',
            '**Сравнения чисел** (оба операнда должны быть числами):',
            '`EQUAL`, `LESS`, `GREATER`'
        ],
        example: 'if (check "Error" timeout 5s) {\n    abort "Ошибка"\n}\nelse if (DEFINED some_var) {\n    print "${some_var}"\n}\n\nif ("${VM_POOL}" STRMATCH ".*4.*") {\n    print "ARM architecture"\n}'
    },

    'for': {
        category: 'Управление потоком',
        syntax: 'for (<var> IN RANGE [start] <end>) { }',
        description: 'Цикл с переменной. Доступ к счётчику внутри цикла: `${var}`.',
        params: [
            '`var` — переменная цикла (доступна как `${var}`)',
            '`RANGE N` — от 0 до N-1',
            '`RANGE start end` — от start до end-1'
        ],
        example: 'for (i IN RANGE 5) {\n    press Down\n}\n\n# Использование счётчика:\nfor (i IN RANGE 1 25) {\n    wait js "return find_text().match(`Прогресс`).size() == `${i}`"\n}'
    },

    'break': {
        category: 'Управление потоком',
        syntax: 'break',
        description: 'Выход из текущего цикла.',
        params: [],
        example: 'for (i IN RANGE 10) {\n    if (check "Found") {\n        break\n    }\n}'
    },

    'continue': {
        category: 'Управление потоком',
        syntax: 'continue',
        description: 'Переход к следующей итерации цикла.',
        params: [],
        example: 'for (i IN RANGE 10) {\n    if (check "Skip") {\n        continue\n    }\n    print "Processing ${i}"\n}'
    },

    // === ИЗОБРАЖЕНИЯ ===

    'img': {
        category: 'Изображения',
        syntax: 'img "<path>"',
        description: 'Указывает изображение для поиска на экране. Используется в `wait`, `check`, `mouse`.',
        params: [
            '`path` — путь к файлу изображения'
        ],
        example: 'wait img "${IMG_DIR}/button.png"\nmouse click img "icon.png"'
    },

    // === ПЕРЕМЕННЫЕ ===

    'Динамические переменные': {
        category: 'Переменные',
        syntax: '$<VAR_NAME>',
        description: 'Динамические переменные — создаются в runtime из гостевой ОС.  \nОтличие от параметров: `${PARAM}` подставляется до запуска, `$<VAR>` — во время выполнения.',
        params: [
            '**Создание** (внутри `exec`):',
            '`testo-guest-additions-cli set VAR "value"`',
            '`--global` — доступна другим ВМ в этом тесте',
            '**Использование в:** `exec`, `wait`, `check`, `type`',
            '**Наследование:** переменные доступны в дочерних тестах'
        ],
        example: 'exec bash """\n    VER=$(uname -r)\n    testo-guest-additions-cli set KERNEL "$VER"\n"""\nprint "Ядро: $<KERNEL>"\n\n# Глобальная переменная между ВМ:\nvm1 { exec bash "testo-guest-additions-cli set IP 192.168.1.1 --global" }\nvm2 { wait "$<IP>" }'
    }
};

module.exports = builtinDocs;
