<div align="center">
  <img src="images/cybersec.png" alt="CyberStrikeAI Logo" width="400">
</div>

# CyberStrikeAI

CyberStrikeAI — это **AI-нативная платформа для тестирования безопасности**, написанная на Go. Объединяет 116+ инструментов безопасности, интеллектуальный оркестратор, ролевое тестирование, систему навыков и полное управление жизненным циклом. Через нативный MCP-протокол и AI-агентов обеспечивает сквозную автоматизацию от диалогового интерфейса до обнаружения уязвимостей, анализа цепочек атак, работы с базой знаний и визуализации результатов.

---

## Интерфейс и интеграции

<div align="center">

### Дашборд системы

<img src="./images/dashboard.png" alt="System Dashboard" width="100%">

*Дашборд даёт полный обзор состояния системы: уязвимости, использование инструментов, база знаний — всё в одном месте.*

### Основные возможности

<table>
<tr>
<td width="33.33%" align="center">
<strong>Веб-консоль</strong><br/>
<img src="./images/web-console.png" alt="Web Console" width="100%">
</td>
<td width="33.33%" align="center">
<strong>Цепочка атаки</strong><br/>
<img src="./images/attack-chain.png" alt="Attack Chain" width="100%">
</td>
<td width="33.33%" align="center">
<strong>Управление задачами</strong><br/>
<img src="./images/task-management.png" alt="Task Management" width="100%">
</td>
</tr>
<tr>
<td width="33.33%" align="center">
<strong>Уязвимости</strong><br/>
<img src="./images/vulnerability-management.png" alt="Vulnerability Management" width="100%">
</td>
<td width="33.33%" align="center">
<strong>MCP управление</strong><br/>
<img src="./images/mcp-management.png" alt="MCP management" width="100%">
</td>
<td width="33.33%" align="center">
<strong>MCP stdio</strong><br/>
<img src="./images/mcp-stdio2.png" alt="MCP stdio mode" width="100%">
</td>
</tr>
<tr>
<td width="33.33%" align="center">
<strong>База знаний</strong><br/>
<img src="./images/knowledge-base.png" alt="Knowledge Base" width="100%">
</td>
<td width="33.33%" align="center">
<strong>Навыки</strong><br/>
<img src="./images/skills.png" alt="Skills Management" width="100%">
</td>
<td width="33.33%" align="center">
<strong>Роли</strong><br/>
<img src="./images/role-management.png" alt="Role Management" width="100%">
</td>
</tr>
</table>

</div>

---

## Ключевые возможности

- 🤖 **AI-движок** — OpenAI-совместимые модели (GPT, Claude, DeepSeek и др.); раздельный роутинг для tool-calling, суммаризации и основной логики
- 🔌 **Нативный MCP** — HTTP/stdio/SSE транспорты, встроенный MCP-сервер + федерация внешних MCP
- 🧰 **116+ готовых YAML-рецептов** инструментов с горячей перезагрузкой
- 📄 **Пагинация больших результатов** — данные свыше порога сохраняются на диск с пагинацией, фильтрацией и regex-поиском
- 🔗 **Граф цепочки атаки** — AI-парсинг узлов/рёбер с оценкой рисков и пошаговым воспроизведением
- 🔒 **Авторизация и аудит** — защищённый веб-интерфейс, Bearer-token сессии, SQLite-аудит
- 📚 **База знаний** — векторный поиск + **корпусный BM25 Okapi гибридный поиск** с настраиваемыми весами
- 🧠 **Персистентная память** — 8-категорийное SQLite-хранилище, переживает сжатие и перезапуски; агент помнит учётные данные, цели, находки, планы и запуски инструментов
- 🔍 **Интроспекция агента** — обязательный preflight-запрос к памяти и базе знаний перед каждым крупным действием
- ⏰ **Осведомлённость о времени** — текущая дата/время/часовой пояс в каждом системном промпте; инструмент `get_current_time` по требованию
- 📁 **Группы разговоров** — закрепление, переименование, пакетное управление
- 🛡️ **Управление уязвимостями** — CRUD, фильтрация по критичности/статусу, статистика
- 📋 **Пакетные задачи** — очереди с последовательным выполнением и полным отслеживанием
- 🎭 **Ролевое тестирование** — 14 предустановленных ролей с кастомными промптами и ограничениями инструментов
- 🎯 **Система навыков** — 24 предустановленных навыка; AI-агенты обращаются через `list_skills` / `read_skill`
- 📱 **Android VM (Cuttlefish)** — QEMU/KVM Android-устройство для тестирования мобильных приложений, реверс-инжиниринга APK, перехвата трафика; 16 MCP-инструментов; DroidRun AI-автоматизация
- 🔓 **SSLStrip MITM** — понижение HTTPS→HTTP для перехвата токенов/паролей; интеграция с прокси Cuttlefish
- 📂 **Файловый менеджер** — отслеживание файлов через разговоры (отчёты, exfil-данные, бинари, API-доки) с метаданными, журналом и статусом
- 🐳 **Docker lifecycle** — deploy/update/start/stop/restart/remove через UI или REST API
- 📡 **Чат-боты** — Telegram и Lark со стриминговым прогрессом (см. [Robot guide](docs/robot_en.md))
- 🌐 **Recon-интеграции** — FOFA, ZoomEye, Shodan, Censys с AI-помощником для составления запросов
- 🖥️ **Веб-терминал** — интерактивный PTY-терминал прямо в браузере через WebSocket

---

## Инструменты

CyberStrikeAI включает **116+ YAML-рецептов инструментов** покрывающих весь kill chain:

| Категория | Инструменты |
|-----------|------------|
| **Сетевые сканеры** | nmap, nmap-advanced, masscan, rustscan, arp-scan, nbtscan, autorecon |
| **Веб и приложения** | sqlmap, nikto, dirb, dirsearch, gobuster, feroxbuster, ffuf, wfuzz, zap, dotdotpwn, httpx |
| **Сканеры уязвимостей** | nuclei, nuclei-bitrix, wpscan, wafw00f, dalfox, xsser, jaeles, http-intruder |
| **Субдомены** | subfinder, amass, findomain, dnsenum, fierce |
| **OSINT и разведка** | gau, waybackurls, hakrawler, katana, paramspider, qsreplace, anew, uro, x8 |
| **Поиск в сети** | fofa_search, zoomeye_search |
| **API-безопасность** | graphql-scanner, arjun, api-fuzzer, api-schema-analyzer, jwt-analyzer |
| **Контейнеры** | trivy, clair, docker-bench-security, kube-bench, kube-hunter, falco |
| **Облачная безопасность** | prowler, scout-suite, cloudmapper, pacu, terrascan, checkov |
| **Бинарный анализ** | gdb, gdb-peda, radare2, ghidra, objdump, strings, binwalk, angr, checksec, xxd |
| **Эксплуатация** | metasploit, msfvenom, pwntools, ropper, ropgadget, one-gadget, pwninit, debix, libc-database |
| **Пароли и аутентификация** | hashcat, john, hashpump, hydra |
| **Сетевые атаки** | responder, smbmap, rpcclient, enum4linux, enum4linux-ng, netexec, impacket |
| **Форензика** | volatility, volatility3, foremost, steghide, exiftool |
| **Post-exploitation** | linpeas, winpeas, mimikatz, bloodhound |
| **CTF** | stegsolve, zsteg, hash-identifier, fcrackzip, pdfcrack, cyberchef, dnslog, bitrix-decrypt |
| **MITM / Прокси** | sslstrip, burpsuite, flaresolverr |
| **Системные** | exec, create-file, delete-file, modify-file, list-files, cat, install-python-package, execute-python-script |

---

## Быстрый старт

### Требования

- **Go 1.21+** ([Установить](https://go.dev/dl/))
- **Python 3.10+** ([Установить](https://www.python.org/downloads/))

### Один-командный запуск

```bash
git clone https://github.com/cybersecua/CyberStrikeAI.git
cd CyberStrikeAI
chmod +x run.sh && ./run.sh
```

`run.sh` автоматически:
- ✅ Проверяет окружение Go и Python
- ✅ Создаёт виртуальное Python-окружение (`venv/`)
- ✅ Устанавливает зависимости из `requirements.txt`
- ✅ Скачивает Go-модули
- ✅ Собирает бинарник (`cmd/server/main.go`)
- ✅ Запускает сервер

### Первоначальная настройка

1. **Настройте AI-провайдера** (обязательно перед первым использованием):
   - Откройте `http://localhost:8080` → `Settings` → заполните API-данные:
   ```yaml
   openai:
     api_key: "sk-your-key"
     base_url: "https://api.openai.com/v1"   # или DeepSeek, другой провайдер
     model: "gpt-4o"
   ```
   - Или отредактируйте `config.yaml` (скопируйте из `config.example.yaml`) перед запуском.

2. **Войдите в систему** — используйте автосгенерированный пароль из консоли, или задайте `auth.password` в `config.yaml`.

3. **Установите инструменты безопасности** (опционально; AI автоматически переключается на альтернативы):
   ```bash
   # macOS
   brew install nmap sqlmap nuclei httpx gobuster feroxbuster subfinder amass
   # Ubuntu/Debian
   sudo apt-get install nmap sqlmap
   ```

### Альтернативные способы запуска

```bash
# Прямой запуск через Go
go run cmd/server/main.go

# Сборка и запуск бинарника
go build -o cyberstrike-ai cmd/server/main.go
./cyberstrike-ai

# Кастомный путь к конфигу
./cyberstrike-ai --config /path/to/config.yaml
```

---

## Docker-развёртывание

### Docker Compose (рекомендуется)

```bash
# Сборка и запуск
./run_docker.sh deploy

# Обновление до последней версии
./run_docker.sh update

# Управление жизненным циклом
./run_docker.sh start | stop | restart | status | logs | remove | test

# С прокси
./run_docker.sh deploy --proxy-mode socks --proxy-url socks5h://127.0.0.1:1080
./run_docker.sh deploy --proxy-mode vpn --vpn-container my-vpn
./run_docker.sh update --git-ref v1.5.0
```

Порты по умолчанию: `18080` (HTTP UI), `18081` (MCP). Переопределите через `DOCKER_HTTP_PORT` / `DOCKER_MCP_PORT`.

### Docker API

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/docker/status` | Статус контейнера, версия compose, HTTP health-пробы |
| `GET` | `/api/docker/logs?lines=200` | Последние N строк логов контейнера |
| `POST` | `/api/docker/action` | Действие: `deploy`, `update`, `start`, `stop`, `restart`, `remove`, `test` |

```json
{
  "action": "update",
  "proxy_mode": "direct",
  "proxy_url": "",
  "vpn_container": "",
  "git_ref": "main"
}
```

Подробности — в [Docker Guide](docs/docker_en.md).

---

## Основные рабочие процессы

| Процесс | Описание |
|---------|----------|
| **Диалоговое тестирование** | Промпты на естественном языке запускают AI-оркестрированные цепочки инструментов со SSE-стримингом |
| **Ролевое тестирование** | 14 предустановленных ролей настраивают поведение AI и доступные инструменты |
| **Монитор инструментов** | Задания, логи выполнения, статистика вызовов, большие артефакты |
| **История и аудит** | Каждый разговор и вызов инструмента сохранены в SQLite с возможностью воспроизведения |
| **Группы разговоров** | Организация в группы; закрепление, переименование, пакетное удаление |
| **Управление уязвимостями** | CRUD с фильтрацией по критичности/статусу/разговору; экспорт находок |
| **Пакетные задачи** | Очереди задач с последовательным выполнением, паузой и полным отслеживанием |
| **Цепочка атаки** | Интерактивный граф с оценкой рисков и пошаговым воспроизведением |
| **База знаний** | Вектор + BM25 гибридный поиск по Markdown-файлам; автоиндексирование |
| **Персистентная память** | Кросс-сессионное хранилище; агент помнит учётные данные и цели через перезапуски |
| **OSINT / Разведка** | Единый UI для FOFA, ZoomEye, Shodan, Censys с AI-парсером запросов |
| **Веб-терминал** | Браузерный интерактивный PTY-терминал через WebSocket |
| **Файловый менеджер** | Загрузка и отслеживание файлов (отчёты, бинари, exfil-данные, API-доки) |
| **Android VM** | Cuttlefish для тестирования мобильных приложений и перехвата трафика |
| **Чат-боты** | Управление платформой с телефона через Telegram или Lark |

---

## Ролевое тестирование

### Предустановленные роли (14)

| Роль | Описание |
|------|----------|
| Penetration Testing | Полный пентест: разведка, эксплуатация, post-exploitation |
| CTF | CTF-утилиты (стего, крипто, pwn, реверсинг, веб) |
| Web Application Scanning | Оценка безопасности веб-приложений (SQLi, XSS, CSRF и др.) |
| API Security Testing | Тестирование REST/GraphQL/gRPC API |
| Binary Analysis | Реверс-инжиниринг и бинарная эксплуатация |
| Cloud Security Audit | Аудит облачной инфраструктуры |
| Container Security | Docker/Kubernetes security assessment |
| Digital Forensics | Форензика памяти и анализ артефактов |
| Information Gathering | Пассивная/активная разведка и OSINT |
| Post-Exploitation Testing | Post-compromise операции и lateral movement |
| Comprehensive Vulnerability Scan | Широкое многовекторное сканирование |
| Web Framework Testing | Тестирование специфичных уязвимостей фреймворков |
| Default | Универсальное тестирование безопасности |

### Формат конфигурации роли

```yaml
name: Penetration Testing
description: Professional penetration testing expert
user_prompt: You are a professional cybersecurity penetration testing expert...
icon: "🎯"
tools:
  - nmap
  - sqlmap
  - nuclei
  - metasploit
  - record_vulnerability
  - search_knowledge_base
skills:
  - sql-injection-testing
  - xss-testing
enabled: true
```

### Создание кастомной роли

1. Создайте `roles/my-role.yaml` с полями выше.
2. Перезапустите сервер — роль появится в выпадающем списке.
3. Или управляйте через REST API (`/api/roles`).

---

## Система навыков

### Предустановленные навыки (24)

| Директория навыка | Область |
|------------------|---------|
| `sql-injection-testing` | SQL-инъекции |
| `xss-testing` | Межсайтовый скриптинг |
| `api-security-testing` | Безопасность API |
| `cloud-security-audit` | Облачные конфигурации |
| `container-security-testing` | Docker/Kubernetes |
| `network-penetration-testing` | Сетевые атаки |
| `mobile-app-security-testing` | Мобильные приложения |
| `android-reverse-engineering` | Реверсинг APK |
| `binary-analysis` | Бинарная эксплуатация |
| `vulnerability-assessment` | Общая оценка уязвимостей |
| `web-app-scanning` | Сканирование веб-приложений |
| `web-framework-testing` | Тестирование фреймворков |
| `command-injection-testing` | Инъекция ОС-команд |
| `ssrf-testing` | SSRF |
| `csrf-testing` | CSRF |
| `idor-testing` | IDOR |
| `file-upload-testing` | Загрузка файлов |
| `deserialization-testing` | Десериализация |
| `xxe-testing` | XXE-инъекция |
| `xpath-injection-testing` | XPath-инъекция |
| `ldap-injection-testing` | LDAP-инъекция |
| `business-logic-testing` | Бизнес-логика |
| `secure-code-review` | Ревью кода |
| `incident-response` | Реагирование на инциденты |
| `security-automation` | Автоматизация |
| `security-awareness-training` | Обучение безопасности |
| `bitrix24-webhook-exploitation` | Эксплуатация Bitrix24 |

### Как работают навыки

- Навыки — это директории в `skills/`, каждая содержит `SKILL.md`.
- При выборе роли имена навыков добавляются как подсказки в системный промпт.
- AI-агент обращается к содержимому навыков по требованию через `list_skills` / `read_skill`.
- Статистика использования навыков отслеживается в таблице `skill_stats`.

### Создание кастомного навыка

```
skills/
└── my-custom-skill/
    └── SKILL.md    ← Полный Markdown с методами, инструментами, примерами
```

---

## MCP (Model Context Protocol)

### Встроенный MCP-сервер

Платформа включает встроенный MCP-сервер с тремя транспортами:

| Транспорт | Эндпоинт | Использование |
|-----------|----------|---------------|
| **HTTP** | `http://<host>:8081/mcp` | API-интеграции, внешние клиенты |
| **SSE** | `http://<host>:8081/sse` | Стриминг в реальном времени |
| **stdio** | `cmd/mcp-stdio/main.go` | Cursor/IDE интеграция |

### MCP stdio — быстрый старт (Cursor)

```bash
# Собрать бинарник
go build -o cyberstrike-ai-mcp cmd/mcp-stdio/main.go
```

Добавьте в `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "cyberstrike-ai": {
      "command": "/absolute/path/to/cyberstrike-ai-mcp",
      "args": ["--config", "/absolute/path/to/config.yaml"]
    }
  }
}
```

### MCP HTTP — быстрый старт (Cursor)

```json
{
  "mcpServers": {
    "cyberstrike-ai-http": {
      "transport": "http",
      "url": "http://127.0.0.1:8081/mcp"
    }
  }
}
```

### Федерация внешних MCP

Зарегистрируйте сторонние MCP-серверы через **Settings → External MCP**:

**HTTP:**
```json
{
  "my-http-mcp": {
    "transport": "http",
    "url": "http://127.0.0.1:9000/mcp",
    "description": "Кастомный HTTP MCP",
    "timeout": 30
  }
}
```

**stdio:**
```json
{
  "my-stdio-mcp": {
    "command": "python3",
    "args": ["/path/to/mcp-server.py"],
    "env": {"API_KEY": "xxx"},
    "description": "stdio MCP сервер",
    "timeout": 30
  }
}
```

**SSE:**
```json
{
  "my-sse-mcp": {
    "transport": "sse",
    "url": "http://127.0.0.1:9001/sse",
    "description": "SSE MCP сервер",
    "timeout": 30
  }
}
```

**Ghidra Headless MCP** (212 инструментов реверс-инжиниринга):
```yaml
ghidra-headless-mcp:
  transport: stdio
  command: bash
  args: ["scripts/ghidra/start-ghidra-mcp.sh"]
  env:
    GHIDRA_INSTALL_DIR: "/opt/ghidra"
  description: "212 Ghidra инструментов: декомпиляция, дизассемблирование, xrefs, патчинг"
  timeout: 600
```

---

## Персистентная память

### Категории памяти

| Категория | Назначение |
|-----------|-----------|
| `credential` | Обнаруженные пароли, токены, API-ключи, секреты |
| `target` | IP-адреса, домены, порты сервисов, область тестирования |
| `vulnerability` | Заметки об эксплойтах, CVE-ссылки, payload-детали |
| `fact` | Общие наблюдения и разведывательная информация |
| `note` | Оперативные напоминания и заметки планирования |
| `tool_run` | Записи о выполненных инструментах (автосохранение для предотвращения дублей) |
| `discovery` | Находки, требующие дальнейшего исследования |
| `plan` | Планы действий и статус выполнения шагов |

### Статусы записей памяти

| Статус | Смысл |
|--------|-------|
| `active` | Дефолтный статус для новых записей |
| `confirmed` | Находка проверена и воспроизведена |
| `false_positive` | Расследовано и исключено |
| `disproven` | Факт оказался неверным после дополнительного исследования |

### Уровни достоверности

`high` | `medium` | `low`

### Инструменты памяти для AI-агента

| Инструмент | Описание |
|-----------|----------|
| `store_memory` | Сохранить пару ключ/значение с категорией, статусом и достоверностью |
| `retrieve_memory` | Поиск записей по тексту запроса и категории |
| `list_memories` | Список всех записей, с фильтрацией по категории |
| `delete_memory` | Удалить запись по ID |

### Пример инъекции в системный промпт

```
[CREDENTIALS]
  • admin_password: P@ssw0rd123 (confidence: high)
[TARGETS]
  • main_target: 192.168.1.100 (Apache 2.4, port 80/443)
[VULNERABILITIES]
  • sqli_endpoint: /login.php?id= is injectable (union-based)
[TOOL_RUNS]
  • nmap_192.168.1.100: завершён 2026-03-13, найдено 5 открытых портов
```

### Настройка

```yaml
agent:
  memory:
    enabled: true
    max_entries: 2000   # 0 = без ограничений
```

Подробности — в [Memory Guide](docs/memory_en.md).

---

## Осведомлённость о времени

Агент автоматически получает текущую дату, время, часовой пояс и время жизни сессии в каждом системном промпте.

### Инструмент времени

| Инструмент | Описание |
|-----------|----------|
| `get_current_time` | Возвращает текущие дату/время, часовой пояс, Unix timestamp и uptime сессии |

### Настройка

```yaml
agent:
  time_awareness:
    enabled: true
    timezone: "UTC"    # IANA: "Europe/Moscow", "America/New_York", "Asia/Tokyo"
```

### Формат инжектируемого блока

```
<time_context>
  Current date and time : 2026-03-13 14:30:00 UTC
  Day of week           : Friday
  Unix timestamp        : 1741875000
  Session age           : 2h 15m 30s
</time_context>
```

---

## Интроспекция агента

Перед каждым крупным действием агент выполняет обязательный preflight-проход:

1. **Проверка похожести памяти** — извлекает семантически похожие записи + entity-матчинг (IP, домены), раскрывая прошлые учётные данные, результаты инструментов и известные уязвимости.
2. **Preflight базы знаний** — фокусированный KB-запрос, совмещающий запрос пользователя с пентест-терминологией.
3. **Контекстуальное решение** — агент использует полученный контекст для выбора инструментов, избегая повторных сканирований.

Результат инжектируется как блок `<memory_similarity_context>` в системный промпт перед каждым ходом агента.

---

## Android VM (Cuttlefish)

Полноценное виртуальное Android-устройство (AOSP) на QEMU/KVM:
- Тестирование безопасности мобильных приложений
- Реверс-инжиниринг APK и динамический анализ
- Перехват трафика (совместно с SSLStrip)
- DroidRun AI-автоматизация UI

**16 MCP-инструментов:** `launch_cuttlefish`, `stop_cuttlefish`, `cuttlefish_status`, `adb_shell`, `install_apk`, `screenshot`, `start_frida_server`, `frida_attach`, `set_proxy`, `install_cert`, `take_snapshot`, `restore_snapshot`, `droidrun_start`, `droidrun_stop`, `droidrun_status` и др.

### Настройка Cuttlefish

```yaml
agent:
  cuttlefish:
    enabled: false
    cvd_home: ""                    # по умолч.: ~/cuttlefish-workspace
    memory_mb: 8192                 # ОЗУ VM (МБ)
    cpus: 4                         # Виртуальные CPU
    disk_mb: 16000                  # Размер раздела данных (МБ)
    gpu_mode: guest_swiftshader     # или drm_virgl для аппаратного ускорения
    auto_launch: false              # Автозапуск VM при старте сервера
    webrtc_port: 8443               # Экран VM по https://localhost:8443
    droidrun_path: ""               # по умолч.: ~/droidrun
    proxy_port: 18090               # HTTP-порт DroidRun прокси
    proxy_auto_start: true
    vision_enabled: true            # Скриншоты для VL-моделей
```

**Установка:** запустите `scripts/cuttlefish/setup.sh`.

---

## SSLStrip MITM

Инструмент для понижения HTTPS → HTTP:

- Перехватывает пароли, токены сессий, API-ключи, cookie в открытом виде
- Работает отдельно или совместно с Cuttlefish (авто-маршрутизация трафика Android VM)
- Требует: `iptables`, IP-forwarding, сетевая позиция (ARP-спуфинг / rogue AP)

### Настройка SSLStrip

```yaml
agent:
  sslstrip:
    enabled: false
    listen_port: 10000
    log_dir: /tmp
    auto_proxy: false    # Авто-настройка прокси Cuttlefish при запуске инструмента
```

---

## Файловый менеджер

Отслеживание файлов через разговоры с полными метаданными и статус-машиной.

### Типы файлов

| Тип | Описание |
|-----|----------|
| `report` | Вывод внешних инструментов, результаты сканирований |
| `api_docs` | Документация API |
| `project_file` | Файлы тестируемого проекта |
| `target_file` | Файлы, полученные от цели |
| `reversing` | Бинари для реверс-инжиниринга |
| `exfiltrated` | Exfiltrated-данные |
| `other` | Прочее |

### Статусы файлов

`pending` → `processing` → `analyzed` → `in_progress` → `completed` → `archived`

### MCP-инструменты файлового менеджера

`register_file`, `update_file`, `list_files`, `get_file`, `append_file_log`, `append_file_findings`

**Вложения в чате автоматически регистрируются** в файловом менеджере.

### Настройка

```yaml
agent:
  file_manager:
    enabled: true
    storage_dir: managed_files
```

---

## База знаний

### Установка

```yaml
knowledge:
  enabled: true
  base_path: knowledge_base
  embedding:
    provider: openai
    model: text-embedding-3-small
    base_url: ""      # наследует от openai.base_url
    api_key: ""       # наследует от openai.api_key
    max_tokens: 0     # размер чанка (0 = по умолч. 512)
  retrieval:
    top_k: 5
    similarity_threshold: 0.7
    hybrid_weight: 0.7    # 1.0 = чистый вектор, 0.0 = чистый BM25
```

### Структура файлов

```
knowledge_base/
├── SQL Injection/
│   └── README.md          # первый уровень директории = категория
├── XSS/
│   └── README.md
└── Cloud Security/
    └── misconfigurations.md
```

### Быстрый старт

Скачайте готовый `knowledge.db` из [GitHub Releases](https://github.com/cybersecua/CyberStrikeAI/releases) и положите в `data/`.

### Возможности поиска

- **Векторный поиск** — косинусное сходство через OpenAI embeddings
- **BM25 Okapi** — корпусный IDF-скоринг по всем индексированным чанкам
- **Гибридный скоринг** — смешивание вектора + BM25 через `hybrid_weight`
- **Авто-инкрементальное обновление** — изменённые файлы переиндексируются автоматически
- **Журнал поиска** — каждый запрос логируется для аудита

### MCP-инструменты для AI-агента

| Инструмент | Описание |
|-----------|----------|
| `search_knowledge_base` | Гибридный поиск вектор + BM25 |
| `list_knowledge_risk_types` | Список всех категорий знаний |

---

## Recon / OSINT интеграции

Страница **Information Gathering** предоставляет единый UI поиска:

| Движок | Поле конфига | Описание |
|--------|-------------|----------|
| FOFA | `fofa.email` + `fofa.api_key` | Поиск интернет-активов |
| ZoomEye | `zoomeye.api_key` | Поиск в киберпространстве |
| Shodan | `shodan.api_key` | Поиск подключённых устройств |
| Censys | `censys.api_id` + `censys.api_secret` | База данных интернет-сканирования |

**Особенности:**
- Ключи API проксируются через бэкенд — никогда не раскрываются на фронтенде
- **AI-парсер запросов** (`/api/fofa/parse`) — конвертирует запрос на естественном языке в синтаксис FOFA с предварительным просмотром перед отправкой
- Валидация ключей API (`/validate` эндпоинты) — проверка корректности перед использованием
- Ключи задаются через переменные окружения (`FOFA_EMAIL`, `FOFA_API_KEY`) или Settings UI

---

## Чат-боты

### Telegram

- Long-polling с поддержкой нескольких пользователей (независимые сессии на каждый user ID)
- Стриминг прогресса в реальном времени (сообщение редактируется по мере выполнения)
- Смена роли командой `/role <name>`
- Белый список пользователей через `allowed_user_ids`
- Поддержка групп (ответ на @ упоминания)

```yaml
robots:
  telegram:
    enabled: true
    bot_token: "123456:ABC-..."
    allowed_user_ids: [123456789]    # пусто = разрешить всем
```

### Lark (Feishu)

- Постоянное долгосрочное соединение через Lark SDK
- Подписка на события с токеном верификации

```yaml
robots:
  lark:
    enabled: true
    app_id: "cli_xxx"
    app_secret: "xxx"
    verify_token: "xxx"
```

Подробности — в [Robot Guide](docs/robot_en.md).

---

## Полный справочник REST API

> Все маршруты, кроме `/api/health`, `/api/auth/login` и `/api/robot/lark`, требуют Bearer-токен (`Authorization: Bearer <token>`).

### Служебные

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/health` | Состояние системы, статистика MCP (без авторизации) |

### Авторизация

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/api/auth/login` | Вход, возвращает Bearer-токен |
| `POST` | `/api/auth/logout` | Выход |
| `POST` | `/api/auth/change-password` | Смена пароля |
| `GET` | `/api/auth/validate` | Проверка токена |

### AI-агент

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/api/agent-loop` | Запуск агента (синхронный) |
| `POST` | `/api/agent-loop/stream` | Запуск агента (SSE-стриминг) |
| `POST` | `/api/agent-loop/cancel` | Отмена выполняющегося агента |
| `GET` | `/api/agent-loop/tasks` | Список активных задач |
| `GET` | `/api/agent-loop/tasks/completed` | Список завершённых задач |

### Разговоры

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/api/conversations` | Создать разговор |
| `GET` | `/api/conversations` | Список разговоров |
| `GET` | `/api/conversations/:id` | Получить разговор |
| `PUT` | `/api/conversations/:id` | Обновить разговор (название) |
| `DELETE` | `/api/conversations/:id` | Удалить разговор |
| `PUT` | `/api/conversations/:id/pinned` | Закрепить / открепить |
| `GET` | `/api/conversations/:id/results` | Полные результаты разговора (для OpenAPI) |

### Группы разговоров

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/api/groups` | Создать группу |
| `GET` | `/api/groups` | Список групп |
| `GET` | `/api/groups/:id` | Получить группу |
| `PUT` | `/api/groups/:id` | Обновить группу (название, иконка) |
| `DELETE` | `/api/groups/:id` | Удалить группу |
| `PUT` | `/api/groups/:id/pinned` | Закрепить / открепить группу |
| `GET` | `/api/groups/:id/conversations` | Разговоры в группе |
| `POST` | `/api/groups/conversations` | Добавить разговор в группу |
| `DELETE` | `/api/groups/:id/conversations/:conversationId` | Убрать разговор из группы |
| `PUT` | `/api/groups/:id/conversations/:conversationId/pinned` | Закрепить разговор в группе |

### Пакетные задачи

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/api/batch-tasks` | Создать очередь задач |
| `GET` | `/api/batch-tasks` | Список очередей |
| `GET` | `/api/batch-tasks/:queueId` | Получить очередь |
| `POST` | `/api/batch-tasks/:queueId/start` | Запустить выполнение |
| `POST` | `/api/batch-tasks/:queueId/pause` | Поставить на паузу |
| `DELETE` | `/api/batch-tasks/:queueId` | Удалить очередь |
| `POST` | `/api/batch-tasks/:queueId/tasks` | Добавить задачу |
| `PUT` | `/api/batch-tasks/:queueId/tasks/:taskId` | Обновить задачу |
| `DELETE` | `/api/batch-tasks/:queueId/tasks/:taskId` | Удалить задачу |

### Уязвимости

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/vulnerabilities` | Список (фильтр по severity/status/conversation) |
| `GET` | `/api/vulnerabilities/stats` | Статистика |
| `GET` | `/api/vulnerabilities/:id` | Получить уязвимость |
| `POST` | `/api/vulnerabilities` | Создать |
| `PUT` | `/api/vulnerabilities/:id` | Обновить |
| `DELETE` | `/api/vulnerabilities/:id` | Удалить |

### Роли

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/roles` | Список всех ролей |
| `GET` | `/api/roles/:name` | Получить роль |
| `GET` | `/api/roles/skills/list` | Список навыков, привязанных к ролям |
| `POST` | `/api/roles` | Создать роль |
| `PUT` | `/api/roles/:name` | Обновить роль |
| `DELETE` | `/api/roles/:name` | Удалить роль |

### Навыки (Skills)

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/skills` | Список всех навыков |
| `GET` | `/api/skills/stats` | Статистика использования навыков |
| `DELETE` | `/api/skills/stats` | Очистить всю статистику навыков |
| `GET` | `/api/skills/:name` | Получить навык и его содержимое |
| `GET` | `/api/skills/:name/bound-roles` | Роли, использующие навык |
| `POST` | `/api/skills` | Создать навык |
| `PUT` | `/api/skills/:name` | Обновить навык |
| `DELETE` | `/api/skills/:name` | Удалить навык |
| `DELETE` | `/api/skills/:name/stats` | Очистить статистику конкретного навыка |

### Монитор инструментов

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/monitor` | Список выполнений инструментов |
| `GET` | `/api/monitor/execution/:id` | Получить конкретное выполнение |
| `DELETE` | `/api/monitor/execution/:id` | Удалить запись выполнения |
| `DELETE` | `/api/monitor/executions` | Удалить все записи выполнений |
| `GET` | `/api/monitor/stats` | Агрегированная статистика инструментов |

### Конфигурация

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/config` | Получить текущую конфигурацию |
| `GET` | `/api/config/tools` | Список зарегистрированных инструментов |
| `POST` | `/api/config/models` | Обнаружение доступных AI-моделей |
| `PUT` | `/api/config` | Обновить конфигурацию |
| `POST` | `/api/config/apply` | Применить конфигурацию без перезапуска |

### Терминал

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/api/terminal/run` | Выполнить команду (синхронно) |
| `POST` | `/api/terminal/run/stream` | Выполнить команду (SSE-стриминг) |
| `GET` | `/api/terminal/ws` | Интерактивный WebSocket PTY-терминал |

### Внешний MCP

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/external-mcp` | Список внешних MCP-серверов |
| `GET` | `/api/external-mcp/stats` | Статистика внешних MCP (инструменты, здоровье) |
| `GET` | `/api/external-mcp/:name` | Получить конкретный внешний MCP |
| `PUT` | `/api/external-mcp/:name` | Добавить или обновить внешний MCP |
| `DELETE` | `/api/external-mcp/:name` | Удалить внешний MCP |
| `POST` | `/api/external-mcp/:name/start` | Запустить соединение |
| `POST` | `/api/external-mcp/:name/stop` | Остановить соединение |

### Цепочка атаки

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/attack-chain/:conversationId` | Получить граф цепочки атаки |
| `POST` | `/api/attack-chain/:conversationId/regenerate` | Перегенерировать цепочку атаки |

### База знаний

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/knowledge/categories` | Список категорий |
| `GET` | `/api/knowledge/stats` | Статистика (кол-во категорий, элементов) |
| `GET` | `/api/knowledge/index-status` | Статус индексирования |
| `GET` | `/api/knowledge/items` | Список элементов базы знаний |
| `GET` | `/api/knowledge/items/:id` | Получить элемент |
| `POST` | `/api/knowledge/items` | Создать элемент |
| `PUT` | `/api/knowledge/items/:id` | Обновить элемент |
| `DELETE` | `/api/knowledge/items/:id` | Удалить элемент |
| `POST` | `/api/knowledge/scan` | Сканировать директорию и импортировать файлы |
| `POST` | `/api/knowledge/index` | Перестроить векторный индекс |
| `GET` | `/api/knowledge/retrieval-logs` | Журнал поисковых запросов |
| `DELETE` | `/api/knowledge/retrieval-logs/:id` | Удалить запись журнала |
| `POST` | `/api/knowledge/search` | Поиск по базе знаний |

### Персистентная память

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/memories` | Список записей памяти (с пагинацией и фильтрами) |
| `GET` | `/api/memories/stats` | Статистика по памяти |
| `POST` | `/api/memories` | Создать запись |
| `PUT` | `/api/memories/:id` | Обновить запись |
| `PATCH` | `/api/memories/:id/status` | Изменить статус записи |
| `DELETE` | `/api/memories` | Удалить все записи |
| `DELETE` | `/api/memories/:id` | Удалить запись по ID |

### Файловый менеджер

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/files` | Список файлов |
| `GET` | `/api/files/stats` | Статистика файлов (кол-во, размер, по типу/статусу) |
| `GET` | `/api/files/:id` | Получить метаданные файла |
| `GET` | `/api/files/:id/content` | Прочитать содержимое файла |
| `POST` | `/api/files/upload` | Загрузить файл (multipart) |
| `POST` | `/api/files/register` | Зарегистрировать существующий файл |
| `PUT` | `/api/files/:id` | Обновить метаданные файла |
| `POST` | `/api/files/:id/log` | Добавить запись в журнал файла |
| `POST` | `/api/files/:id/findings` | Добавить находки к файлу |
| `DELETE` | `/api/files/:id` | Удалить файл |

### FOFA (Разведка)

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/api/fofa/search` | Поиск FOFA (backend-прокси) |
| `POST` | `/api/fofa/parse` | AI-парсинг запроса на естественном языке → синтаксис FOFA |

### Recon (Multi-engine)

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/api/recon/fofa/validate` | Валидация FOFA API-ключа |
| `POST` | `/api/recon/zoomeye/search` | Поиск ZoomEye |
| `POST` | `/api/recon/zoomeye/validate` | Валидация ZoomEye API-ключа |
| `POST` | `/api/recon/shodan/search` | Поиск Shodan |
| `POST` | `/api/recon/shodan/validate` | Валидация Shodan API-ключа |
| `POST` | `/api/recon/censys/search` | Поиск Censys |
| `POST` | `/api/recon/censys/validate` | Валидация Censys API-ключа |

### Robot / Чат-боты

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/api/robot/lark` | Webhook для входящих событий Lark (без авторизации) |
| `POST` | `/api/robot/test` | Тестовый вызов логики бота |

### Docker

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/docker/status` | Статус контейнера и HTTP health-пробы |
| `GET` | `/api/docker/logs?lines=200` | Логи контейнера |
| `POST` | `/api/docker/action` | Lifecycle-действие |

### OpenAPI

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/api/openapi/spec` | OpenAPI-спецификация (JSON) |
| `GET` | `/api-docs` | Документация API (HTML-страница) |

---

## Полный справочник конфигурации

```yaml
# ─── Версия системы ───────────────────────────────────────────────────────────
version: "v1.4.0"

# ─── Сервер ──────────────────────────────────────────────────────────────────
server:
  host: "0.0.0.0"
  port: 8080

# ─── Авторизация ─────────────────────────────────────────────────────────────
auth:
  password: "change-me"           # Автогенерируется если пустой (24-символьный случайный)
  session_duration_hours: 12

# ─── Логирование ─────────────────────────────────────────────────────────────
log:
  level: "info"                   # debug | info | warn | error
  output: "stdout"                # stdout | stderr | /path/to/file

# ─── AI-провайдер ────────────────────────────────────────────────────────────
openai:
  api_key: "sk-xxx"
  base_url: "https://api.openai.com/v1"
  model: "gpt-4o"                 # Основная модель
  tool_model: ""                  # Модель для tool-calling (fallback к model)
  tool_base_url: ""               # Отдельный эндпоинт для tool-модели
  tool_api_key: ""                # Отдельный ключ для tool-модели
  summary_model: ""               # Модель для суммаризации (fallback к model)
  summary_base_url: ""
  summary_api_key: ""
  max_total_tokens: 120000        # Токен-бюджет для сжатия памяти + цепочки атак

# ─── Recon движки ────────────────────────────────────────────────────────────
fofa:
  email: ""
  api_key: ""
  base_url: "https://fofa.info/api/v1/search/all"

zoomeye:
  api_key: ""

shodan:
  api_key: ""

censys:
  api_id: ""
  api_secret: ""

# ─── MCP сервер ──────────────────────────────────────────────────────────────
mcp:
  enabled: true
  host: "0.0.0.0"
  port: 8081
  allow_remote: false             # true — только если намеренно открываете за localhost

# ─── Федерация внешних MCP ───────────────────────────────────────────────────
external_mcp:
  servers:
    my-server:
      transport: "http"           # http | sse | stdio | simple_http
      url: "http://127.0.0.1:9000/mcp"
      command: ""                 # Для stdio: путь к исполняемому файлу
      args: []                    # Для stdio: аргументы
      env: {}                     # Для stdio: переменные окружения
      headers: {}                 # Для http/sse: заголовки запросов
      description: "Мой MCP сервер"
      timeout: 30
      external_mcp_enable: true
      tool_enabled: {}            # Переопределение по инструментам: {"tool_name": true/false}

# ─── База данных ─────────────────────────────────────────────────────────────
database:
  path: "data/conversations.db"
  knowledge_db_path: "data/knowledge.db"    # Опционально: отдельная БД для знаний

# ─── Инструменты безопасности ────────────────────────────────────────────────
security:
  tools_dir: "tools"                        # Директория YAML-рецептов инструментов
  tool_description_mode: "full"             # full | short (контроль использования токенов)

# ─── Роли и навыки ───────────────────────────────────────────────────────────
roles_dir: "roles"
skills_dir: "skills"

# ─── Агент ───────────────────────────────────────────────────────────────────
agent:
  max_iterations: 120
  large_result_threshold: 102400            # байт; результаты крупнее сохраняются на диск
  result_storage_dir: "tmp"
  parallel_tool_execution: true
  max_parallel_tools: 10                    # 0 = без ограничений
  tool_retry_count: 5                       # Повторы при временных ошибках
  parallel_tool_wait_seconds: 60            # Макс. ожидание параллельного инструмента
  tool_timeout: 300                         # Таймаут выполнения инструмента (сек.)

  time_awareness:
    enabled: true
    timezone: "UTC"                         # IANA-имя часового пояса

  memory:
    enabled: true
    max_entries: 2000                       # 0 = без ограничений

  file_manager:
    enabled: true
    storage_dir: "managed_files"

  cuttlefish:
    enabled: false
    cvd_home: ""                            # по умолч.: ~/cuttlefish-workspace
    memory_mb: 8192
    cpus: 4
    disk_mb: 16000
    gpu_mode: "guest_swiftshader"           # или drm_virgl
    auto_launch: false
    russian_identity: false
    webrtc_port: 8443
    droidrun_path: ""
    droidrun_config: ""
    bridge_script: ""
    proxy_port: 18090
    proxy_auto_start: true
    screenshot_dir: "/tmp/droidrun_screenshots"
    vision_enabled: true

  sslstrip:
    enabled: false
    listen_port: 10000
    log_dir: "/tmp"
    auto_proxy: false

# ─── База знаний ─────────────────────────────────────────────────────────────
knowledge:
  enabled: true
  base_path: "knowledge_base"
  embedding:
    provider: "openai"
    model: "text-embedding-3-small"
    base_url: ""                            # наследует от openai.base_url
    api_key: ""                             # наследует от openai.api_key
    max_tokens: 0                           # размер чанка (0 = по умолч. 512)
  retrieval:
    top_k: 5
    similarity_threshold: 0.7
    hybrid_weight: 0.7                      # 1.0 = чистый вектор, 0.0 = чистый BM25

# ─── Чат-боты ────────────────────────────────────────────────────────────────
robots:
  telegram:
    enabled: false
    bot_token: ""
    allowed_user_ids: []                    # пусто = разрешить всем

  lark:
    enabled: false
    app_id: ""
    app_secret: ""
    verify_token: ""
```

---

## Формат YAML-рецепта инструмента (`tools/*.yaml`)

```yaml
name: "nmap"
command: "nmap"
args: ["-sT", "-sV", "-sC"]         # Фиксированные аргументы
enabled: true
short_description: "Сетевое сканирование и идентификация сервисов"
description: "Подробное описание для AI-агента..."
allowed_exit_codes: [0]              # Ненулевые коды, считающиеся успехом
arg_mapping: "auto"                  # auto | manual | template
parameters:
  - name: "target"
    type: "string"                   # string | int | bool | array
    description: "IP или домен для сканирования"
    required: true
    position: 0                      # Индекс позиционного аргумента
  - name: "ports"
    type: "string"
    flag: "-p"
    description: "Диапазон портов, напр. 1-1000"
    format: "combined"               # flag=value | positional | combined | template
  - name: "output"
    type: "string"
    flag: "-oN"
    template: "{flag} {value}"       # Кастомный шаблон аргумента
    options: ["-", "/tmp/scan.txt"]  # Список допустимых значений (enum)
```

---

## Структура внутренних пакетов

```
internal/
├── agent/
│   ├── agent.go                  # Основной цикл AI-агента (ReAct, диспетчер инструментов, SSE)
│   ├── memory_compressor.go      # Сжатие разговора при приближении к токен-лимиту
│   ├── persistent_memory.go      # SQLite-хранилище памяти (8 категорий, 4 статуса, 3 уровня достоверности)
│   ├── rag_context.go            # RAGContextInjector — проактивное получение KB с кешем (TTL 5 мин)
│   └── time_awareness.go         # Инъекция времени/часового пояса в системные промпты
│
├── app/
│   ├── app.go                    # Загрузка приложения: связывает все подсистемы, Gin-роутер, CORS
│   └── skill_stats_adapter.go    # Адаптер для записи статистики использования навыков
│
├── attackchain/
│   └── builder.go                # AI-парсинг цепочки атаки (узлы + рёбра, оценка рисков)
│
├── config/
│   └── config.go                 # Все конфиг-структуры, загрузка YAML, сканирование директорий
│                                 # ролей/инструментов, автогенерация пароля, миграция конфига
│
├── database/
│   ├── database.go               # SQLite init, создание схемы (16+ таблиц), WAL, миграции
│   ├── conversation.go           # CRUD разговоров и сообщений
│   ├── attackchain.go            # Персистентность узлов/рёбер цепочки атаки
│   ├── batch_task.go             # CRUD очередей и задач пакетного выполнения
│   ├── group.go                  # CRUD групп разговоров с закреплением
│   ├── monitor.go                # Запись выполнений инструментов и статистика
│   ├── skill_stats.go            # Статистика использования навыков
│   └── vulnerability.go          # CRUD уязвимостей с фильтрацией по critical/status
│
├── filemanager/
│   └── filemanager.go            # Отслеживание файлов (7 типов, 6 статусов, метаданные, журнал)
│
├── handler/                      # HTTP-хэндлеры (один файл = одна область)
│   ├── agent.go                  # /api/agent-loop — чат, SSE, отмена, задачи, пакетные очереди
│   ├── attackchain.go            # /api/attack-chain — генерация и получение
│   ├── auth.go                   # /api/auth — вход, выход, смена пароля, валидация
│   ├── batch_task_manager.go     # Управление пакетными задачами (в составе AgentHandler)
│   ├── config.go                 # /api/config — получение, обновление, инструменты, модели
│   ├── conversation.go           # /api/conversations — CRUD, закрепление
│   ├── docker.go                 # /api/docker — статус, логи, lifecycle-действия
│   ├── external_mcp.go           # /api/external-mcp — управление внешними MCP
│   ├── filemanager.go            # /api/files — загрузка, CRUD, журнал, находки
│   ├── fofa.go                   # /api/fofa — поиск и AI-парсинг запросов
│   ├── group.go                  # /api/groups — управление группами разговоров
│   ├── knowledge.go              # /api/knowledge — CRUD, сканирование, индексирование, поиск
│   ├── memory.go                 # /api/memories — CRUD, статистика, статус
│   ├── monitor.go                # /api/monitor — история выполнений, статистика
│   ├── openapi.go                # /api/openapi/spec — генерация спецификации
│   ├── recon.go                  # /api/recon — ZoomEye/Shodan/Censys прокси + валидация ключей
│   ├── robot.go                  # /api/robot — webhook Lark, тест-вызов бота
│   ├── role.go                   # /api/roles — CRUD ролей
│   ├── skills.go                 # /api/skills — CRUD навыков, статистика, привязанные роли
│   ├── task_manager.go           # Управление задачами агента
│   ├── terminal.go               # /api/terminal — синхр., SSE-стриминг, WebSocket PTY
│   ├── terminal_stream_unix.go   # Unix PTY реализация стриминга
│   ├── terminal_stream_windows.go# Windows реализация стриминга
│   ├── terminal_ws_unix.go       # Unix WebSocket терминал-хэндлер
│   └── vulnerability.go          # /api/vulnerabilities — CRUD и статистика
│
├── knowledge/
│   ├── bm25.go                   # Корпусный BM25 Okapi (реальный IDF по всем чанкам)
│   ├── embedder.go               # Клиент OpenAI Embeddings API
│   ├── indexer.go                # Чанкинг текста, генерация embeddings, сохранение в БД
│   ├── manager.go                # Сканер директорий и управление элементами KB
│   ├── retriever.go              # Гибридный вектор + BM25 поиск со скорингом
│   ├── tool.go                   # MCP-инструменты (search_knowledge_base и др.)
│   └── types.go                  # Типы элементов знаний и embeddings
│
├── logger/
│   └── logger.go                 # Структурированный логгер на основе Zap
│
├── mcp/
│   ├── server.go                 # MCP-сервер: регистрация инструментов, HTTP/SSE/stdio хэндлеры
│   ├── client_sdk.go             # MCP-клиент (modelcontextprotocol/go-sdk)
│   ├── external_manager.go       # Менеджер внешних MCP соединений (здоровье, lifecycle)
│   ├── types.go                  # MCP-типы (Tool, ToolResult, Prompt, Resource)
│   └── builtin/
│       └── constants.go          # Константы имён встроенных инструментов
│
├── openai/
│   └── openai.go                 # HTTP-клиент для OpenAI-совместимых API (чат, стриминг)
│
├── robot/
│   ├── conn.go                   # Общие утилиты соединения
│   ├── lark.go                   # Lark (Feishu) постоянное соединение бота
│   └── telegram.go               # Telegram long-polling бот (multi-user, стриминг прогресса)
│
├── security/
│   ├── auth_manager.go           # Хеширование паролей, управление токенами сессий
│   ├── auth_middleware.go        # Gin Bearer-token middleware
│   └── executor.go               # Исполнитель инструментов: subprocess runner, маппинг аргументов,
│                                 # захват результатов, хранение больших результатов
│
├── skills/
│   ├── manager.go                # Сканер директорий навыков, чтение SKILL.md
│   └── tool.go                   # MCP-инструменты (list_skills, read_skill)
│
└── storage/
    └── result_storage.go         # Дисковое хранилище результатов с пагинацией, поиском, фильтром
```

---

## Схема базы данных

### Основная БД (`data/conversations.db`)

| Таблица | Назначение |
|---------|-----------|
| `conversations` | Метаданные разговоров (id, заголовок, временные метки, закрепление, ReAct-кеш) |
| `messages` | Отдельные сообщения (роль, содержимое, ID выполнений инструментов) |
| `process_details` | Журнал событий стриминга на сообщение (вызовы инструментов, ответы, ошибки) |
| `tool_executions` | Записи запусков инструментов (имя, аргументы, статус, результат, тайминги) |
| `tool_stats` | Агрегированная статистика вызовов инструментов |
| `skill_stats` | Агрегированная статистика использования навыков |
| `attack_chain_nodes` | Узлы графа атаки (тип, имя, оценка риска, метаданные) |
| `attack_chain_edges` | Рёбра графа атаки (источник, цель, тип, вес) |
| `knowledge_retrieval_logs` | Журнал аудита поисковых запросов к KB |
| `conversation_groups` | Метаданные групп (имя, иконка, закрепление) |
| `conversation_group_mappings` | Связь многие-ко-многим: разговор ↔ группа |
| `vulnerabilities` | Записи уязвимостей (критичность, статус, доказательство, рекомендация) |
| `batch_task_queues` | Метаданные очередей (статус, заголовок, роль, индекс прогресса) |
| `batch_tasks` | Отдельные задачи (сообщение, conversation_id, статус, результат) |
| `persistent_memory` | Записи кросс-сессионной памяти (категория, статус, достоверность) |
| `managed_files` | Записи файлового менеджера (тип, статус, метаданные, журнал, находки) |

### БД знаний (`data/knowledge.db`)

| Таблица | Назначение |
|---------|-----------|
| `knowledge_base_items` | Метаданные элементов (категория, заголовок, путь к файлу, содержимое) |
| `knowledge_embeddings` | Текстовые чанки + векторные embeddings (JSON-массив) |
| `knowledge_retrieval_logs` | Журнал запросов KB (без FK-ограничений для автономной БД) |

---

## Структура проекта

```
CyberStrikeAI/
├── cmd/
│   ├── server/main.go            # Точка входа HTTP-сервера
│   ├── mcp-stdio/main.go         # MCP stdio сервер (интеграция с Cursor/IDE)
│   ├── test-config/main.go       # Утилита валидации конфигурации
│   ├── test-external-mcp/main.go # Тестировщик подключений внешнего MCP
│   └── test-sse-mcp-server/      # Тестовый SSE MCP сервер для валидации
│
├── internal/                     # Все пакеты приложения (см. выше)
│
├── web/
│   ├── templates/
│   │   ├── index.html            # SPA-оболочка
│   │   └── api-docs.html         # Страница документации OpenAPI
│   └── static/
│       ├── js/                   # Фронтенд JavaScript
│       ├── css/                  # Стили
│       └── favicon.ico / logo.png
│
├── tools/                        # 116+ YAML-рецептов инструментов
├── roles/                        # 14 предустановленных YAML-ролей
├── skills/                       # 24 предустановленных директории навыков
├── knowledge_base/               # Markdown-файлы знаний (автоиндексируются)
│
├── scripts/
│   ├── install-enabled-tools.sh           # Установка включённых инструментов (хост)
│   ├── install-enabled-tools-container.sh # Установка в Docker-контейнер
│   ├── install-host-tools.sh              # Установка общих хост-зависимостей
│   ├── install-missing-wordlists.sh       # Установка wordlist'ов
│   ├── verify-enabled-tools.sh            # Проверка установленных инструментов
│   ├── test-docker-suite.sh               # Запуск Docker-тестов
│   ├── install-flaresolverr.sh            # Установка FlareSolverr
│   ├── flaresolverr-client.py             # Python-клиент FlareSolverr
│   ├── cuttlefish/                        # Скрипты установки Android VM
│   └── ghidra/                            # Скрипты Ghidra Headless MCP
│
├── docs/
│   ├── robot_en.md               # Руководство по Telegram и Lark (EN)
│   ├── docker_en.md              # Руководство по Docker-развёртыванию (EN)
│   ├── memory_en.md              # Руководство по персистентной памяти (EN)
│   └── robot.md                  # Руководство по чат-боту (CN)
│
├── images/                       # Скриншоты и диаграммы
├── .github/ISSUE_TEMPLATE/       # Шаблоны bug report и feature request
├── config.example.yaml           # Полный аннотированный пример конфига
├── config.docker.yaml            # Docker-специфичный конфиг
├── Dockerfile                    # Многоэтапная Docker-сборка
├── docker-compose.yml            # Docker Compose стек
├── go.mod                        # Go-модуль (Go 1.23+)
├── requirements.txt              # Python-зависимости для инструментов
├── run.sh                        # Однокомандный запуск (сборка + старт)
├── run_docker.sh                 # CLI управления Docker lifecycle
├── ROADMAP.md                    # Планируемые функции и направление разработки
└── README.md
```

---

## Go-зависимости

| Пакет | Назначение |
|-------|-----------|
| `github.com/gin-gonic/gin` | HTTP веб-фреймворк и маршрутизация |
| `github.com/mattn/go-sqlite3` | SQLite3 драйвер (CGO) |
| `github.com/modelcontextprotocol/go-sdk` | Официальный MCP Go SDK |
| `github.com/gorilla/websocket` | WebSocket поддержка (терминал) |
| `github.com/creack/pty` | PTY (псевдо-терминал) для интерактивных инструментов |
| `github.com/google/uuid` | Генерация UUID |
| `github.com/pkoukk/tiktoken-go` | Подсчёт токенов для управления контекстом |
| `github.com/larksuite/oapi-sdk-go/v3` | Lark (Feishu) SDK для бота |
| `go.uber.org/zap` | Структурированное логирование |
| `gopkg.in/yaml.v3` | YAML-парсинг для конфигов и рецептов инструментов |

---

## Примеры использования

### Базовые команды

```
Сканировать открытые порты на 192.168.1.1
Выполнить комплексное сканирование портов 80, 443, 22 на 192.168.1.1
Проверить https://example.com/page?id=1 на SQL-инъекцию
Найти скрытые директории и устаревшее ПО на https://example.com
Перечислить субдомены example.com, затем запустить nuclei против живых хостов
Поищи в базе знаний техники эксплуатации XSS
Запомни учётные данные: admin:P@ssw0rd123 для цели 10.10.10.5
```

### Продвинутые плейбуки

```
Загрузи роль Penetration Testing, запусти amass и subfinder для example.com,
затем перебери директории на каждом живом хосте и сохрани находки в уязвимости.

Используй Ghidra MCP сервер для декомпиляции /tmp/target.elf и поиска переполнений буфера.

Создай очередь пакетных задач: (1) nmap сканирование 192.168.1.0/24,
(2) nuclei по всем живым хостам, (3) sqlmap по всем веб-сервисам,
(4) построить граф цепочки атаки.

Запусти Cuttlefish Android VM, установи com.target.app, направь трафик через SSLStrip,
перехвати учётные данные при входе, сохрани в персистентную память.

Построй цепочку атаки для текущего пентеста и экспортируй все узлы с severity >= high.
```

---

## Встроенные защиты

- **Валидация обязательных полей** — предотвращает сохранение пустых API-ключей.
- **Автогенерация надёжного пароля** — 24-символьный криптографически случайный пароль; автозапись в `config.yaml`.
- **Единый auth middleware** — Bearer-token проверка на каждый API и веб-вызов.
- **Таймаут инструментов** — настраиваемый лимит выполнения (`tool_timeout`).
- **Лимиты размера результатов** — данные сверх порога на диске, не в SQLite.
- **Параллельная безопасность** — настраиваемый лимит конкурентности (`max_parallel_tools`).
- **Повторы при ошибках** — транзитные ошибки повторяются до `tool_retry_count` раз.

---

## Связанная документация

| Документ | Описание |
|----------|----------|
| [Robot / Chatbot Guide](docs/robot_en.md) | Полная установка, команды и решение проблем для Lark и Telegram |
| [Docker Guide](docs/docker_en.md) | Docker-развёртывание, lifecycle, прокси/VPN, Settings UI |
| [Memory Guide](docs/memory_en.md) | Категории памяти, инструменты агента, панель Memory UI, API |
| [Tool Configuration Guide](tools/README.md) | Как писать, настраивать и расширять YAML-рецепты инструментов |
| [Role Configuration Guide](roles/README.md) | Как создавать и управлять ролями тестирования безопасности |
| [Skills System Guide](skills/README.md) | Как создавать и привязывать навыки к ролям |
| [Roadmap](ROADMAP.md) | Планируемые функции и направление разработки |

---

## ⚠️ Отказ от ответственности

**Этот инструмент предназначен исключительно для образовательных целей и авторизованного тестирования!**

CyberStrikeAI — профессиональная платформа тестирования безопасности, предназначенная для помощи исследователям безопасности, пентестерам и IT-специалистам в проведении оценок безопасности **с явного письменного разрешения владельца целевой системы**.

**Используя этот инструмент, вы соглашаетесь:**
- Использовать инструмент только на системах, для которых у вас есть явное письменное разрешение
- Соблюдать все применимые законы, нормативные акты и этические стандарты
- Нести полную ответственность за любое несанкционированное использование
- Не использовать инструмент в незаконных или вредоносных целях

**Разработчики не несут ответственности за неправомерное использование!**

---

Нужна помощь или хотите внести вклад? Открывайте issue или PR — вклады сообщества приветствуются!

Смотрите [ROADMAP.md](ROADMAP.md) для планируемых функций.
