# frozen_string_literal: true

module Blazer
  module Ai
    class QueryExplainer
      def explain(statement, data_source: nil)
        chat = RubyLLM.chat(model: Ai.chat_model)
        chat.with_instructions(system_prompt(data_source))

        response = chat.ask("Explain this SQL query:\n\n#{statement}")
        response.content.to_s.strip
      end

      private

      def system_prompt(data_source)
        prompt = <<~PROMPT
          You are a SQL expert. Explain the given SQL query in plain English.
          Be concise — 2-4 sentences max. Focus on WHAT the query does, not HOW.
          Write for a non-technical audience. Use bullet points only if the query does multiple distinct things.
        PROMPT

        prompt += "\n\nThis query runs against a PostgreSQL database." if data_source

        prompt
      end
    end
  end
end
