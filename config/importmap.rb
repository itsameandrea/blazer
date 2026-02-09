pin 'blazer/application', to: 'blazer/application.js'

pin '@hotwired/stimulus', to: 'stimulus.min.js', preload: true
pin '@hotwired/stimulus-loading', to: 'stimulus-loading.js', preload: true

pin_all_from Blazer::Engine.root.join('app/javascript/blazer/controllers'), under: 'blazer/controllers'
pin_all_from Blazer::Engine.root.join('app/javascript/blazer/utilities'), under: 'blazer/utilities'
