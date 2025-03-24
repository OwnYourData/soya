class FrontendController < ApplicationController
    include ActionController::Cookies 

    def register
        output = "<html><head><title>SOyA</title></head>"
        output +="<body><h1>SOyA - User Registration</h1></body>"
        output +="</html>" 
        render html: output.html_safe, 
               status: 200
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

        output = "<html><head><title>SOyA</title></head>"
        output +="<body><h1>User Profile - " + @user.full_name.to_s + "</h1>"
        # output +="<a href='/?APP_KEY=" + @oauth.uid + "&APP_SECRET=" + @oauth.secret + "'>back</a>"
        output +="<a href='/'>back</a>"
        output +="</body></html>" 
        render html: output.html_safe, 
               status: 200
    end
end
