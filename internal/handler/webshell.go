package handler

import (
	"bytes"
	"database/sql"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"cyberstrike-ai/internal/database"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// WebShellHandler proxies WebShell command execution (similar to Behinder/AntSword),
// avoiding frontend CORS issues and building requests uniformly.
type WebShellHandler struct {
	logger *zap.Logger
	client *http.Client
	db     *database.DB
}

// NewWebShellHandler creates a WebShell handler; db may be nil (connection config APIs will be unavailable)
func NewWebShellHandler(logger *zap.Logger, db *database.DB) *WebShellHandler {
	return &WebShellHandler{
		logger: logger,
		client: &http.Client{
			Timeout:   30 * time.Second,
			Transport: &http.Transport{DisableKeepAlives: false},
		},
		db: db,
	}
}

// CreateConnectionRequest is the request body for creating a connection
type CreateConnectionRequest struct {
	URL      string `json:"url" binding:"required"`
	Password string `json:"password"`
	Type     string `json:"type"`
	Method   string `json:"method"`
	CmdParam string `json:"cmd_param"`
	Remark   string `json:"remark"`
}

// UpdateConnectionRequest is the request body for updating a connection
type UpdateConnectionRequest struct {
	URL      string `json:"url" binding:"required"`
	Password string `json:"password"`
	Type     string `json:"type"`
	Method   string `json:"method"`
	CmdParam string `json:"cmd_param"`
	Remark   string `json:"remark"`
}

// ListConnections returns all WebShell connections (GET /api/webshell/connections)
func (h *WebShellHandler) ListConnections(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database not available"})
		return
	}
	list, err := h.db.ListWebshellConnections()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if list == nil {
		list = []database.WebShellConnection{}
	}
	c.JSON(http.StatusOK, list)
}

// CreateConnection creates a new WebShell connection (POST /api/webshell/connections)
func (h *WebShellHandler) CreateConnection(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database not available"})
		return
	}
	var req CreateConnectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.URL = strings.TrimSpace(req.URL)
	if req.URL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "url is required"})
		return
	}
	if _, err := url.Parse(req.URL); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid url"})
		return
	}
	method := strings.ToLower(strings.TrimSpace(req.Method))
	if method != "get" && method != "post" {
		method = "post"
	}
	shellType := strings.ToLower(strings.TrimSpace(req.Type))
	if shellType == "" {
		shellType = "php"
	}
	conn := &database.WebShellConnection{
		ID:        "ws_" + strings.ReplaceAll(uuid.New().String(), "-", "")[:12],
		URL:       req.URL,
		Password:  strings.TrimSpace(req.Password),
		Type:      shellType,
		Method:    method,
		CmdParam:  strings.TrimSpace(req.CmdParam),
		Remark:    strings.TrimSpace(req.Remark),
		CreatedAt: time.Now(),
	}
	if err := h.db.CreateWebshellConnection(conn); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, conn)
}

// UpdateConnection updates an existing WebShell connection (PUT /api/webshell/connections/:id)
func (h *WebShellHandler) UpdateConnection(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database not available"})
		return
	}
	id := strings.TrimSpace(c.Param("id"))
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id is required"})
		return
	}
	var req UpdateConnectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.URL = strings.TrimSpace(req.URL)
	if req.URL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "url is required"})
		return
	}
	if _, err := url.Parse(req.URL); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid url"})
		return
	}
	method := strings.ToLower(strings.TrimSpace(req.Method))
	if method != "get" && method != "post" {
		method = "post"
	}
	shellType := strings.ToLower(strings.TrimSpace(req.Type))
	if shellType == "" {
		shellType = "php"
	}
	conn := &database.WebShellConnection{
		ID:       id,
		URL:      req.URL,
		Password: strings.TrimSpace(req.Password),
		Type:     shellType,
		Method:   method,
		CmdParam: strings.TrimSpace(req.CmdParam),
		Remark:   strings.TrimSpace(req.Remark),
	}
	if err := h.db.UpdateWebshellConnection(conn); err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "connection not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	updated, _ := h.db.GetWebshellConnection(id)
	if updated != nil {
		c.JSON(http.StatusOK, updated)
	} else {
		c.JSON(http.StatusOK, conn)
	}
}

// DeleteConnection removes a WebShell connection (DELETE /api/webshell/connections/:id)
func (h *WebShellHandler) DeleteConnection(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database not available"})
		return
	}
	id := strings.TrimSpace(c.Param("id"))
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id is required"})
		return
	}
	if err := h.db.DeleteWebshellConnection(id); err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "connection not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// GetAIHistory returns the AI assistant conversation history for a WebShell connection
// (GET /api/webshell/connections/:id/ai-history)
func (h *WebShellHandler) GetAIHistory(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database not available"})
		return
	}
	id := strings.TrimSpace(c.Param("id"))
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id is required"})
		return
	}
	conv, err := h.db.GetConversationByWebshellConnectionID(id)
	if err != nil {
		h.logger.Warn("failed to get webshell AI conversation", zap.String("connectionId", id), zap.Error(err))
		c.JSON(http.StatusOK, gin.H{"conversationId": nil, "messages": []database.Message{}})
		return
	}
	if conv == nil {
		c.JSON(http.StatusOK, gin.H{"conversationId": nil, "messages": []database.Message{}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"conversationId": conv.ID, "messages": conv.Messages})
}

// ListAIConversations lists all AI conversations for a WebShell connection (for sidebar)
// (GET /api/webshell/connections/:id/ai-conversations)
func (h *WebShellHandler) ListAIConversations(c *gin.Context) {
	if h.db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database not available"})
		return
	}
	id := strings.TrimSpace(c.Param("id"))
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id is required"})
		return
	}
	list, err := h.db.ListConversationsByWebshellConnectionID(id)
	if err != nil {
		h.logger.Warn("failed to list webshell AI conversations", zap.String("connectionId", id), zap.Error(err))
		c.JSON(http.StatusOK, []database.WebShellConversationItem{})
		return
	}
	if list == nil {
		list = []database.WebShellConversationItem{}
	}
	c.JSON(http.StatusOK, list)
}

// ExecRequest is the request body for executing a command (connection info + command)
type ExecRequest struct {
	URL      string `json:"url" binding:"required"`
	Password string `json:"password"`
	Type     string `json:"type"`      // php, asp, aspx, jsp, custom
	Method   string `json:"method"`    // GET or POST (defaults to POST)
	CmdParam string `json:"cmd_param"` // command parameter name e.g. cmd, default: cmd
	Command  string `json:"command" binding:"required"`
}

// ExecResponse is the response body for command execution
type ExecResponse struct {
	OK       bool   `json:"ok"`
	Output   string `json:"output"`
	Error    string `json:"error,omitempty"`
	HTTPCode int    `json:"http_code,omitempty"`
}

// FileOpRequest is the request body for file operations
type FileOpRequest struct {
	URL        string `json:"url" binding:"required"`
	Password   string `json:"password"`
	Type       string `json:"type"`
	Method     string `json:"method"`                      // GET or POST (defaults to POST)
	CmdParam   string `json:"cmd_param"`                   // command parameter name
	Action     string `json:"action" binding:"required"`   // list, read, delete, write, mkdir, rename, upload, upload_chunk
	Path       string `json:"path"`
	TargetPath string `json:"target_path"` // used for rename
	Content    string `json:"content"`     // used for write/upload
	ChunkIndex int    `json:"chunk_index"` // used for upload_chunk; 0 = first chunk
}

// FileOpResponse is the response body for file operations
type FileOpResponse struct {
	OK     bool   `json:"ok"`
	Output string `json:"output"`
	Error  string `json:"error,omitempty"`
}

// Exec executes a command on a WebShell (POST /api/webshell/exec)
func (h *WebShellHandler) Exec(c *gin.Context) {
	var req ExecRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.URL = strings.TrimSpace(req.URL)
	req.Command = strings.TrimSpace(req.Command)
	if req.URL == "" || req.Command == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "url and command are required"})
		return
	}

	parsed, err := url.Parse(req.URL)
	if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid url: only http(s) allowed"})
		return
	}

	useGET := strings.ToUpper(strings.TrimSpace(req.Method)) == "GET"
	cmdParam := strings.TrimSpace(req.CmdParam)
	if cmdParam == "" {
		cmdParam = "cmd"
	}
	var httpReq *http.Request
	if useGET {
		targetURL := h.buildExecURL(req.URL, req.Type, req.Password, cmdParam, req.Command)
		httpReq, err = http.NewRequest(http.MethodGet, targetURL, nil)
	} else {
		body := h.buildExecBody(req.Type, req.Password, cmdParam, req.Command)
		httpReq, err = http.NewRequest(http.MethodPost, req.URL, bytes.NewReader(body))
	}
	if err != nil {
		h.logger.Warn("webshell exec NewRequest", zap.Error(err))
		c.JSON(http.StatusInternalServerError, ExecResponse{OK: false, Error: err.Error()})
		return
	}
	if !useGET {
		httpReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	}
	httpReq.Header.Set("User-Agent", "Mozilla/5.0 (compatible; CyberStrikeAI-WebShell/1.0)")

	resp, err := h.client.Do(httpReq)
	if err != nil {
		h.logger.Warn("webshell exec Do", zap.String("url", req.URL), zap.Error(err))
		c.JSON(http.StatusOK, ExecResponse{OK: false, Error: err.Error()})
		return
	}
	defer resp.Body.Close()

	out, _ := io.ReadAll(resp.Body)
	c.JSON(http.StatusOK, ExecResponse{
		OK:       resp.StatusCode == http.StatusOK,
		Output:   string(out),
		HTTPCode: resp.StatusCode,
	})
}

// buildExecBody builds a POST body for common WebShell conventions (pass + cmd, configurable param name)
func (h *WebShellHandler) buildExecBody(shellType, password, cmdParam, command string) []byte {
	form := h.execParams(shellType, password, cmdParam, command)
	return []byte(form.Encode())
}

// buildExecURL builds a full GET URL (baseURL + ?pass=xxx&cmd=yyy, configurable cmd param)
func (h *WebShellHandler) buildExecURL(baseURL, shellType, password, cmdParam, command string) string {
	form := h.execParams(shellType, password, cmdParam, command)
	if parsed, err := url.Parse(baseURL); err == nil {
		parsed.RawQuery = form.Encode()
		return parsed.String()
	}
	return baseURL + "?" + form.Encode()
}

func (h *WebShellHandler) execParams(shellType, password, cmdParam, command string) url.Values {
	shellType = strings.ToLower(strings.TrimSpace(shellType))
	if shellType == "" {
		shellType = "php"
	}
	if strings.TrimSpace(cmdParam) == "" {
		cmdParam = "cmd"
	}
	form := url.Values{}
	form.Set("pass", password)
	form.Set(cmdParam, command)
	return form
}

// FileOp performs file operations on a WebShell (POST /api/webshell/file)
func (h *WebShellHandler) FileOp(c *gin.Context) {
	var req FileOpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.URL = strings.TrimSpace(req.URL)
	req.Action = strings.ToLower(strings.TrimSpace(req.Action))
	if req.URL == "" || req.Action == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "url and action are required"})
		return
	}

	parsed, err := url.Parse(req.URL)
	if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid url: only http(s) allowed"})
		return
	}

	// File operations are implemented via system command execution (compatible with common one-liner shells)
	var command string
	shellType := strings.ToLower(strings.TrimSpace(req.Type))
	switch req.Action {
	case "list":
		path := strings.TrimSpace(req.Path)
		if path == "" {
			path = "."
		}
		if shellType == "asp" || shellType == "aspx" {
			command = "dir " + h.escapePath(path)
		} else {
			command = "ls -la " + h.escapePath(path)
		}
	case "read":
		if shellType == "asp" || shellType == "aspx" {
			command = "type " + h.escapePath(strings.TrimSpace(req.Path))
		} else {
			command = "cat " + h.escapePath(strings.TrimSpace(req.Path))
		}
	case "delete":
		if shellType == "asp" || shellType == "aspx" {
			command = "del " + h.escapePath(strings.TrimSpace(req.Path))
		} else {
			command = "rm -f " + h.escapePath(strings.TrimSpace(req.Path))
		}
	case "write":
		path := h.escapePath(strings.TrimSpace(req.Path))
		command = "echo " + h.escapeForEcho(req.Content) + " > " + path
	case "mkdir":
		path := strings.TrimSpace(req.Path)
		if path == "" {
			c.JSON(http.StatusBadRequest, FileOpResponse{OK: false, Error: "path is required for mkdir"})
			return
		}
		if shellType == "asp" || shellType == "aspx" {
			command = "md " + h.escapePath(path)
		} else {
			command = "mkdir -p " + h.escapePath(path)
		}
	case "rename":
		oldPath := strings.TrimSpace(req.Path)
		newPath := strings.TrimSpace(req.TargetPath)
		if oldPath == "" || newPath == "" {
			c.JSON(http.StatusBadRequest, FileOpResponse{OK: false, Error: "path and target_path are required for rename"})
			return
		}
		if shellType == "asp" || shellType == "aspx" {
			command = "move /y " + h.escapePath(oldPath) + " " + h.escapePath(newPath)
		} else {
			command = "mv " + h.escapePath(oldPath) + " " + h.escapePath(newPath)
		}
	case "upload":
		path := strings.TrimSpace(req.Path)
		if path == "" {
			c.JSON(http.StatusBadRequest, FileOpResponse{OK: false, Error: "path is required for upload"})
			return
		}
		if len(req.Content) > 512*1024 {
			c.JSON(http.StatusBadRequest, FileOpResponse{OK: false, Error: "upload content too large (max 512KB base64)"})
			return
		}
		// base64 only contains A-Za-z0-9+/= so single-quoting is safe
		command = "echo " + "'" + req.Content + "'" + " | base64 -d > " + h.escapePath(path)
	case "upload_chunk":
		path := strings.TrimSpace(req.Path)
		if path == "" {
			c.JSON(http.StatusBadRequest, FileOpResponse{OK: false, Error: "path is required for upload_chunk"})
			return
		}
		redir := ">>"
		if req.ChunkIndex == 0 {
			redir = ">"
		}
		command = "echo " + "'" + req.Content + "'" + " | base64 -d " + redir + " " + h.escapePath(path)
	default:
		c.JSON(http.StatusBadRequest, FileOpResponse{OK: false, Error: "unsupported action: " + req.Action})
		return
	}

	useGET := strings.ToUpper(strings.TrimSpace(req.Method)) == "GET"
	cmdParam := strings.TrimSpace(req.CmdParam)
	if cmdParam == "" {
		cmdParam = "cmd"
	}
	var httpReq *http.Request
	if useGET {
		targetURL := h.buildExecURL(req.URL, req.Type, req.Password, cmdParam, command)
		httpReq, err = http.NewRequest(http.MethodGet, targetURL, nil)
	} else {
		body := h.buildExecBody(req.Type, req.Password, cmdParam, command)
		httpReq, err = http.NewRequest(http.MethodPost, req.URL, bytes.NewReader(body))
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, FileOpResponse{OK: false, Error: err.Error()})
		return
	}
	if !useGET {
		httpReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	}
	httpReq.Header.Set("User-Agent", "Mozilla/5.0 (compatible; CyberStrikeAI-WebShell/1.0)")

	resp, err := h.client.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusOK, FileOpResponse{OK: false, Error: err.Error()})
		return
	}
	defer resp.Body.Close()

	out, _ := io.ReadAll(resp.Body)
	c.JSON(http.StatusOK, FileOpResponse{
		OK:     resp.StatusCode == http.StatusOK,
		Output: string(out),
	})
}

func (h *WebShellHandler) escapePath(p string) string {
	if p == "" {
		return "."
	}
	// Simple escaping for spaces and sensitive characters to prevent command injection
	return "'" + strings.ReplaceAll(p, "'", "'\\''") + "'"
}

func (h *WebShellHandler) escapeForEcho(s string) string {
	// Used for write operations: single-quote wrapping
	return "'" + strings.ReplaceAll(s, "'", "'\"'\"'") + "'"
}

// ExecWithConnection executes a command on a specified WebShell connection (for MCP/Agent use)
func (h *WebShellHandler) ExecWithConnection(conn *database.WebShellConnection, command string) (output string, ok bool, errMsg string) {
	if conn == nil {
		return "", false, "connection is nil"
	}
	command = strings.TrimSpace(command)
	if command == "" {
		return "", false, "command is required"
	}
	useGET := strings.ToUpper(strings.TrimSpace(conn.Method)) == "GET"
	cmdParam := strings.TrimSpace(conn.CmdParam)
	if cmdParam == "" {
		cmdParam = "cmd"
	}
	var httpReq *http.Request
	var err error
	if useGET {
		targetURL := h.buildExecURL(conn.URL, conn.Type, conn.Password, cmdParam, command)
		httpReq, err = http.NewRequest(http.MethodGet, targetURL, nil)
	} else {
		body := h.buildExecBody(conn.Type, conn.Password, cmdParam, command)
		httpReq, err = http.NewRequest(http.MethodPost, conn.URL, bytes.NewReader(body))
	}
	if err != nil {
		return "", false, err.Error()
	}
	if !useGET {
		httpReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	}
	httpReq.Header.Set("User-Agent", "Mozilla/5.0 (compatible; CyberStrikeAI-WebShell/1.0)")
	resp, err := h.client.Do(httpReq)
	if err != nil {
		return "", false, err.Error()
	}
	defer resp.Body.Close()
	out, _ := io.ReadAll(resp.Body)
	return string(out), resp.StatusCode == http.StatusOK, ""
}

// FileOpWithConnection performs a file operation on a specified WebShell connection (for MCP/Agent use)
// Supports: list, read, write
func (h *WebShellHandler) FileOpWithConnection(conn *database.WebShellConnection, action, path, content, targetPath string) (output string, ok bool, errMsg string) {
	if conn == nil {
		return "", false, "connection is nil"
	}
	action = strings.ToLower(strings.TrimSpace(action))
	shellType := strings.ToLower(strings.TrimSpace(conn.Type))
	if shellType == "" {
		shellType = "php"
	}
	var command string
	switch action {
	case "list":
		if path == "" {
			path = "."
		}
		if shellType == "asp" || shellType == "aspx" {
			command = "dir " + h.escapePath(strings.TrimSpace(path))
		} else {
			command = "ls -la " + h.escapePath(strings.TrimSpace(path))
		}
	case "read":
		path = strings.TrimSpace(path)
		if path == "" {
			return "", false, "path is required for read"
		}
		if shellType == "asp" || shellType == "aspx" {
			command = "type " + h.escapePath(path)
		} else {
			command = "cat " + h.escapePath(path)
		}
	case "write":
		path = strings.TrimSpace(path)
		if path == "" {
			return "", false, "path is required for write"
		}
		command = "echo " + h.escapeForEcho(content) + " > " + h.escapePath(path)
	default:
		return "", false, "unsupported action: " + action + " (supported: list, read, write)"
	}
	useGET := strings.ToUpper(strings.TrimSpace(conn.Method)) == "GET"
	cmdParam := strings.TrimSpace(conn.CmdParam)
	if cmdParam == "" {
		cmdParam = "cmd"
	}
	var httpReq *http.Request
	var err error
	if useGET {
		targetURL := h.buildExecURL(conn.URL, conn.Type, conn.Password, cmdParam, command)
		httpReq, err = http.NewRequest(http.MethodGet, targetURL, nil)
	} else {
		body := h.buildExecBody(conn.Type, conn.Password, cmdParam, command)
		httpReq, err = http.NewRequest(http.MethodPost, conn.URL, bytes.NewReader(body))
	}
	if err != nil {
		return "", false, err.Error()
	}
	if !useGET {
		httpReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	}
	httpReq.Header.Set("User-Agent", "Mozilla/5.0 (compatible; CyberStrikeAI-WebShell/1.0)")
	resp, err := h.client.Do(httpReq)
	if err != nil {
		return "", false, err.Error()
	}
	defer resp.Body.Close()
	out, _ := io.ReadAll(resp.Body)
	return string(out), resp.StatusCode == http.StatusOK, ""
}
