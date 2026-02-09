require_relative 'lib/blazer/version'

Gem::Specification.new do |spec|
  spec.name          = 'blazer'
  spec.version       = Blazer::VERSION
  spec.summary       = 'Explore your data with SQL. Easily create charts and dashboards, and share them with your team.'
  spec.homepage      = 'https://github.com/ankane/blazer'
  spec.license       = 'MIT'

  spec.author        = 'Andrew Kane'
  spec.email         = 'andrew@ankane.org'

  spec.files         = Dir['*.{md,txt}', '{app,config,exe,lib,licenses}/**/*']
  spec.bindir        = 'exe'
  spec.executables   = ['blazer-mcp']
  spec.require_path  = 'lib'

  spec.required_ruby_version = '>= 3.2'

  spec.add_dependency 'activerecord', '>= 7.1'
  spec.add_dependency 'chartkick', '>= 5'
  spec.add_dependency 'csv'
  spec.add_dependency 'importmap-rails', '>= 2.0'
  spec.add_dependency 'railties', '>= 7.1'
  spec.add_dependency 'safely_block', '>= 0.4'
  spec.add_dependency 'stimulus-rails', '>= 1.3'
  spec.add_dependency 'tailwindcss-rails', '>= 4.0'

  # AI-native features
  spec.add_dependency 'mcp', '>= 0.6'
  spec.add_dependency 'neighbor', '>= 0.6'
  spec.add_dependency 'ruby_llm', '>= 1.9'
end
