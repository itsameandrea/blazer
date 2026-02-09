# frozen_string_literal: true

module Blazer
  module Ai
    class SemanticSearch
      def search(query_text, limit: 10)
        return keyword_fallback(query_text, limit) unless Ai.semantic_search? && embedding_column?

        keyword_results  = keyword_scope(query_text).limit(20).load_async
        semantic_results = semantic_scope(query_text).limit(20).load_async

        Neighbor::Reranking.rrf(keyword_results, semantic_results)
                           .first(limit)
                           .map { |r| r[:result] }
      rescue StandardError => e
        Rails.logger.warn "[blazer ai] Semantic search failed: #{e.message}, falling back to keyword"
        keyword_fallback(query_text, limit)
      end

      def embed_query(query)
        return unless Ai.semantic_search? && embedding_column?

        text = embedding_text_for(query)
        embedding = RubyLLM.embed(text, model: Ai.embedding_model)
        query.update_column(:embedding, embedding.vectors.first)
      end

      def embed_all(batch_size: 50)
        return unless Ai.semantic_search? && embedding_column?

        Blazer::Query.named.where(embedding: nil).find_in_batches(batch_size: batch_size) do |batch|
          texts = batch.map { |q| embedding_text_for(q) }
          result = RubyLLM.embed(texts, model: Ai.embedding_model)

          batch.each_with_index do |query, i|
            query.update_column(:embedding, result.vectors[i])
          end
        end
      end

      private

      def semantic_scope(query_text)
        embedding = RubyLLM.embed(query_text, model: Ai.embedding_model)
        Blazer::Query.named.active
                     .nearest_neighbors(:embedding, embedding.vectors.first, distance: 'cosine')
      end

      def keyword_scope(query_text)
        Blazer::Query.named.active
                     .where(
                       "to_tsvector('english', name || ' ' || COALESCE(description, '')) @@ plainto_tsquery('english', ?)",
                       query_text
                     )
                     .order(
                       Arel.sql(
                         Blazer::Query.sanitize_sql_array([
                                                            "ts_rank_cd(to_tsvector('english', name || ' ' || COALESCE(description, '')), plainto_tsquery('english', ?)) DESC",
                                                            query_text
                                                          ])
                       )
                     )
      end

      def keyword_fallback(query_text, limit)
        keyword_scope(query_text).limit(limit).to_a
      end

      def embedding_text_for(query)
        [query.name, query.description, query.statement].compact.join(' | ')
      end

      def embedding_column?
        Blazer::Query.column_names.include?('embedding')
      end
    end
  end
end
