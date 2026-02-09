# frozen_string_literal: true

module Blazer
  module Mcp
    module Tools
      class SearchQueries < ::MCP::Tool
        tool_name 'search_queries'
        description 'Search saved queries by name, description, or natural language intent'

        input_schema(
          properties: {
            query: { type: 'string', description: 'Search term or natural language description' },
            limit: { type: 'integer', description: 'Maximum results (default 10)' }
          },
          required: ['query']
        )

        annotations(read_only_hint: true, destructive_hint: false, idempotent_hint: true)

        def self.call(query:, server_context:, limit: 10)
          results = Blazer::Ai::SemanticSearch.new.search(query, limit: limit)

          formatted = results.map do |q|
            { id: q.id, name: q.name, description: q.description, variables: q.variables }
          end

          ::MCP::Tool::Response.new([{ type: 'text', text: formatted.to_json }])
        end
      end
    end
  end
end
