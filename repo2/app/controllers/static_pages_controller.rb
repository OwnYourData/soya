class StaticPagesController < ApplicationController
    include ApplicationHelper

    before_action :authenticate_from_cookie!, only: [:user, :user_update]

    # GET /soya/register - registration form
    def register
        if registration_closed?
            redirect_to '/'
            return
        end
    end

    # POST /soya/register - create organization, user, and OAuth credentials
    def register_create
        if registration_closed?
            redirect_to '/'
            return
        end

        org_name  = params[:organization].to_s.strip
        user_name = params[:username].to_s.strip
        full_name = params[:full_name].to_s.strip

        if org_name.empty? || user_name.empty?
            flash.now[:error] = "Organization and user name are required."
            render :register, status: :unprocessable_entity
            return
        end

        unless user_name.match?(/\A[a-zA-Z0-9._\-]+\z/)
            flash.now[:error] = "User name may only contain letters, digits, '.', '_' and '-'."
            render :register, status: :unprocessable_entity
            return
        end

        @org = Organization.where(name: org_name, deleted: false).first_or_create

        if User.where(name: user_name, organization_id: @org.id, deleted: false).exists?
            flash.now[:error] = "User '#{user_name}' already exists in organization '#{org_name}'."
            render :register, status: :unprocessable_entity
            return
        end

        @user = User.new(
            name: user_name,
            full_name: full_name,
            organization_id: @org.id)

        unless @user.save
            flash.now[:error] = "Could not create user: " + @user.errors.full_messages.join(", ")
            render :register, status: :unprocessable_entity
            return
        end

        # each user authenticates via its own OAuth (client credentials) application;
        # uid/secret are shown exactly once on the confirmation page
        @oauth = Doorkeeper::Application.new(
            name: user_name,
            organization_id: @org.id,
            redirect_uri: "urn:ietf:wg:oauth:2.0:oob",
            scopes: default_user_scopes)

        unless @oauth.save
            @user.destroy
            flash.now[:error] = "Could not create credentials: " + @oauth.errors.full_messages.join(", ")
            render :register, status: :unprocessable_entity
            return
        end

        render :registered
    end

    # GET /soya/user - profile page with edit form
    def user
    end

    # POST /soya/user - update the current user's profile
    def user_update
        @user.full_name = params[:full_name].to_s.strip
        if @user.save
            flash.now[:notice] = "Profile updated."
        else
            flash.now[:error] = "Could not update profile: " + @user.errors.full_messages.join(", ")
        end
        render :user
    end

    private

    # registration can be disabled for closed deployments
    # by setting the environment variable REGISTRATION=closed
    def registration_closed?
        ENV["REGISTRATION"].to_s.downcase == "closed"
    end

    def default_user_scopes
        ENV["USER_SCOPES"].to_s.strip.empty? ? "read write" : ENV["USER_SCOPES"].to_s.strip
    end

    # resolves the current user from the Authorization cookie
    # (bearer token issued by Doorkeeper via /oauth/token)
    def authenticate_from_cookie!
        token = cookies[:Authorization].to_s.split(' ').last rescue nil
        if token.nil?
            redirect_to '/'
            return
        end
        @at = Doorkeeper::AccessToken.find_by_token(token) rescue nil
        if @at.nil? || (@at.respond_to?(:expired?) && @at.expired?) || (@at.respond_to?(:revoked?) && @at.revoked?)
            redirect_to '/'
            return
        end
        @oauth = Doorkeeper::Application.find(@at.application_id) rescue nil
        if @oauth.nil?
            redirect_to '/'
            return
        end
        @user = User.where(name: @oauth.name, organization_id: @oauth.organization_id, deleted: false).first
        if @user.nil?
            redirect_to '/'
            return
        end
        @org = Organization.find(@oauth.organization_id) rescue nil
    end
end
