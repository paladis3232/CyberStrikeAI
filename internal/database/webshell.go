package database

import (
	"database/sql"
	"time"

	"go.uber.org/zap"
)

// WebShellConnection holds the configuration for a WebShell connection
type WebShellConnection struct {
	ID        string    `json:"id"`
	URL       string    `json:"url"`
	Password  string    `json:"password"`
	Type      string    `json:"type"`
	Method    string    `json:"method"`
	CmdParam  string    `json:"cmdParam"`
	Remark    string    `json:"remark"`
	CreatedAt time.Time `json:"createdAt"`
}

// ListWebshellConnections returns all WebShell connections ordered by creation time (newest first)
func (db *DB) ListWebshellConnections() ([]WebShellConnection, error) {
	query := `
		SELECT id, url, password, type, method, cmd_param, remark, created_at
		FROM webshell_connections
		ORDER BY created_at DESC
	`
	rows, err := db.Query(query)
	if err != nil {
		db.logger.Error("failed to query webshell connection list", zap.Error(err))
		return nil, err
	}
	defer rows.Close()

	var list []WebShellConnection
	for rows.Next() {
		var c WebShellConnection
		err := rows.Scan(&c.ID, &c.URL, &c.Password, &c.Type, &c.Method, &c.CmdParam, &c.Remark, &c.CreatedAt)
		if err != nil {
			db.logger.Warn("failed to scan webshell connection row", zap.Error(err))
			continue
		}
		list = append(list, c)
	}
	return list, rows.Err()
}

// GetWebshellConnection retrieves a single WebShell connection by ID
func (db *DB) GetWebshellConnection(id string) (*WebShellConnection, error) {
	query := `
		SELECT id, url, password, type, method, cmd_param, remark, created_at
		FROM webshell_connections WHERE id = ?
	`
	var c WebShellConnection
	err := db.QueryRow(query, id).Scan(&c.ID, &c.URL, &c.Password, &c.Type, &c.Method, &c.CmdParam, &c.Remark, &c.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		db.logger.Error("failed to query webshell connection", zap.Error(err), zap.String("id", id))
		return nil, err
	}
	return &c, nil
}

// CreateWebshellConnection inserts a new WebShell connection record
func (db *DB) CreateWebshellConnection(c *WebShellConnection) error {
	query := `
		INSERT INTO webshell_connections (id, url, password, type, method, cmd_param, remark, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`
	_, err := db.Exec(query, c.ID, c.URL, c.Password, c.Type, c.Method, c.CmdParam, c.Remark, c.CreatedAt)
	if err != nil {
		db.logger.Error("failed to create webshell connection", zap.Error(err), zap.String("id", c.ID))
		return err
	}
	return nil
}

// UpdateWebshellConnection updates an existing WebShell connection record
func (db *DB) UpdateWebshellConnection(c *WebShellConnection) error {
	query := `
		UPDATE webshell_connections
		SET url = ?, password = ?, type = ?, method = ?, cmd_param = ?, remark = ?
		WHERE id = ?
	`
	result, err := db.Exec(query, c.URL, c.Password, c.Type, c.Method, c.CmdParam, c.Remark, c.ID)
	if err != nil {
		db.logger.Error("failed to update webshell connection", zap.Error(err), zap.String("id", c.ID))
		return err
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

// DeleteWebshellConnection removes a WebShell connection record by ID
func (db *DB) DeleteWebshellConnection(id string) error {
	result, err := db.Exec(`DELETE FROM webshell_connections WHERE id = ?`, id)
	if err != nil {
		db.logger.Error("failed to delete webshell connection", zap.Error(err), zap.String("id", id))
		return err
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		return sql.ErrNoRows
	}
	return nil
}
