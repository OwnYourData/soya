module HooksHelper
    include UsersHelper

    def write_hook(data)
        puts "write_hook:"
        puts data.to_json
        user_name = doorkeeper_name.to_s
        puts "user: " + user_name
        if user_name != ""
            @store = Store.find(data[:id])
            @store.user_id = doorkeeper_token.application_id
            @store.save
        end
        data["processed"] = 1
        data["responses"] = [{id: data[:id], status: 200}]

    end

    def read_hook(data)
        puts "read_hook:"
        puts data.to_json
        @rh_store = Store.find(data["id"]) rescue nil
        if !@rh_store.nil?
            data["soya_yaml"] = @rh_store.soya_yaml
            if data["meta"].nil?
                data["meta"] = {}
            end
            data["meta"]["id"] = @rh_store.id
            if data["meta"]["soya_dri"].nil?
                data["meta"]["soya_dri"] = @rh_store.soya_dri
            end
            if @rh_store.soya_tag.to_s != ""
                data["meta"]["soya_tag"] = @rh_store.soya_tag
            end
        end

    end

    def update_hook(data)

    end

    def delete_hook(data)

    end

end
