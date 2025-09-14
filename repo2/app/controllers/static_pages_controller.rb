class StaticPagesController < ApplicationController
    include ApplicationHelper

    def register

    end

    def user
        token = cookies[:Authorization].split(' ').last rescue nil
puts "token: " + token.to_s
        if token.nil?
            redirect '/'
            return
        end
        @at = Doorkeeper::AccessToken.find_by_token(token) rescue nil
puts "AccessToken: " + @at.to_s
        if @at.nil?
            redirect '/'
            return
        end
        @oauth = Doorkeeper::Application.find(@at.application_id) rescue nil
puts "OauthApp: " + @oauth.to_s
        if @oauth.nil?
            redirect '/'
            return
        end
        @user = User.find_by_name(@oauth.name)
puts "User: " + @user.to_s
        if @user.nil?
            redirect '/'
            return
        end
        @org = Organization.find(@oauth.organization_id)        
    end
end