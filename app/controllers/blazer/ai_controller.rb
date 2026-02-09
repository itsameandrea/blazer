# frozen_string_literal: true

module Blazer
  class AiController < BaseController
    before_action :require_ai_enabled

    def generate
      sql = Blazer::Ai::QueryGenerator.new(selected_data_source).generate(params[:prompt].to_s)

      render json: { sql: sql }
    rescue StandardError => e
      render_unprocessable(e)
    end

    def explain
      explainer = Blazer::Ai::QueryExplainer.new
      explanation = explainer.explain(params[:statement].to_s, data_source: selected_data_source)

      render json: { explanation: explanation }
    rescue StandardError => e
      render_unprocessable(e)
    end

    def search
      searcher = Blazer::Ai::SemanticSearch.new
      results = searcher.search(params[:query].to_s, limit: search_limit)

      render json: results.map { |q|
        {
          id: q.id,
          name: q.name,
          description: q.description,
          creator: q.try(:creator).try(Blazer.user_name),
          vars: q.variables.join(', '),
          to_param: q.to_param
        }
      }
    rescue StandardError => e
      render_unprocessable(e)
    end

    private

    def require_ai_enabled
      render json: { error: 'AI features are not enabled' }, status: :forbidden unless Blazer::Ai.enabled?
    end

    def selected_data_source
      Blazer.data_sources[params[:data_source]] || Blazer.data_sources.values.first
    end

    def search_limit
      limit = params[:limit].to_i
      limit.positive? ? limit : 10
    end

    def render_unprocessable(error)
      render json: { error: error.message }, status: :unprocessable_entity
    end
  end
end
