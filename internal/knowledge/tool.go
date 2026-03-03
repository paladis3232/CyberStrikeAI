package knowledge

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
	"strings"

	"cyberstrike-ai/internal/mcp"
	"cyberstrike-ai/internal/mcp/builtin"

	"go.uber.org/zap"
)

// RegisterKnowledgeTool registers knowledge retrieval tools with the MCP server
func RegisterKnowledgeTool(
	mcpServer *mcp.Server,
	retriever *Retriever,
	manager *Manager,
	logger *zap.Logger,
) {
	// register first tool: get the list of all available risk types
	listRiskTypesTool := mcp.Tool{
		Name:             builtin.ToolListKnowledgeRiskTypes,
		Description:      "Get the list of all available risk types (risk_type) in the knowledge base. Before searching the knowledge base, you can call this tool to retrieve the available risk types, then use the correct risk type for a precise search. This can greatly reduce retrieval time and improve retrieval accuracy.",
		ShortDescription: "Get the list of all available risk types in the knowledge base",
		InputSchema: map[string]interface{}{
			"type":       "object",
			"properties": map[string]interface{}{},
			"required":   []string{},
		},
	}

	listRiskTypesHandler := func(ctx context.Context, args map[string]interface{}) (*mcp.ToolResult, error) {
		categories, err := manager.GetCategories()
		if err != nil {
			logger.Error("failed to get risk type list", zap.Error(err))
			return &mcp.ToolResult{
				Content: []mcp.Content{
					{
						Type: "text",
						Text: fmt.Sprintf("failed to get risk type list: %v", err),
					},
				},
				IsError: true,
			}, nil
		}

		if len(categories) == 0 {
			return &mcp.ToolResult{
				Content: []mcp.Content{
					{
						Type: "text",
						Text: "No risk types are currently available in the knowledge base.",
					},
				},
			}, nil
		}

		var resultText strings.Builder
		resultText.WriteString(fmt.Sprintf("The knowledge base contains %d risk type(s):\n\n", len(categories)))
		for i, category := range categories {
			resultText.WriteString(fmt.Sprintf("%d. %s\n", i+1, category))
		}
		resultText.WriteString("\nTip: When calling the " + builtin.ToolSearchKnowledgeBase + " tool, you can use one of the above risk types as the risk_type parameter to narrow the search scope and improve retrieval efficiency.")

		return &mcp.ToolResult{
			Content: []mcp.Content{
				{
					Type: "text",
					Text: resultText.String(),
				},
			},
		}, nil
	}

	mcpServer.RegisterTool(listRiskTypesTool, listRiskTypesHandler)
	logger.Info("risk type list tool registered", zap.String("toolName", listRiskTypesTool.Name))

	// register second tool: search the knowledge base (preserves original functionality)
	searchTool := mcp.Tool{
		Name:             builtin.ToolSearchKnowledgeBase,
		Description:      "Search the knowledge base for relevant security knowledge. Use this tool when you need to learn about specific vulnerability types, attack techniques, detection methods, or other security topics. The tool uses vector retrieval and hybrid search technology to automatically find the most relevant knowledge fragments based on semantic similarity and keyword matching. Tip: before searching, you can call the " + builtin.ToolListKnowledgeRiskTypes + " tool to get the available risk types, then use the correct risk_type parameter for a precise search to greatly reduce retrieval time.",
		ShortDescription: "Search the knowledge base for security knowledge (supports vector retrieval and hybrid search)",
		InputSchema: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"query": map[string]interface{}{
					"type":        "string",
					"description": "The search query describing the security knowledge topic you want to learn about",
				},
				"risk_type": map[string]interface{}{
					"type":        "string",
					"description": "Optional: specify a risk type (e.g. SQL Injection, XSS, File Upload, etc.). It is recommended to first call the " + builtin.ToolListKnowledgeRiskTypes + " tool to get the list of available risk types, then use the correct risk type for a precise search to greatly reduce retrieval time. If not specified, all types will be searched.",
				},
			},
			"required": []string{"query"},
		},
	}

	searchHandler := func(ctx context.Context, args map[string]interface{}) (*mcp.ToolResult, error) {
		query, ok := args["query"].(string)
		if !ok || query == "" {
			return &mcp.ToolResult{
				Content: []mcp.Content{
					{
						Type: "text",
						Text: "error: query parameter cannot be empty",
					},
				},
				IsError: true,
			}, nil
		}

		riskType := ""
		if rt, ok := args["risk_type"].(string); ok && rt != "" {
			riskType = rt
		}

		logger.Info("executing knowledge base retrieval",
			zap.String("query", query),
			zap.String("riskType", riskType),
		)

		// execute retrieval
		searchReq := &SearchRequest{
			Query:    query,
			RiskType: riskType,
			TopK:     5,
		}

		results, err := retriever.Search(ctx, searchReq)
		if err != nil {
			logger.Error("knowledge base retrieval failed", zap.Error(err))
			return &mcp.ToolResult{
				Content: []mcp.Content{
					{
						Type: "text",
						Text: fmt.Sprintf("retrieval failed: %v", err),
					},
				},
				IsError: true,
			}, nil
		}

		if len(results) == 0 {
			return &mcp.ToolResult{
				Content: []mcp.Content{
					{
						Type: "text",
						Text: fmt.Sprintf("no knowledge found related to query '%s'. Suggestions:\n1. Try different keywords\n2. Check that the risk type is correct\n3. Confirm the knowledge base contains relevant content", query),
					},
				},
			}, nil
		}

		// format results
		var resultText strings.Builder

		// sort by hybrid score first to ensure document order is by hybrid score (core of hybrid retrieval)
		sort.Slice(results, func(i, j int) bool {
			return results[i].Score > results[j].Score
		})

		// group results by document for better context display
		// use an ordered slice to maintain document order (by highest hybrid score)
		type itemGroup struct {
			itemID   string
			results  []*RetrievalResult
			maxScore float64 // highest hybrid score for this document
		}
		itemGroups := make([]*itemGroup, 0)
		itemMap := make(map[string]*itemGroup)

		for _, result := range results {
			itemID := result.Item.ID
			group, exists := itemMap[itemID]
			if !exists {
				group = &itemGroup{
					itemID:   itemID,
					results:  make([]*RetrievalResult, 0),
					maxScore: result.Score,
				}
				itemMap[itemID] = group
				itemGroups = append(itemGroups, group)
			}
			group.results = append(group.results, result)
			if result.Score > group.maxScore {
				group.maxScore = result.Score
			}
		}

		// sort document groups by highest hybrid score
		sort.Slice(itemGroups, func(i, j int) bool {
			return itemGroups[i].maxScore > itemGroups[j].maxScore
		})

		// collect retrieved knowledge item IDs (for logging)
		retrievedItemIDs := make([]string, 0, len(itemGroups))

		resultText.WriteString(fmt.Sprintf("Found %d relevant knowledge entries (with context expansion):\n\n", len(results)))

		resultIndex := 1
		for _, group := range itemGroups {
			itemResults := group.results
			// find the one with the highest hybrid score as the main result (using hybrid score, not similarity)
			mainResult := itemResults[0]
			maxScore := mainResult.Score
			for _, result := range itemResults {
				if result.Score > maxScore {
					maxScore = result.Score
					mainResult = result
				}
			}

			// sort by chunk_index to ensure logical reading order (original document order)
			sort.Slice(itemResults, func(i, j int) bool {
				return itemResults[i].Chunk.ChunkIndex < itemResults[j].Chunk.ChunkIndex
			})

			// display main result (highest hybrid score, showing both similarity and hybrid score)
			resultText.WriteString(fmt.Sprintf("--- Result %d (similarity: %.2f%%, hybrid score: %.2f%%) ---\n",
				resultIndex, mainResult.Similarity*100, mainResult.Score*100))
			resultText.WriteString(fmt.Sprintf("Source: [%s] %s (ID: %s)\n", mainResult.Item.Category, mainResult.Item.Title, mainResult.Item.ID))

			// display all chunks in logical order (including main result and expanded chunks)
			if len(itemResults) == 1 {
				// only one chunk, display directly
				resultText.WriteString(fmt.Sprintf("Content fragment:\n%s\n", mainResult.Chunk.ChunkText))
			} else {
				// multiple chunks, display in logical order
				resultText.WriteString("Content fragments (in document order):\n")
				for i, result := range itemResults {
					// mark the main result
					marker := ""
					if result.Chunk.ID == mainResult.Chunk.ID {
						marker = " [primary match]"
					}
					resultText.WriteString(fmt.Sprintf("  [Fragment %d%s]\n%s\n", i+1, marker, result.Chunk.ChunkText))
				}
			}
			resultText.WriteString("\n")

			if !contains(retrievedItemIDs, group.itemID) {
				retrievedItemIDs = append(retrievedItemIDs, group.itemID)
			}
			resultIndex++
		}

		// append metadata at the end of results (JSON format, for extracting knowledge item IDs)
		// use a special marker to avoid interfering with AI reading results
		if len(retrievedItemIDs) > 0 {
			metadataJSON, _ := json.Marshal(map[string]interface{}{
				"_metadata": map[string]interface{}{
					"retrievedItemIDs": retrievedItemIDs,
				},
			})
			resultText.WriteString(fmt.Sprintf("\n<!-- METADATA: %s -->", string(metadataJSON)))
		}

		// log retrieval (async, non-blocking)
		// note: conversationID and messageID are not available here; they should be logged at the Agent level
		// actual logging should be done in the Agent's progressCallback

		return &mcp.ToolResult{
			Content: []mcp.Content{
				{
					Type: "text",
					Text: resultText.String(),
				},
			},
		}, nil
	}

	mcpServer.RegisterTool(searchTool, searchHandler)
	logger.Info("knowledge retrieval tool registered", zap.String("toolName", searchTool.Name))
}

// contains checks whether a slice contains an element
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

// GetRetrievalMetadata extracts retrieval metadata from a tool call (for logging)
func GetRetrievalMetadata(args map[string]interface{}) (query string, riskType string) {
	if q, ok := args["query"].(string); ok {
		query = q
	}
	if rt, ok := args["risk_type"].(string); ok {
		riskType = rt
	}
	return
}

// FormatRetrievalResults formats retrieval results as a string (for logging)
func FormatRetrievalResults(results []*RetrievalResult) string {
	if len(results) == 0 {
		return "no relevant results found"
	}

	var builder strings.Builder
	builder.WriteString(fmt.Sprintf("retrieved %d result(s):\n", len(results)))

	itemIDs := make(map[string]bool)
	for i, result := range results {
		builder.WriteString(fmt.Sprintf("%d. [%s] %s (similarity: %.2f%%)\n",
			i+1, result.Item.Category, result.Item.Title, result.Similarity*100))
		itemIDs[result.Item.ID] = true
	}

	// return knowledge item ID list (JSON format)
	ids := make([]string, 0, len(itemIDs))
	for id := range itemIDs {
		ids = append(ids, id)
	}
	idsJSON, _ := json.Marshal(ids)
	builder.WriteString(fmt.Sprintf("\nretrieved knowledge item IDs: %s", string(idsJSON)))

	return builder.String()
}
