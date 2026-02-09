require 'rails/generators/active_record'

module Blazer
  module Generators
    class AiGenerator < Rails::Generators::Base
      include ActiveRecord::Generators::Migration
      source_root File.join(__dir__, 'templates')

      def copy_migration
        migration_template 'ai.rb', 'db/migrate/add_blazer_ai.rb', migration_version: migration_version
      end

      def migration_version
        "[#{ActiveRecord::VERSION::MAJOR}.#{ActiveRecord::VERSION::MINOR}]"
      end
    end
  end
end
