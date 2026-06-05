const snippetsReference = {
    'Циклы': [
        {
            prefix: 'forr',
            body: 'for (i IN RANGE N){\n\t...\n}',
            description: 'Цикл For с индексом i и циклом по N'
        },
        {
            prefix: 'fr',
            body: 'for (i IN RANGE 0 3){\n\t...\n}',
            description: 'Цикл for с переменной i для итерирования'
        }
    ],
    'Условия': [
        {
            prefix: 'ifc',
            body: 'if (check "Text" timeout 1s){\n\t...\n}',
            description: 'Условие if для поиска текста на экране'
        },
        {
            prefix: 'ifnc',
            body: 'if ( NOT (check "Text" timeout 1s)){\n\t...\n}',
            description: 'Обратное условие if для поиска текста на экране'
        },
        {
            prefix: 'ifs',
            body: 'if ("Text" STREQUAL "Text"){\n\t...\n}',
            description: 'Условие if для сравнения равенства строк'
        },
        {
            prefix: 'ifns',
            body: 'if ( NOT ("Text" STREQUAL "Text")){\n\t...\n}',
            description: 'Обратное условие if для сравнения равенства строк'
        }
    ],
    'Проверки': [
        {
            prefix: 'bugg',
            body: 'if (check "..." timeout 10s) {\n\tprint "Bug BT-XXXXX"\n}',
            description: 'Шаблон проверки и вывода бага с указанием номера'
        }
    ],
    'Клавиатура': [
        {
            prefix: 'altF',
            body: 'hold LEFTALT; press F4; release LEFTALT',
            description: 'Нажатие клавиш Alt + F*'
        },
        {
            prefix: 'altT',
            body: 'hold LEFTALT; press TAB; release LEFTALT',
            description: 'Нажатие клавиш Alt + Tab'
        },
        {
            prefix: 'winR',
            body: 'hold LEFTMETA; press R; release LEFTMETA',
            description: 'Нажатие клавиш Win + R'
        },
        {
            prefix: 'winD',
            body: 'hold LEFTMETA; press D; release LEFTMETA',
            description: 'Нажатие клавиш Win + D'
        }
    ],
    'Мышь: клик': [
        {
            prefix: 'mc',
            body: 'mouse click 0 0',
            description: 'ЛКМ по координатам'
        },
        {
            prefix: 'mc"',
            body: 'mouse click "Text"',
            description: 'ЛКМ по тексту'
        },
        {
            prefix: 'mci',
            body: 'mouse click img "IMG path"',
            description: 'ЛКМ по изображению'
        }
    ],
    'Мышь: двойной клик': [
        {
            prefix: 'mdc',
            body: 'mouse dclick 0 0',
            description: 'Двойной ЛКМ по координатам'
        },
        {
            prefix: 'mdc"',
            body: 'mouse dclick "Text"',
            description: 'Двойной ЛКМ по тексту'
        },
        {
            prefix: 'mdci',
            body: 'mouse dclick img "IMG path"',
            description: 'Двойной ЛКМ по изображению'
        }
    ],
    'Мышь: правый клик': [
        {
            prefix: 'mrc',
            body: 'mouse rclick 0 0',
            description: 'ПКМ по координатам'
        },
        {
            prefix: 'mrc"',
            body: 'mouse rclick "Text"',
            description: 'ПКМ по тексту'
        },
        {
            prefix: 'mrci',
            body: 'mouse rclick img "IMG path"',
            description: 'ПКМ по изображению'
        }
    ],
    'Мышь: перемещение': [
        {
            prefix: 'mm',
            body: 'mouse move 0 0',
            description: 'Перемещение курсора по координатам'
        },
        {
            prefix: 'mm"',
            body: 'mouse move "Text"',
            description: 'Перемещение курсора по тексту'
        },
        {
            prefix: 'mmi',
            body: 'mouse move img "IMG path"',
            description: 'Перемещение курсора по изображению'
        }
    ],
    'Ожидание': [
        {
            prefix: 'w',
            body: 'wait "Text"',
            description: 'Ожидание текста на экране'
        },
        {
            prefix: 'wi',
            body: 'wait img "IMG path"',
            description: 'Ожидание изображения на экране'
        },
        {
            prefix: 'wt',
            body: 'wait "Text" timeout 60s',
            description: 'Ожидание текста с параметром timeout'
        },
        {
            prefix: 'wit',
            body: 'wait img "IMG path" timeout 60s',
            description: 'Ожидание изображения с параметром timeout'
        }
    ]
};

module.exports = snippetsReference;
