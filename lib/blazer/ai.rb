# frozen_string_literal: true

require 'ruby_llm'

require_relative 'ai/query_generator'
require_relative 'ai/semantic_search'
require_relative 'ai/query_explainer'

module Blazer
  module Ai
    class << self
      def enabled?
        Blazer.ai_enabled
      end

      def configure_ruby_llm!
        RubyLLM.configure do |c|
          c.openai_api_key       = resolve_key('openai_api_key',    'OPENAI_API_KEY')
          c.anthropic_api_key    = resolve_key('anthropic_api_key', 'ANTHROPIC_API_KEY')
          c.gemini_api_key       = resolve_key('gemini_api_key',    'GEMINI_API_KEY')
          c.bedrock_region       = resolve_key('bedrock_region',    'AWS_REGION')
          c.bedrock_api_key      = resolve_key('bedrock_api_key', 'AWS_ACCESS_KEY_ID')
          c.bedrock_secret_key   = resolve_key('bedrock_secret_key', 'AWS_SECRET_ACCESS_KEY')
          c.deepseek_api_key     = resolve_key('deepseek_api_key',  'DEEPSEEK_API_KEY')
          c.ollama_api_base      = resolve_key('ollama_api_base',   'OLLAMA_API_BASE')
          c.request_timeout      = ai_settings.fetch('timeout', 30)
        end

        RubyLLM.models.refresh!
      end

      def chat_model
        ai_settings.fetch('model', 'claude-sonnet-4-5')
      end

      def embedding_model
        ai_settings.fetch('embedding_model', 'text-embedding-3-small')
      end

      def embedding_dimensions
        ai_settings.fetch('embedding_dimensions', 1536)
      end

      def query_generation?
        enabled? && ai_settings.fetch('query_generation', true)
      end

      def semantic_search?
        enabled? && ai_settings.fetch('semantic_search', true)
      end

      def mcp?
        Blazer.settings.dig('mcp', 'enabled') || false
      end

      private

      def ai_settings
        Blazer.settings.fetch('ai', {})
      end

      def resolve_key(setting_name, env_var)
        ai_settings[setting_name] || ENV[env_var]
      end
    end
  end
end
