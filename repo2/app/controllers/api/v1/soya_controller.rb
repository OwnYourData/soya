module Api
    module V1
        class SoyaController < ApiController
            # respond only to JSON requests
            respond_to :json
            respond_to :html, only: []
            respond_to :xml, only: []

            include SoyaHelper

            def read
                @store = Store.find(params[:id]) rescue nil
                if @store.nil?
                    render json: {"error": "not found"},
                           status: 404
                else
                    if @store.soya_tag == "current"
                        retval = {
                          content: @store.item,
                          "id": @store.id,
                          "dri": @store.soya_name,
                          "soya_name": @store.soya_name,
                        }
                    else
                        retval = {
                          content: @store.item,
                          "id": @store.id,
                          "dri": @store.soya_dri,
                          "soya_name": @store.soya_name,
                        }
                    end                        
                    render json: retval.to_json,
                           status: 200
                end
            end

            def query
                retVal = []
                name_query = params[:name].to_s
                if name_query == ""
                    items = Store.all.pluck(:soya_name).uniq
                else
                    items = Store.where('lower(soya_name) LIKE ?', "%" + name_query.downcase + "%").all.pluck(:soya_name).uniq
                end
                items.each do |item|
                    if !item.nil?
                        @store = Store.find_by_soya_dri(item) rescue nil
                        if @store.nil?
                            @store = Store.where(soya_name: item).first rescue nil
                        end
                        meta_data = @store.meta rescue {}
                        if meta_data.is_a?(String)
                            meta_data = JSON.parse(meta_data) rescue nil
                        end
                        soya_dri = meta_data["soya_dri"] rescue nil
                        if !soya_dri.nil?
                            retVal << {"name": item, "dri": soya_dri }
                        end
                    end
                end

                sortedRetVal = retVal.sort_by do |i|
                  name = i[:name]
                  
                  # Check if the name starts with "zQm" (case-sensitive)
                  if name.start_with?("zQm")
                    [1, name]  # Group for "zQm", sort alphabetically within this group
                  else
                    [0, name.downcase]  # Group for all other names, case-insensitive alphabetical sorting
                  end
                end

                render json: sortedRetVal,
                       status: 200
            end

            def info
                qry = params[:_json]
                retVal = []
                qry.each do |el|
                  if !el.nil?
                    @store = Store.find_by_soya_dri(el.to_s) rescue nil
                    if @store.nil?
                        @store = Store.where(soya_name: input) rescue nil
                        if !@store.nil?
                            @store.each do |item|
                                soya_name = item.soya_name rescue ""
                                if soya_name.to_s == ""
                                    retVal << {"dri": item.soya_dri, "name": item.soya_dri, "id": @store.id}
                                else
                                    retVal << {"dri": item.soya_dri, "name": item.soya_dri, "id": @store.id}
                                end

                            end
                        end
                    else
                        soya_name = @store.soya_name rescue ""
                        if soya_name.to_s == ""
                            retVal << {"dri": el, "name": el, "id": @store.id}
                        else
                            retVal << {"dri": el, "name": soya_name, "id": @store.id}
                        end
                    end
                  end
                end
                sortedRetVal = retVal.sort_by do |i|
                  name = i[:name]
                  
                  # Check if the name starts with "zQm" (case-sensitive)
                  if name.start_with?("zQm")
                    [1, name]  # Group for "zQm", sort alphabetically within this group
                  else
                    [0, name.downcase]  # Group for all other names, case-insensitive alphabetical sorting
                  end
                end
                render json: sortedRetVal,
                       status: 200
            end

            def similar
                inputAttributes = getAttributes(params)
                retval = []
                Store.all.each do |item|
                    if item.dri.to_s != ""
                        if item.item.is_a?(Hash)
                            my_item = item.item
                        else
                            my_item = JSON.parse(item.item.to_s) rescue nil
                        end
                        if !my_item.nil?
                            simval = similarity(inputAttributes, getAttributes(my_item)) rescue 0
                            retval << {:schema => item.dri.to_s, :similarity => simval}
                        end
                    end
                end
                retval = retval.sort_by { |i| i[:similarity] }.reverse.first(20) rescue []

                render json: retval.to_json,
                       status: 200

            end

            def tag
                orig = params[:original] rescue nil
                puts "orig: " + orig.to_s
                tag = params[:tag].to_s rescue nil
                puts "tag: " + tag.to_s

                # Options for :original
                # 1) name only (e.g.: "Person")
                # 2) name+tag (e.g.: "Person:current")
                # 3) DRI (e.g.: "zQmT3L...")
                # -> find record in Store
                # 
                # Validations
                # - identify original record
                # - check if tag already exists
                #   -> if yes, remove from existing record
                #
                # Action
                # - set tag in record
                # - response is {"soya": "name:tag", "dri": "dri"}

                # identify original record
                store_id, msg = get_soya(orig)
                if store_id.nil?
                    render json: {"error": msg},
                           status: 500
                    return
                end
                @store = Store.find(store_id) rescue nil
                if @store.nil?
                    render json: {"error": "not found"},
                           status: 404
                    return
                end

                # check valid tag
                if tag.to_s == ""
                    render json: {"error": "invalid tag"},
                           status: 400
                    return
                end

                # check if tag already exists
                exist_store_id, msg = get_soya(@store.soya_name + ":" + tag)
                if !exist_store_id.nil?
                    @dup_store = Store.find(exist_store_id)
                    @dup_store.soya_tag = nil
                    @dup_store.save
                end

                # set tag in record
                @store.soya_tag = tag
                @store.save

                retVal = {soya: @store.soya_name + ":" + tag, dri: @store.soya_dri}
                render json: retVal,
                       status: 200

            end
        end
    end
end
