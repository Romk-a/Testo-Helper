В языке **Testo-lang** для управления виртуальными машинами используется специальный список идентификаторов клавиш. Эти идентификаторы позволяют эмулировать нажатие клавиш на клавиатуре при автоматизации тестов.

---

#### Основные клавиши

- **ESC**: Клавиша "Escape".
- **ENTER**: Клавиша "Enter".
- **SPACE**: Пробел.
- **TAB**: Клавиша "Tab".
- **BACKSPACE**: Клавиша "Backspace".

---

#### Числовые клавиши

- **ZERO**: Клавиша "0".
- **ONE**: Клавиша "1".
- **TWO**: Клавиша "2".
- **THREE**: Клавиша "3".
- **FOUR**: Клавиша "4".
- **FIVE**: Клавиша "5".
- **SIX**: Клавиша "6".
- **SEVEN**: Клавиша "7".
- **EIGHT**: Клавиша "8".
- **NINE**: Клавиша "9".

---

#### Буквенные клавиши

- **A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z**

---

#### Специальные символы

- **MINUS**: Клавиша "-".
- **EQUALSIGN**: Клавиша "=".
- **LEFTBRACE**: Клавиша "[".
- **RIGHTBRACE**: Клавиша "]".
- **SEMICOLON**: Клавиша ";".
- **APOSTROPHE**: Клавиша "'".
- **GRAVE**: Клавиша "`".
- **BACKSLASH**: Клавиша "\".
- **COMMA**: Клавиша ",".
- **DOT**: Клавиша ".".
- **SLASH**: Клавиша "/".
- **KP_ASTERISK**: Клавиша "*" на numeric keypad.

---

#### Модификаторы

- **LEFTCTRL**: Левый Control.
- **RIGHTCTRL**: Правый Control.
- **LEFTSHIFT**: Левый Shift.
- **RIGHTSHIFT**: Правый Shift.
- **LEFTALT**: Левый Alt.
- **RIGHTALT**: Правый Alt.
- **LEFTMETA**: Левая мета-клавиша (например, Windows или Command).
- **RIGHTMETA**: Правая мета-клавиша.

---

#### Функциональные клавиши

- **F1, F2, F3, ..., F12**: Функциональные клавиши.

---

#### Клавиши нумпада

- **KP_0**: Клавиша "0" на numeric keypad.
- **KP_1**: Клавиша "1" на numeric keypad.
- **KP_2**: Клавиша "2" на numeric keypad.
- **KP_3**: Клавиша "3" на numeric keypad.
- **KP_4**: Клавиша "4" на numeric keypad.
- **KP_5**: Клавиша "5" на numeric keypad.
- **KP_6**: Клавиша "6" на numeric keypad.
- **KP_7**: Клавиша "7" на numeric keypad.
- **KP_8**: Клавиша "8" на numeric keypad.
- **KP_9**: Клавиша "9" на numeric keypad.
- **KP_PLUS**: Клавиша "+" на numeric keypad.
- **KP_MINUS**: Клавиша "-" на numeric keypad.
- **KP_SLASH**: Клавиша "/" на numeric keypad.
- **KP_ASTERISK**: Клавиша "*" на numeric keypad.
- **KP_ENTER**: Клавиша "Enter" на numeric keypad.
- **KP_DOT**: Клавиша "." на numeric keypad.

---

#### Клавиши управления курсором

- **UP**: Клавиша "Arrow Up".
- **DOWN**: Клавиша "Arrow Down".
- **LEFT**: Клавиша "Arrow Left".
- **RIGHT**: Клавиша "Arrow Right".
- **PAGEUP**: Клавиша "Page Up".
- **PAGEDOWN**: Клавиша "Page Down".
- **HOME**: Клавиша "Home".
- **END**: Клавиша "End".

---

#### Дополнительные клавиши

- **INSERT**: Клавиша "Insert".
- **DELETE**: Клавиша "Delete".
- **CAPSLOCK**: Клавиша "Caps Lock".
- **NUMLOCK**: Клавиша "Num Lock".
- **SCROLLLOCK**: Клавиша "Scroll Lock".
- **SCROLLUP**: Скролл вверх.
- **SCROLLDOWN**: Скролл вниз.

---

### Пример использования

```testo
# Нажатие комбинации клавиш Ctrl + A
press LEFTCTRL A

# Ввод текста
type "Hello, World!"

# Нажатие Enter
press ENTER

# Нажатие клавиши Page Down
press PAGEDOWN
```

Этот список позволяет точно эмулировать любые действия с клавиатурой, необходимые для автоматизации тестирования виртуальных машин.