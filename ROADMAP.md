# CyberStrikeAI Roadmap

This roadmap outlines the planned development trajectory for CyberStrikeAI. Items are grouped by theme and approximate horizon. Priorities may shift based on community feedback—open an issue or PR to influence the direction.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Shipped / Available |
| 🚧 | In Progress |
| 📋 | Planned |
| 💡 | Under Consideration |

---

## Released (v1.x)

### Core Platform
- ✅ AI agent engine with OpenAI-compatible model support (GPT, Claude, DeepSeek, etc.)
- ✅ Native MCP implementation — HTTP, stdio, and SSE transports
- ✅ External MCP federation (HTTP / stdio / SSE modes)
- ✅ 140+ prebuilt tool recipes in YAML
- ✅ YAML-based tool extension system (hot-reload from `tools/` directory)
- ✅ Large-result pagination, compression, and searchable archives
- ✅ SQLite persistence for conversations, vulnerabilities, and audit logs
- ✅ Password-protected Web UI with Bearer-token auth and session management
- ✅ Streaming SSE output for real-time task progress
- ✅ **Docker lifecycle management** — deploy, update, start, stop, restart, remove via `run_docker.sh` or System Settings UI; REST API (`/api/docker/status`, `/api/docker/logs`, `/api/docker/action`); proxy (SOCKS/HTTP/Tor) and VPN-container modes
- ✅ **In-app dialog system** (`ui-dialogs.js`) — toast notifications (success/error/warning/info), styled confirm dialogs with async callback flow, and prompt modals replace all native `alert`/`confirm`/`prompt` calls; fully theme-aware (dark/light)

### Security Testing Features
- ✅ Role-based testing system (13 predefined roles: Penetration Testing, CTF, Web App Scanning, API Security, Binary Analysis, Cloud Security Audit, Digital Forensics, Container Security, Post-Exploitation, etc.)
- ✅ Skills system (24 predefined skills: SQL injection, XSS, CSRF, SSRF, XXE, Command injection, File upload, IDOR, Deserialization, API security, Android reverse engineering, Container security, Cloud security audit, Network penetration, Mobile app security, LDAP/XPath injection, Incident response, Secure code review, Vulnerability assessment, Security automation, Security awareness training, Bitrix24 webhook exploitation, Business logic testing, and more)
- ✅ Attack-chain graph with severity scoring and step-by-step replay
- ✅ **Attack-chain export** — JSON (full node/edge graph with metadata), PDF (formatted A4 report via jsPDF + jsPDF-AutoTable), and PNG (2× retina, theme-aware background) export formats
- ✅ Vulnerability management — CRUD, severity/status tracking, statistics
- ✅ Batch task management — create queues, add tasks, sequential execution with full status tracking
- ✅ Knowledge base with vector search and hybrid (vector + BM25 keyword) retrieval
- ✅ **Corpus-level BM25 Okapi** — real inverse document frequency scoring built from all indexed chunks; replaces the previous per-document approximation
- ✅ Auto-indexing of Markdown knowledge files with incremental updates
- ✅ FOFA / ZoomEye search engine integration
- ✅ **WebShell Management** — built-in webshell connection manager (PHP/ASP/ASPX/JSP); xterm.js virtual terminal for command execution; remote file manager (list, upload, download, read, edit, delete); AI Assistant tab with streaming agent loop and per-connection conversation history; conversations linked to webshell connections via `webshell_connection_id`; REST API (`/api/webshell/connections`, `/api/webshell/exec`, `/api/webshell/file`)

### Agent Intelligence
- ✅ **Persistent memory** — cross-session key-value store (SQLite-backed) with 8 categories (credential, target, vulnerability, fact, note, tool_run, discovery, plan); survives conversation compression; exposed as four agent tools (`store_memory`, `retrieve_memory`, `list_memories`, `delete_memory`); tool results automatically persisted as `tool_run` memory entries
- ✅ **Agent introspection** — before every major action the agent runs a mandatory memory-similarity check and knowledge-base preflight; entity-based memory lookup for IP/domain targets; `<memory_similarity_context>` injected into system prompt to prevent duplicate scans
- ✅ **Time awareness** — current date/time, timezone, and session age automatically injected into every system prompt; configurable via `agent.time_awareness`; `get_current_time` tool for on-demand queries

### Integrations & UX
- ✅ Lark (Feishu) chatbot via persistent long-lived connections
- ✅ Telegram bot via long-polling — multi-user, progress streaming, MCP tool control, role and conversation management; configurable via Web UI
- ✅ Web console with terminal, task monitor, conversation groups, and role selector
- ✅ Conversation grouping — pinning, renaming, batch management; batch manager refreshes immediately after individual deletions
- ✅ MCP stdio mode for Cursor / IDE integration
- ✅ OpenAPI documentation endpoint with interactive testing and dark/light theme support
- ✅ **Fully translated English UI** — `i18n.js` module shipped with English and Chinese translations; all hardcoded strings replaced
- ✅ **Dark / light theme toggle** — fully unified dark mode across all pages (dashboard, API docs, group detail view, memory badges, attack chain export buttons, quick links, CTA blocks); preference persisted in `localStorage`; API Docs page reads theme on load to avoid white flash

---

## Near-Term (Next 1–2 Releases)

### Agent & Orchestration
- ✅ **Parallel tool execution** — agent fans out independent tool calls concurrently to reduce total time on multi-step engagements
- ✅ **Agent memory improvements** — persistent cross-session memory store with category tagging; BM25 corpus index for smarter knowledge retrieval; paginated Memory UI with scrolling and category filters
- ✅ **Memory UI panel** — web interface to view, search, edit, and delete persistent memory entries; category filters; stats strip; bulk delete; paginated loading
- 📋 **Memory expiry / TTL** — optional time-to-live on memory entries so stale facts are automatically purged
- 📋 **Structured task templates** — YAML-defined recon/pentest playbooks that the agent can load and execute end-to-end
- 📋 **Tool chaining macros** — define multi-step pipelines (e.g., subfinder → httpx → nuclei) as a single named operation

### UI / UX
- ✅ **In-app dialog system** — toast, confirm, and prompt replace native browser dialogs; theme-aware
- ✅ **Improved attack-chain export** — JSON, PDF, and PNG export; PNG uses Cytoscape `.png()` at 2× retina scale with theme-aware background
- ✅ **Attack-chain PNG export** — screenshot-style image export of the graph canvas; 2× retina quality, dark/light theme-aware background, `appToast` notifications
- 📋 **Vulnerability report generator** — one-click HTML/Markdown pentest report from discovered vulnerabilities
- 📋 **Real-time collaboration** — allow multiple users to observe or join a running session

### Integrations
- 📋 **Slack / Teams bot** — extend the chatbot system to Slack and Microsoft Teams
- 📋 **Webhook notifications** — send task completion, vulnerability discovery, or attack-chain events to external systems (Slack, PagerDuty, etc.)
- 📋 **JIRA / GitHub Issues integration** — automatically create issues from discovered vulnerabilities
- ✅ **Telegram inline keyboard** — interactive buttons (confirm/cancel actions, quick role switching) for dangerous bot commands; 60-second TTL with per-user authorization
- 📋 **Telegram file transfer** — send large tool output as downloadable files when the result exceeds the message size limit

---

## Mid-Term (3–6 Months)

### AI & Automation
- 📋 **Multi-model routing** — automatically select the best model (reasoning model for complex planning, faster model for tool execution) to optimize cost and latency
- 📋 **Autonomous recon-to-report pipeline** — fully automated end-to-end pentest workflow from target scoping to final report generation
- ✅ **RAG-enhanced agent** — deeper integration of the knowledge base into agent decision-making for better tool selection and exploit guidance; proactive context injection based on task semantics
- 📋 **Custom agent personas** — allow organizations to define their own agent behavior, escalation rules, and toolset restrictions
- 📋 **Fine-tuned security model support** — tested integration with security-focused fine-tuned models

### Security & Compliance
- 📋 **Multi-user RBAC** — role-based access control with user accounts, scoped permissions (read-only analyst, full operator, admin)
- 📋 **Audit log export** — export structured audit logs (JSON / SYSLOG) to SIEM systems
- 📋 **Engagement scoping** — define authorized target scope and enforce tool/output restrictions within scope boundaries
- 📋 **Data retention policies** — auto-purge or archive old conversations and results

### Tool Ecosystem
- 📋 **Tool marketplace / registry** — community-contributed tool recipes with one-click import
- 📋 **Tool sandboxing** — optional Docker/container isolation for each tool invocation
- 📋 **Tool health monitoring** — detect missing or misconfigured tools and suggest installation commands
- 📋 **Burp Suite extension** — native Burp extension for bi-directional traffic sharing with CyberStrikeAI

### Knowledge Base
- 📋 **Auto-knowledge ingestion** — automatically import CVE details, exploit-db entries, and security advisories into the knowledge base
- 📋 **Knowledge base sharing** — export and import knowledge bases as portable bundles
- 📋 **Semantic deduplication** — automatically merge near-duplicate knowledge items
- 📋 **BM25 index persistence** — store the BM25 corpus index on disk so it does not need to be rebuilt on every startup

---

## Long-Term / Under Consideration

### Platform
- 💡 **Web-based IDE / notebook** — Jupyter-like interface for scripting custom pentest workflows
- 💡 **Plugin architecture** — first-class SDK for third-party integrations beyond MCP
- 💡 **Distributed agent execution** — run agents across multiple nodes for large-scale assessments
- 💡 **API gateway proxy** — transparent security testing proxy mode for API testing
- 💡 **Mobile app** — native iOS/Android companion app

### AI
- 💡 **Reasoning traces / chain-of-thought display** — show the AI's reasoning steps in the UI for transparency
- 💡 **Human-in-the-loop mode** — require explicit approval before executing high-risk tools
- 💡 **Adaptive learning** — capture operator feedback on agent decisions to improve future recommendations
- 💡 **Vulnerability correlation engine** — automatically correlate findings across multiple engagements to identify patterns

### Community
- 💡 **Role / skill / tool sharing hub** — centralized repository for community-contributed roles, skills, and tools
- 💡 **CTF challenge integration** — direct integration with CTF platforms (HackTheBox, TryHackMe, PicoCTF) for practice mode
- 💡 **Certification exam assistance mode** — guided study mode for OSCP, CEH, and similar certifications

---

## Contributing

We welcome contributions in all areas. To propose a roadmap item or discuss implementation details:

1. **Open an issue** using the Feature Request template
2. **Join the discussion** on existing roadmap issues
3. **Submit a PR** — all contributions are reviewed and credited

See [README.md](README.md) for development setup instructions.

---

*Last updated: 2026-03-18 — v1.6.1: Attack-chain PNG export — 2× retina quality via Cytoscape `.png()`, theme-aware background (dark `#0f172a` / light `#ffffff`), `appToast` success/error notifications, all `alert()` calls in export function replaced with `appToast`. Previous v1.6.0: Attack-chain JSON + PDF export (jsPDF + AutoTable, client-side); in-app dialog system (`ui-dialogs.js`) — themed toast/confirm/prompt replaces all native browser dialogs; comprehensive dark mode overhaul — fixed all remaining white/light areas (group detail view, content area, API docs page theme init, dashboard quick links, CTA block, memory badges, memory status/notification chips, attack chain export buttons, role select items, icon picker inputs); conversation delete UX improved — batch manager refreshes in-place immediately after deletion; `appConfirm` callback used for all delete confirmations to prevent stale handler accumulation; radare2 Docker install switched to `git clone + sys/install.sh` to replace broken `curl | bash` (no working directory issue); xsser installed from git source since it is no longer published on PyPI; WebShell conversations linked via `webshell_connection_id` DB column (auto-migrated); Default role simplified (skill list removed from YAML). Previous v1.5.3: Telegram inline keyboard confirmations shipped — `stop` and `delete` commands now show ✅/❌ inline buttons; 60-second TTL with per-user authorization; `callback_query` handling added to polling loop. Previous v1.5.2: Full English UI translation complete. Previous v1.5.1: Dark/light theme stabilized; i18n module added. Previous v1.5.0: WebShell Management module added. This roadmap is subject to change. Follow the repository to stay updated.*

---

## Telegram Bot — Detailed Roadmap

The Telegram integration (shipped in v1.3.17) provides a foundation for deeper mobile-first control. The following items extend it further:

| Item | Status | Description |
|------|--------|-------------|
| Long-polling bot with multi-user support | ✅ | Independent sessions per Telegram user ID |
| Live progress streaming | ✅ | Placeholder message edited with tool-call steps during execution |
| Role switching via bot commands | ✅ | `role <name>` command supported in Telegram |
| MCP tool configuration via Web UI | ✅ | Tools added/toggled in settings are immediately available to the bot |
| User whitelist (allowed_user_ids) | ✅ | Restrict bot access to specific Telegram user IDs |
| Group chat support (@ mentions) | ✅ | Bot responds to @mention in groups |
| Inline keyboard for confirmations | ✅ | ✅ / ❌ buttons for dangerous actions (`delete`, `stop`); 60-second TTL; per-user authorization check; confirmation dialog replaced with result on resolve |
| File upload for large results | 📋 | Send results >4096 chars as a `.txt` file |
| Telegram webhook mode (optional) | 📋 | Alternative to polling for low-latency deployments with public IP |
| `/start` onboarding message | 📋 | Automatic welcome message with quick-start tips on first contact |
