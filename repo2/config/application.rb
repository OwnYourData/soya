require_relative "boot"
require "rails/all"
Bundler.require(*Rails.groups)

module DcBase
  class Application < Rails::Application
    config.load_defaults 7.0
    config.api_only = false

    config.middleware.use ActionDispatch::Session::CookieStore
    config.middleware.use ActionDispatch::Flash
    config.middleware.use Rack::MethodOverride
    config.middleware.use ActionDispatch::Cookies
    config.action_dispatch.cookies_same_site_protection = :lax
  end
end
