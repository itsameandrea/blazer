# frozen_string_literal: true

module Blazer
  module Ai
    class QueryGenerator
      attr_reader :data_source

      def initialize(data_source)
        @data_source = data_source
      end

      def generate(prompt)
        chat = RubyLLM.chat(model: Ai.chat_model)
        chat.with_instructions(system_prompt)

        response = chat.ask(prompt)
        extract_sql(response.content)
      end

      private

      def system_prompt
        <<~PROMPT
          You are an expert SQL query writer for PostgreSQL databases.
          You write clean, efficient, read-only SQL queries.

          RULES:
          - Only generate SELECT statements. Never generate INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, or TRUNCATE.
          - Use standard PostgreSQL syntax.
          - Include helpful column aliases for readability.
          - When appropriate, use {variable_name} placeholders for user-supplied values (e.g., WHERE status = {status}).
          - Return ONLY the SQL query, no explanations or markdown fences.

          DATABASE SCHEMA:
          #{schema_context}
        PROMPT
      end

      def schema_context
        schema = data_source.schema
        schema.map do |table_info|
          qualified = if table_info[:schema].present? && table_info[:schema] != 'public'
                        "#{table_info[:schema]}.#{table_info[:table]}"
                      else
                        table_info[:table]
                      end

          columns = table_info[:columns].map { |c| "  #{c[:name]} (#{c[:data_type]})" }.join("\n")
          "#{qualified}:\n#{columns}"
        end.join("\n\n")
      end

      def extract_sql(content)
        sql = content.to_s.strip
        # Strip markdown code fences if present
        sql = sql.gsub(/\A```(?:sql)?\s*/i, '').gsub(/\s*```\z/, '')
        sql.strip
      end
    end
  end
end
