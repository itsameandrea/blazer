module Blazer
  class EmbedQueryJob < ApplicationJob
    queue_as :default

    def perform(query_id)
      query = Blazer::Query.find_by(id: query_id)
      return unless query

      Blazer::Ai::SemanticSearch.new.embed_query(query)
    end
  end
end
