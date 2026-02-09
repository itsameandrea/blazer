# frozen_string_literal: true

module Blazer
  module Mcp
    module Tools
      class ListSchemas < ::MCP::Tool
        tool_name 'list_schemas'
        description 'List all database tables and their columns with data types'

        input_schema(
          properties: {
            data_source: {
              type: 'string',
              description: 'Data source name (defaults to first available)'
            }
          }
        )

        annotations(read_only_hint: true, destructive_hint: false, idempotent_hint: true)

        def self.call(server_context:, data_source: nil)
          ds = resolve_data_source(data_source)
          schema = ds.schema

          formatted = schema.map do |table_info|
            qualified = table_info[:schema] == 'public' ? table_info[:table] : "#{table_info[:schema]}.#{table_info[:table]}"
            columns = table_info[:columns].map { |c| "  #{c[:name]} #{c[:data_type]}" }.join("\n")
            "#{qualified}\n#{columns}"
          end.join("\n\n")

          ::MCP::Tool::Response.new([{ type: 'text', text: formatted }])
        end

        def self.resolve_data_source(name)
          if name.present?
            Blazer.data_sources[name]
          else
            Blazer.data_sources.values.first
          end
        end
      end
    end
  end
end
