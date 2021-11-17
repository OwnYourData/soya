module DataAccessHelper
    include WatermarkHelper

    def getRecords(params)

puts "getRecords: " + params.to_s

        page = params[:page] || 1
        if page == "all"
            page = 1
            items = Store.count
        else
            items = params[:page_size] || 20
        end

        # filter methods
        if params[:id].to_s != "" && params[:p].to_s == "id"
            @pagy, @records = pagy(Store.where(id: params[:id]).select(:id, :item, :dri, :soya_name, :schema_dri, :table_name, :created_at, :updated_at, :mime_type), page: page, items: items)
        elsif params[:id].to_s != "" && params[:p].to_s == "dri"
            @pagy, @records = pagy(Store.where(dri: params[:id]).select(:id, :item, :dri, :soya_name, :schema_dri, :table_name, :created_at, :updated_at, :mime_type), page: page, items: items)
        elsif params[:table].to_s != ""
            if params[:table].to_s == "default"
                @pagy, @records = pagy(Store.where(table_name: [nil, "", "default"]).select(:id, :item, :dri, :soya_name, :schema_dri, :table_name, :created_at, :updated_at, :mime_type), page: page, items: items)
            else
                @pagy, @records = pagy(Store.where(table_name: params[:table]).select(:id, :item, :dri, :soya_name, :schema_dri, :table_name, :created_at, :updated_at, :mime_type), page: page, items: items)
            end
        elsif params[:schema_dri].to_s != ""
            @pagy, @records = pagy(Store.where(schema_dri: params[:schema_dri]).select(:id, :item, :dri, :soya_name, :schema_dri, :table_name, :created_at, :updated_at, :mime_type), page: page, items: items)
        elsif params[:soya_name].to_s != ""
            @pagy, @records = pagy(Store.where(soya_name: params[:soya_name]).select(:id, :item, :dri, :soya_name, :schema_dri, :table_name, :created_at, :updated_at, :mime_type), page: page, items: items)
        else
            @pagy, @records = pagy(Store.select(:id, :item, :dri, :soya_name, :schema_dri, :table_name, :created_at, :updated_at, :mime_type), page: page, items: items)
        end
        retVal = @records.map(&:serializable_hash) rescue []

        return @pagy, retVal
    end

    def getProvision(params, logStr)

puts "getProvision: " + params.to_s

        retVal_type = container_format
        timeStart = Time.now.utc
        @pagy, @records = getRecords(params)
        if @records.nil?
            @records = []
        end
        content = []
        ids = []
        case retVal_type.to_s
        when "JSON"
            if @records.count > 0
                @records.each do |el| 
                    if el["item"].is_a? String
                        val = {"content": JSON(el["item"])}.stringify_keys
                    else
                        val = {"content": el["item"]}.stringify_keys
                    end
                    val["id"] = el["id"]
                    if el["dri"].to_s != ""
                        val["dri"] = el["dri"].to_s
                    end
                    if el["soya_name"].to_s != ""
                        val["soya_name"] = el["soya_name"].to_s
                    end
                    if el["schema_dri"].to_s != ""
                        val["schema_dri"] = el["schema_dri"].to_s
                    end
                    if el["table_name"].to_s != ""
                        val["table_name"] = el["table_name"].to_s
                    end
                    if el["mime_type"].to_s != ""
                        val["mime_type"] = el["mime_type"].to_s
                    end
                    val["created_at"] = el["created_at"].iso8601 rescue ""
                    val["updated_at"] = el["updated_at"].iso8601 rescue ""
                    content << val.stringify_keys
                    ids << el["id"]
                end
            end
            content_hash = Digest::SHA256.hexdigest(content.to_json)
        when "RDF"
            @records.each do |el| 
                content << el["item"].to_s
                ids << el["id"]
            end
            content_hash = Digest::SHA256.hexdigest(content.to_s)
        else
            content = ""
            @records.each do |el| 
                content += el["item"].to_s + "\n"
                ids << el["id"]
            end
            content_hash = Digest::SHA256.hexdigest(content.to_s)
        end
        timeEnd = Time.now.utc

        param_str = request.query_string.to_s
        cup = container_usage_policy.to_s
        if params[:p].to_s == ""
            retVal = {
                "data": content,
                "provenance": getProvenance(content_hash, param_str, timeStart, timeEnd, ids)
            }.stringify_keys
            if cup.to_s != ""
                retVal["usage-policy"] = cup
            end
        else
            if content == [] || content == ""
                retVal = content
            else
                retVal = JSON.parse(content.first.gsub("=>",":")) rescue content.first
                if cup.to_s != ""
                    retVal["usage-policy"] = cup
                end
                retVal["provenance"] = getProvenance(content_hash, param_str, timeStart, timeEnd, ids)
            end
        end

        createLog({
            "type": logStr,
            "scope": @records.map{|h| h["id"]}.flatten.sort.to_json}, # "all (" + retVal_data.count.to_s + " records)"},
            Digest::SHA256.hexdigest(retVal.to_json))

        return @pagy, retVal

    end

    def getData(params)

puts "getData: " + params.to_s

        if ENV["WATERMARK"].to_s == ""
            if params.to_s.starts_with?("id=")
                retVal = [Store.select(:id, :item, :dri, :soya_name, :schema_dri, :table_name, :created_at, :updated_at, :mime_type).find(params[3..-1])].map(&:serializable_hash) rescue []
            elsif params.to_s.starts_with?("dri=")
                retVal = [Store.select(:id, :item, :dri, :soya_name, :schema_dri, :table_name, :created_at, :updated_at, :mime_type).find_by_dri(params[4..-1])].map(&:serializable_hash) rescue []
            elsif params.to_s.starts_with?("schema_dri=")
                retVal = Store.select(:id, :item, :dri, :soya_name, :schema_dri, :table_name, :created_at, :updated_at, :mime_type).where(dri: params[11..-1]).to_a.map(&:serializable_hash) rescue []
            elsif params.to_s.starts_with?("soya_name=")
                retVal = Store.select(:id, :item, :dri, :soya_name, :schema_dri, :table_name, :created_at, :updated_at, :mime_type).where(soya_name: params[10..-1]).to_a.map(&:serializable_hash) rescue []
            elsif params.to_s.starts_with?("table_name=")
                if params[11..-1].to_s == "default"
                    retVal = Store.select(:id, :item, :dri, :soya_name, :schema_dri, :table_name, :created_at, :updated_at, :mime_type).where(table_name: [nil, "", "default"]).to_a.map(&:serializable_hash) rescue []
                else
                    retVal = Store.select(:id, :item, :dri, :soya_name, :schema_dri, :table_name, :created_at, :updated_at, :mime_type).where(table_name: params[11..-1]).to_a.map(&:serializable_hash) rescue []
                end
            else
                retVal = Store.select(:id, :item, :dri, :soya_name, :schema_dri, :table_name, :created_at, :updated_at, :mime_type).to_a.map(&:serializable_hash)
            end
        else
            retVal = []
            all_fragments("").each do |fragment_id|
                key = get_fragment_key(fragment_id, doorkeeper_token.application_id)
                data = get_fragment(fragment_id)
                retVal += apply_watermark(data, key)
            end
        end
        @page, @items = pagy_array(retVal, page: params[:page])
    end

    def get_provision(params, logstr)

puts "getProvision: " + params.to_s

        retVal_type = container_format
        timeStart = Time.now.utc
        if (params[:p].to_s == "id")
            retVal_data = getData("id=" + params[:id].to_s)
        elsif (params[:p].to_s == "dri")
            retVal_data = getData("dri=" + params[:id].to_s)
        elsif (params["schema_dri"].to_s != "")
            retVal_data = getData("schema_dri=" + params["schema_dri"].to_s)
        elsif (params["table_name"].to_s != "")
            retVal_data = getData("table_name=" + params["table_name"].to_s)
        elsif (params["soya_name"].to_s != "")
            retVal_data = getData("soya_name=" + params["soya_name"].to_s)
        elsif !(Date.parse(params[:id].to_s) rescue nil).nil?
            retVal_data = getData("day=" + params[:id].to_s)
        else
            retVal_data = getData(params[:id].to_s)
        end
        if retVal_data.nil?
            retVal_data = []
        end
        timeEnd = Time.now.utc
        content = []
        case retVal_type.to_s
        when "JSON"
            if retVal_data.count > 0
                retVal_data.each do |el| 
                    if el["item"].is_a? String
                        val = {"content": JSON(el["item"])}.stringify_keys
                    else
                        val = {"content": el["item"]}.stringify_keys
                    end
                    val["id"] = el["id"]
                    if el["dri"].to_s != ""
                        val["dri"] = el["dri"].to_s
                    end
                    if el["soya_name"].to_s != ""
                        val["soya_name"] = el["soya_name"].to_s
                    end
                    if el["schema_dri"].to_s != ""
                        val["schema_dri"] = el["schema_dri"].to_s
                    end
                    if el["table_name"].to_s != ""
                        val["table_name"] = el["table_name"].to_s
                    end
                    if el["mime_type"].to_s != ""
                        val["mime_type"] = el["mime_type"].to_s
                    end
                    val["created_at"] = el["created_at"].iso8601 rescue ""
                    val["updated_at"] = el["updated_at"].iso8601 rescue ""
                    content << val.stringify_keys
                end
            end
            content_hash = Digest::SHA256.hexdigest(content.to_json)
        when "RDF"
            retVal_data.each { |el| content << el["item"].to_s }
            content_hash = Digest::SHA256.hexdigest(content.to_s)
        else
            content = ""
            retVal_data.each { |el| content += el["item"].to_s + "\n" }
            content_hash = Digest::SHA256.hexdigest(content.to_s)
        end
        param_str = request.query_string.to_s

        cup = container_usage_policy.to_s
        if params[:p].to_s == ""
            retVal = {
                "data": content,
                "provenance": getProvenance(content_hash, param_str, timeStart, timeEnd)
            }.stringify_keys
            if cup.to_s != ""
                retVal["usage-policy"] = cup
            end
        else
            if content == [] || content == ""
                retVal = content
            else
                retVal = content.first
                if cup.to_s != ""
                    retVal["usage-policy"] = cup
                end
                retVal["provenance"] = getProvenance(content_hash, param_str, timeStart, timeEnd)
            end
        end

        createLog({
            "type": logstr,
            "scope": retVal_data.map{|h| h["id"]}.flatten.sort.to_json}, # "all (" + retVal_data.count.to_s + " records)"},
            Digest::SHA256.hexdigest(retVal.to_json))

        return retVal
    end
end