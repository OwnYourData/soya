class ApplicationController < ActionController::Base
    include ActionController::RequestForgeryProtection
    protect_from_forgery with: :exception

    def version
        render json: {"service": "soya repository", "version": VERSION.to_s, "oydid-gem": Gem.loaded_specs["oydid"].version.to_s}.to_json,
               status: 200
    end

    def missing
        render json: {"error": "invalid path"},
               status: 404
    end
end