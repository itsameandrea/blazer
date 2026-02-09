module Blazer
  class Query < Record
    belongs_to :creator, optional: true, class_name: Blazer.user_class.to_s if Blazer.user_class
    has_many :checks, dependent: :destroy
    has_many :dashboard_queries, dependent: :destroy
    has_many :dashboards, through: :dashboard_queries
    has_many :audits

    has_neighbors :embedding if table_exists? && column_names.include?('embedding')

    validates :statement, presence: true

    scope :active, -> { column_names.include?('status') ? where(status: ['active', nil]) : all }
    scope :named, -> { where.not(name: '') }

    after_commit :enqueue_embedding, on: %i[create update], if: :embedding_needed?

    def to_param
      [id, name].compact.join('-').gsub("'", '').parameterize
    end

    def friendly_name
      name.to_s.sub(/\A[#*]/, '').gsub(/\[.+\]/, '').strip
    end

    def editable?(user)
      !persisted? || (name.present? && name.first != '*' && name.first != '#') || user == try(:creator)
    end

    def variables
      # don't require data_source to be loaded
      variables = Statement.new(statement).variables
      variables += ['cohort_period'] if cohort_analysis?
      variables
    end

    def cohort_analysis?
      # don't require data_source to be loaded
      Statement.new(statement).cohort_analysis?
    end

    def statement_object
      Statement.new(statement, data_source)
    end

    private

    def embedding_needed?
      Blazer::Ai.semantic_search? &&
        self.class.column_names.include?('embedding') &&
        name.present? &&
        (saved_change_to_name? || saved_change_to_description? || saved_change_to_statement?)
    end

    def enqueue_embedding
      Blazer::EmbedQueryJob.perform_later(id)
    end
  end
end
