namespace :blazer do
  namespace :tailwindcss do
    desc 'Build Tailwind CSS for Blazer'
    task build: :environment do
      require 'tailwindcss/ruby'

      input  = Blazer::Engine.root.join('app/assets/tailwind/blazer/application.css')
      output = Blazer::Engine.root.join('app/assets/builds/blazer/tailwind.css')

      FileUtils.mkdir_p(output.dirname)

      command = [
        Tailwindcss::Ruby.executable,
        '-i', input.to_s,
        '-o', output.to_s,
        '--minify'
      ]

      Dir.chdir(Blazer::Engine.root) do
        system(*command, exception: true)
      end
    end
  end
end

Rake::Task['assets:precompile'].enhance(['blazer:tailwindcss:build']) if Rake::Task.task_defined?('assets:precompile')
