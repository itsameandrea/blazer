module Blazer
  class Engine < ::Rails::Engine
    isolate_namespace Blazer

    initializer 'blazer' do |app|
      if app.config.respond_to?(:assets) && defined?(Sprockets)
        if Sprockets::VERSION.to_i >= 4
          app.config.assets.precompile += [
            'blazer/application.js',
            'blazer/application.css',
            'blazer/tailwind.css',
            'blazer/favicon.png'
          ]
        else
          # use a proc instead of a string
          app.config.assets.precompile << proc { |path| path =~ %r{\Ablazer/application\.(js|css)\z} }
          app.config.assets.precompile << proc { |path| path == 'blazer/tailwind.css' }
          app.config.assets.precompile << proc { |path| path == 'blazer/favicon.png' }
        end
      end

      app.config.assets.paths << root.join('app/assets/builds') if app.config.respond_to?(:assets)

      if defined?(Importmap::Engine) && app.config.respond_to?(:importmap)
        app.config.importmap.paths << root.join('config/importmap.rb')
        app.config.importmap.cache_sweepers << root.join('app/javascript')
      end

      Blazer.time_zone ||= Blazer.settings['time_zone'] || Time.zone
      Blazer.audit = Blazer.settings.key?('audit') ? Blazer.settings['audit'] : true
      Blazer.user_name = Blazer.settings['user_name'] if Blazer.settings['user_name']
      Blazer.from_email = Blazer.settings['from_email'] if Blazer.settings['from_email']
      Blazer.before_action = Blazer.settings['before_action_method'] if Blazer.settings['before_action_method']
      Blazer.check_schedules = Blazer.settings['check_schedules'] if Blazer.settings.key?('check_schedules')
      Blazer.cache ||= Rails.cache

      Blazer.anomaly_checks = Blazer.settings['anomaly_checks'] || false
      Blazer.forecasting = Blazer.settings['forecasting'] || false
      Blazer.async = Blazer.settings['async'] || false
      Blazer.images = Blazer.settings['images'] || false
      Blazer.override_csp = Blazer.settings['override_csp'] || false
      Blazer.slack_oauth_token = Blazer.settings['slack_oauth_token'] || ENV['BLAZER_SLACK_OAUTH_TOKEN']
      Blazer.slack_webhook_url = Blazer.settings['slack_webhook_url'] || ENV['BLAZER_SLACK_WEBHOOK_URL']
      Blazer.mapbox_access_token = Blazer.settings['mapbox_access_token'] || ENV['MAPBOX_ACCESS_TOKEN']

      Blazer.ai_enabled = Blazer.settings.dig('ai', 'enabled') || false
      Blazer::Ai.configure_ruby_llm! if Blazer.ai_enabled
    end
  end
end
