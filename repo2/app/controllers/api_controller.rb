class ApiController < ApplicationController
    def doorkeeper_unauthorized_render_options(error: nil)
        { json: { error: "Not authorized" } }
    end

    if !(ENV["AUTH"].to_s == "" || ENV["AUTH"].to_s.downcase == "false")
        # !!!fix-me ENV["AUTH"] == "optional" handling !!!
        if ENV["AUTH"].to_s.downcase != "optional"
            before_action -> { doorkeeper_authorize! :read, :write, :admin }, except: [:active, :idaustria]
        end
    end
end