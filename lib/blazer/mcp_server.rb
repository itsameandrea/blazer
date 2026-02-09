# frozen_string_literal: true

require 'mcp'

require_relative 'mcp/tools/list_schemas'
require_relative 'mcp/tools/run_query'
require_relative 'mcp/tools/search_queries'
require_relative 'mcp/tools/get_query'
require_relative 'mcp/tools/list_data_sources'

module Blazer
  module McpServer
    TOOLS = [
      Mcp::Tools::ListSchemas,
      Mcp::Tools::RunQuery,
      Mcp::Tools::SearchQueries,
      Mcp::Tools::GetQuery,
      Mcp::Tools::ListDataSources
    ].freeze

    def self.build(server_context: {})
      ::MCP::Server.new(
        name: 'wezer',
        version: Blazer::VERSION,
        description: 'SQL analytics engine — query, search, and explore your data',
        tools: TOOLS,
        server_context: server_context
      )
    end
  end
end
