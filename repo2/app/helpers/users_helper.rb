module UsersHelper
    def doorkeeper_name
        return Doorkeeper::Application.find(doorkeeper_token.application_id).name.to_s rescue nil
    end

    def doorkeeper_org
        return Doorkeeper::Application.find(doorkeeper_token.application_id).organization_id.to_s
    end

    def doorkeeper_scope
       return doorkeeper_token.scopes.to_s
    end

    def doorkeeper_user
        id = nil
        @oauth = Doorkeeper::Application.find(doorkeeper_token.application_id)
        org_id = @oauth.organization_id
        user_name = @oauth.name
        @user = User.where(name: user_name, organization_id: org_id).first rescue nil
        if !@user.nil?
        	if !user.delete
        		id = @user.id
        	end
        end
        return id
    end
end