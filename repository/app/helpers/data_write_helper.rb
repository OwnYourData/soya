module DataWriteHelper
    include BaseHelper

    def writeData(content, input, provenance, read_hash)
        # write data to container store
        new_items = []

        if input.class == String
            if input == ""
                render plain: "",
                       status: 500
                return
            end
            input = [input]
        end

        # skip writing provenance

        if input.is_a?(Array)
            my_params = input.drop(1).first
        else
            my_params = input
        end
        if my_params.nil?
            my_params = {}
        end

        # write data of new record
        if input.class == Hash
            input = [input]
        end

        Store.transaction do
            input.each do |item|
                mime_type = "application/json"
                if item["content"].to_s != ""
                    item = item["content"]
                end
                if item.class == String
                    item = JSON.parse(item)
                end

puts "Item ============"
puts item.to_json

puts "write current record"
                soya_name = getSoyaName(item)
                base_name = getBaseName(item)
                if base_name == ""
                    base_name = soya_name
                end
puts "name: " + soya_name.to_s
puts "base name: " + base_name.to_s
                @record = Store.find_by_dri(soya_name)
                if soya_name.to_s == "" || @record.nil?
                    @record = Store.new(
                        item: item.to_json, 
                        dri: soya_name,
                        table_name: base_name,
                        soya_name: soya_name)
                    @record.save
                else
                    @record.update_attributes(item: item.to_json, dri: soya_name, table_name: base_name, soya_name: soya_name)
                end
                new_items << @record.id

puts "write DRIzed record"
                dri_item = updateOnBase(item.deep_dup)
                dri_item = createDriVersion(dri_item)
                dri = calculateDri(dri_item.deep_dup)
                base_name = getBaseName(dri_item)
                if base_name == ""
                    base_name = dri
                end
puts "DRI: " + dri.to_s
puts "base name: " + base_name.to_s
puts dri_item.to_json

                @record_dri = Store.find_by_dri(dri)
                if dri.nil? || @record_dri.nil?
                    @record_dri = Store.new(
                        item: dri_item.to_json, 
                        dri: dri,
                        table_name: base_name,
                        soya_name: soya_name,
                        soya_dri: dri)
                    @record_dri.save
                else
                    @record_dri.update_attributes(item: dri_item.to_json, dri: dri, soya_name: soya_name, table_name: base_name, soya_dri: dri.to_s)
                end
                @record.update_attributes(soya_dri: dri.to_s)
                new_items << @record_dri.id
                
            end
        end

        # create receipt information
        receipt_json = createReceipt(read_hash, new_items, Time.now.utc)
        receipt_hash = Digest::SHA256.hexdigest(receipt_json.to_json)
        revocation_key = SecureRandom.hex(16).to_s

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