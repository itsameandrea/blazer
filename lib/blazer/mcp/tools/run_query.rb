# frozen_string_literal: true

module Blazer
  module Mcp
    module Tools
      class RunQuery < ::MCP::Tool
        tool_name 'run_query'
        description 'Execute a read-only SQL query against the database and return results as JSON'

        input_schema(
          properties: {
            sql: { type: 'string', description: 'SQL SELECT statement to execute' },
            data_source: { type: 'string', description: 'Data source name (defaults to first available)' },
            limit: { type: 'integer', description: 'Maximum rows to return (default 100)' }
          },
          required: ['sql']
        )

        annotations(read_only_hint: true, destructive_hint: false, idempotent_hint: true)

        FORBIDDEN_KEYWORDS = /\b(INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|GRANT|REVOKE)\b/i

        def self.call(sql:, server_context:, data_source: nil, limit: 100)
          if sql.match?(FORBIDDEN_KEYWORDS)
            return ::MCP::Tool::Response.new(
              [{ type: 'text', text: 'Error: Only SELECT queries are allowed' }],
              error: true
            )
          end

          ds = ListSchemas.resolve_data_source(data_source)
          limited_sql = apply_limit(sql, limit)
          statement = Blazer::Statement.new(limited_sql, ds)
          result = ds.run_statement(statement)

          if result.error
            ::MCP::Tool::Response.new(
              [{ type: 'text', text: "Error: #{result.error}" }],
              error: true
            )
          else
            output = {
              columns: result.columns,
              rows: result.rows.first(limit),
              row_count: result.rows.size,
              truncated: result.rows.size > limit
            }
            ::MCP::Tool::Response.new([{ type: 'text', text: output.to_json }])
          end
        end

        def self.apply_limit(sql, limit)
          return sql if sql.match?(/\bLIMIT\s+\d+/i)

          "#{sql.chomp(';')} LIMIT #{limit.to_i}"
        end
      end
    end
  end
end
