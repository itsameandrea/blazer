Blazer::Engine.routes.draw do
  resources :queries do
    post :run, on: :collection # err on the side of caution
    post :cancel, on: :collection
    post :refresh, on: :member
    get :tables, on: :collection
    get :schema, on: :collection
    get :docs, on: :collection
  end

  resources :checks, except: [:show] do
    get :run, on: :member
  end

  resources :dashboards, except: [:index] do
    post :refresh, on: :member
  end

  if Blazer.uploads?
    resources :uploads do
    end
  end

  if Blazer.settings.dig('ai', 'enabled')
    post 'ai/generate', to: 'ai#generate'
    post 'ai/explain', to: 'ai#explain'
    get 'ai/search', to: 'ai#search'
  end

  post 'mcp', to: 'mcp#handle' if Blazer.settings.dig('mcp', 'enabled')

  post 'mcp', to: 'mcp#handle' if Blazer::Ai.mcp?

  root to: 'queries#home'
end
