module Api
    module V1
        class ResourcesController < ApiController

            include UsersHelper

            # possible values vor ENV["AUTH"]
            # - empty, "false" => no authorization necessary
            # - "optional" => optional authorization
            # - "true" => require key&secret
            # - "idaustria" => show "Login with ID Austria" button and anyone with ID Austria can login
            # - "idaustria_restrict" => show "Login with ID Austria" button and bPK is mapped to OAuth Apps
            def active
                env_auth = ENV["AUTH"].to_s.downcase
                if ENV["AUTH_SCOPE"].nil?
                    retVal = { "active": true,
                               "auth": !(env_auth == "" || env_auth == "false") ,
                               "repos": false
                             }
                else
                    retVal = { "active": true,
                               "auth": !(env_auth == "" || env_auth == "false") ,
                               "repos": false,
                               "scopes": JSON.parse(ENV["AUTH_SCOPE"].to_s)
                             }
                end
                if env_auth == "optional"
                    retVal["auth"] = false
                    retVal["auth_method"] = {mode: "optional"}
                end
                if !doorkeeper_name.nil?
                    @oauth = Doorkeeper::Application.find(doorkeeper_token.application_id) rescue nil
                    @user = User.find_by_name(@oauth.name) rescue nil
                    @org = Organization.find(@oaut.organization_id) rescue nil
                    user_name = @oauth.name rescue ""
                    full_name = @user.full_name rescue ""
                    org_name = @org.name rescue ""
                    retVal["user"] = {user_name: user_name, full_name: full_name, organization: org_name}
                end
                if env_auth.start_with?("idaustria")
                    uid = SecureRandom.uuid
                    IdaustriaUuid.where('created_at < ?', 2.hours.ago).destroy_all
                    @ida = IdaustriaUuid.new(uuid: uid)
                    ida_short = env_auth.split(':').last rescue ""
                    if @ida.save && ida_short != ""
                        eid_url = 'https://eid.oesterreich.gv.at/auth/idp/profile/oidc/authorize'
                        eid_url += '?response_type=code'
                        eid_url += '&client_id=https%3A%2F%2Fidaustria.ownyourdata.eu'
                        eid_url += '&redirect_uri=https%3A%2F%2Fidaustria.ownyourdata.eu%2Fconnect'
                        eid_url += '&scope=openid+profile+eid'
                        eid_url += '&state=' + ida_short + ':' + uid
                        retVal["oauth"] = [{
                            link: eid_url,
                            title: {
                                en: "Login with ID Austria",
                                de: "mit ID Austria einloggen",
                                pic: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
                            }
                        }]
                    end
                end

                render json: retVal, 
                       status: 200
            end

            def info
                container_name = ENV["CONTAINER_NAME"] || "Container Name"
                container_description = ENV["CONTAINER_DESCRIPTION"] || "here is the description and purpose of the container"
                retVal = {
                    "name": container_name.to_s,
                    "description": container_description.to_s
                }
                render json: retVal, 
                       status: 200
            end

            def idaustria
                STDOUT.sync = true
                logger = Logger.new(STDOUT)
                level ||= LOGLEVELS.index ENV.fetch("LOG_LEVEL","INFO")
                level ||= Logger::INFO
                logger.level = level

                # decode token ---------------------
                token = params[:token] rescue nil
                data = JWT.decode(token, nil, false).first rescue nil
                if data.nil?
                    logger.error("invalid token '" + token.to_s + "'")
                    redirect_to '/'
                    return
                end

                # check state ----------------------
                state = data['state'].split(':').last
                @idu = IdaustriaUuid.find_by_uuid(state) rescue nil
                if @idu.nil?
                    logger.error("invalid state '" + state.to_s + "'")
                    redirect_to '/'
                    return
                end
                @idu.delete

                # check signature ------------------
                sig = data.delete("sig") rescue ""
                my_hash = Oydid.hash(Oydid.canonical(data)) rescue ""
                publicKey = Oydid.read(ENV['IDAUSTRIA_DID'], {}).first["doc"]["key"].split(':').first rescue ""
                check, msg = Oydid.verify(my_hash, sig, publicKey)
                if !check
                    logger.error("invalid signature '" + sig.to_s + "'")
                    redirect_to '/'
                    return
                end

                # check expired token --------------
                exp = data["exp"].to_i
                if exp < Time.now.to_i
                    logger.error("expired token '" + exp.to_s + "'")
                    redirect_to '/'
                    return
                end

                # check valid bpk ------------------
                bpk = data["urn:pvpgvat:oidc.bpk"].to_s
                if bpk == ""
                    logger.error("empty bpk")
                    redirect_to '/'
                    return
                end

                # document login with ID Austria ---
                logger.info("ID Austria Login from: " + data["given_name"].to_s + " " + data["family_name"].to_s + " (" + bpk + ")")

                env_auth = ENV["AUTH"].to_s.downcase.split(':').first
                ida_scope = ENV["IDAUSTRIA_SCOPE"] || "read"
                case env_auth
                when "idaustria"
                    # variant #1: temporary credentials
                    @da = Doorkeeper::Application.find_by_bpk(bpk)
                    if @da.nil?
                        @da = Doorkeeper::Application.new(
                                    name: "ida_login_" + SecureRandom.uuid,
                                    redirect_uri: "urn:ietf:wg:oauth:2.0:oob",
                                    scopes: ida_scope,
                                    bpk: bpk,
                                    temp: true)
                        if !@da.save
                            redirect_to '/'
                        end
                    end
                    Doorkeeper::Application.where(temp: true).where('updated_at < ?', 2.hours.ago).destroy_all
                else
                    # variant #2: selected Oauth
                    @da = Doorkeeper::Application.find_by_bpk(bpk)
                    if @da.nil?
                        logger.error("invalid bpk '" + bpk + "'")
                        redirect_to '/'
                        return
                    end
                end

                redirect_to '/?APP_KEY=' + @da.uid.to_s + "&APP_SECRET=" + @da.secret
            end

        end
    end

    # template for multiple versions -> copy into folder controllers/api/v2
    # module V2
    #     class ResourcesController < ApiController
    #         def active2
    #             render json: [2], 
    #                    status: 200
    #         end
    #     end
    # end
end