# frozen_string_literal: true

module Blazer
  module Mcp
    module Tools
      class GetQuery < ::MCP::Tool
        tool_name 'get_query'
        description 'Retrieve a saved query by ID including its SQL statement and metadata'

        input_schema(
          properties: {
            id: { type: 'integer', description: 'Query ID' }
          },
          required: ['id']
        )

        annotations(read_only_hint: true, destructive_hint: false, idempotent_hint: true)

        def self.call(id:, server_context:)
          query = Blazer::Query.find_by(id: id)

          unless query
            return ::MCP::Tool::Response.new(
              [{ type: 'text', text: 'Query not found' }],
              error: true
            )
          end

          output = {
            id: query.id,
            name: query.name,
            description: query.description,
            statement: query.statement,
            data_source: query.data_source,
            variables: query.variables,
            created_at: query.created_at,
            updated_at: query.updated_at
          }

          ::MCP::Tool::Response.new([{ type: 'text', text: output.to_json }])
        end
      end
    end
  end
end
