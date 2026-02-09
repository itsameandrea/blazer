# frozen_string_literal: true

module Blazer
  module Mcp
    module Tools
      class ListDataSources < ::MCP::Tool
        tool_name 'list_data_sources'
        description 'List all available database data sources'

        annotations(read_only_hint: true, destructive_hint: false, idempotent_hint: true)

        def self.call(server_context:)
          sources = Blazer.data_sources.map do |id, ds|
            { id: id, name: ds.name, adapter: ds.adapter }
          end

          ::MCP::Tool::Response.new([{ type: 'text', text: sources.to_json }])
        end
      end
    end
  end
end
