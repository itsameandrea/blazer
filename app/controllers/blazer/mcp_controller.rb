module Blazer
  class McpController < BaseController
    skip_before_action :verify_authenticity_token

    def handle
      server = Blazer::McpServer.build(server_context: { user: blazer_user })
      result = server.handle_json(request.body.read)
      render json: result
    end
  end
end
