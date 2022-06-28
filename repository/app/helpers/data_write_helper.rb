module DataWriteHelper
    include BaseHelper

    def writeData(content, input, provenance, read_hash)
        # write data to container store
        new_items = []
        soya_yaml = nil

        if input.class == String
            if input == ""
                render plain: "",
                       status: 500
                return
            end
            input = [input]
        end

        # write provenance
        prov_timestamp = Time.now.utc
        prov = Provenance.new(
            prov: provenance, 
            input_hash: read_hash,
            startTime: prov_timestamp)
        prov.save
        prov_id = prov.id

        if input.is_a?(Array)
            my_params = input.drop(1).first
        else
            my_params = input
        end
        if my_params.nil?
            my_params = {}
        end

        if my_params["id"].to_s != "" && (my_params["p"].to_s == "id" || my_params["p"].to_s == "dri")
            # update record
            @item = nil
            if my_params["p"].to_s == "id"
                @item = Store.find(my_params["id"]) rescue nil
            elsif my_params["p"].to_s == "dri"
                @item = Store.find_by_dri(my_params["dri"]) rescue nil
            end
            if @item.nil?
                render json: {"error": "not found"},
                       status: 404
                return
            end
            if input["content"].to_s == ""
                @item.update_attributes(item: input.except(:p, "p", :id, "id", :dri, "dri", :schema_dri, "schema_dri", :mime_type, "mime_type", :table_name, "table_name").to_json)
            else
                @item.update_attributes(item: input["content"].to_json)
            end
            if input["dri"].to_s != ""
                @item.update_attributes(dri: input["dri"].to_s)
            end
            if input["schema_dri"].to_s != ""
                @item.update_attributes(schema_dri: input["schema_dri"].to_s)
            end
            if input["mime_type"].to_s != ""
                @item.update_attributes(mime_type: input["mime_type"].to_s)
            end
            if input["tale_name"].to_s != ""
               @item.update_attributes(table_name: input["table_name"].to_s) 
            end
            if input["soya_yaml"].to_s != ""
                @item.update_attributes(soya_yaml: input["soya_yaml"].to_s) 
            end
            new_items = [@item.id]
        else
            # write data of new record
            if input.class == Hash
                input = [input]
            end
            Store.transaction do
                input.each do |item|
                    orig_item = item.deep_dup
                    mime_type = "application/json"
                    if item["soya_yaml"].to_s != ""
                        soya_yaml = item["soya_yaml"]
                    end
                    if item["content"].to_s != ""
                        item = item["content"]
                    end
                    if item.class == String
                        item = JSON.parse(item)
                    end

                    soya_name = getSoyaName(item)
                    base_name = getBaseName(item)
                    if base_name == ""
                        base_name = soya_name
                    end
                    @record = Store.find_by_dri(soya_name)
                    if soya_name.to_s == "" || @record.nil?
                        if base_name.to_s == ""

                            # this is an instance
                            content = orig_item
                            dri = nil
                            if content["dri"].to_s != ""
                                dri = content["dri"].to_s
                            end
                            @record = Store.find_by_dri(dri)
                            if dri.nil? || @record.nil?
                                schema_dri = nil
                                if content["schema_dri"].to_s != ""
                                    schema_dri = content["schema_dri"].to_s
                                end
                                if content["table_name"].to_s != ""
                                    table_name = content["table_name"].to_s
                                end
                                mime_type = "application/json"
                                if content["mime_type"].to_s != ""
                                    mime_type = content["mime_type"].to_s
                                end
                                if content["soya_yaml"].to_s != ""
                                    soya_yaml = content["soya_yaml"].to_s
                                end
                                if content["content"].to_s != ""
                                    content = content["content"]
                                end
                                @record = Store.new(
                                    item: content.to_json, 
                                    prov_id: prov_id, 
                                    dri: dri, 
                                    schema_dri: schema_dri, 
                                    mime_type: mime_type,
                                    table_name: table_name,
                                    soya_yaml: soya_yaml)
                                @record.save
                            else                                
                                if content["schema_dri"].to_s != ""
                                    @record.update_attributes(schema_dri: content["schema_dri"].to_s)
                                end
                                if content["table_name"].to_s != ""
                                    @record.update_attributes(table_name: content["table_name"].to_s)
                                end
                                if content["mime_type"].to_s != ""
                                    @record.update_attributes(mime_type: content["mime_type"].to_s)
                                end
                                if content["soya_yaml"].to_s != ""
                                    @record.update_attributes(soya_yaml: content["soya_yaml"].to_s)
                                end
                                if content["content"].to_s != ""
                                    @record.update_attributes(item: content["content"].to_json)
                                else
                                    @record.update_attributes(item: content.to_json)
                                end
                            end
                        else
                            @record = Store.new(
                                item: item.to_json, 
                                dri: soya_name,
                                table_name: base_name,
                                soya_name: soya_name,
                                soya_yaml: soya_yaml)
                            @record.save
                        end
                    else
                        @record.update_attributes(item: item.to_json, dri: soya_name, table_name: base_name, soya_name: soya_name, soya_yaml: soya_yaml)
                    end
                    new_items << @record.id

                    # assumption: instances don't have a base_name => therefore, only SOyA structures will create a 2nd version
                    if base_name.to_s != ""
                        dri_item = updateOnBase(item.deep_dup)
                        dri_item = createDriVersion(dri_item)
                        dri = calculateDri(dri_item.deep_dup)
                        base_name = getBaseName(dri_item)
                        if base_name == ""
                            base_name = dri
                        end

                        @record_dri = Store.find_by_dri(dri)
                        if dri.nil? || @record_dri.nil?
                            @record_dri = Store.new(
                                item: dri_item.to_json, 
                                dri: dri,
                                table_name: base_name,
                                soya_name: soya_name,
                                soya_dri: dri,
                                soya_yaml: soya_yaml)
                            @record_dri.save
                        else
                            @record_dri.update_attributes(item: dri_item.to_json, dri: dri, soya_name: soya_name, table_name: base_name, soya_dri: dri.to_s, soya_yaml: soya_yaml)
                        end
                        @record.update_attributes(soya_dri: dri.to_s)
                        new_items << @record_dri.id
                    end
                end
            end
        end

        # create receipt information
        receipt_json = createReceipt(read_hash, new_items, prov_timestamp)
        receipt_hash = Digest::SHA256.hexdigest(receipt_json.to_json)

        # finalize provenance
        revocation_key = SecureRandom.hex(16).to_s
        Provenance.find(prov_id).update_attributes(
            scope: new_items.to_s,
            receipt_hash: receipt_hash.to_s,
            revocation_key: revocation_key,
            endTime: Time.now.utc,
            input_hash: read_hash)


        # write Log
        createLog({
            "type": "write",
            "scope": new_items.to_s})

        render json: {"receipt": receipt_hash.to_s,
                      "serviceEndpoint": ENV["SERVICE_ENDPOINT"].to_s,
                      "read_hash": read_hash,
                      "revocationKey": revocation_key,
                      "processed": new_items.count,
                      "responses": new_items.map{|e| {"id": e, "status":200}}},
               status: 200

    end
end