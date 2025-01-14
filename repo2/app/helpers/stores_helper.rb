module StoresHelper
    include SoyaHelper

    def write_item(item_data, meta_data, schema, did_document, did_log)
puts "write_item ---"
        item_data = deep_transform_keys_to_strings(item_data)
puts item_data.to_json

puts " - meta_data: " + meta_data.to_json

        soya_json = item_data["content"]
        soya_yaml = item_data["soya_yaml"]
        soya_name = getSoyaName(soya_json.deep_dup)
        soya_dri_json, soya_dri, msg = createDriVersion(soya_json.deep_dup)
        soya_tag = ""
        provided_id = nil
        if meta_data.nil?
            meta_data = {soya_dri: soya_dri}
        else
            if meta_data.is_a?(String)
                meta_data = JSON.parse(meta_data) rescue nil
            end
            meta_data["soya_dri"] = soya_dri
            if !meta_data["soya_tag"].nil?
                soya_tag = meta_data["soya_tag"].to_s
            end
            if !meta_data["id"].nil?
                provided_id = meta_data["id"].to_i rescue nil
            end
            meta_data.delete("id")
        end
        dri = Oydid.hash(Oydid.canonical({"data": soya_json, "meta": meta_data}.to_json))
        item_dri = Oydid.hash(Oydid.canonical({"data": soya_dri_json, "meta": meta_data}.to_json))

        if soya_tag.to_s.strip == ""
            soya_tag = nil
        end
        # check for update in JSON-LD/YAML of SOyA structure
        if provided_id.nil?
            @record = Store.find_by_soya_dri(soya_name)
puts "@record (" + @record.id.to_s + ") with soya_name: " + soya_name.to_s rescue ""
        else
            @record = Store.find(provided_id)
        end
        if !@record.nil?
puts "if !@record.nil? == true"
            if soya_tag.nil? && !@record.soya_tag.nil? && @record.soya_tag != DEFAULT_SOYA_TAG
                # delete_soya_tag
                @record.soya_tag = nil
                meta_data.delete("soya_tag")
                @record.meta = meta_data
                @record.dri = Oydid.hash(Oydid.canonical({"data": soya_json, "meta": meta_data}.to_json))
                if !@record.save
puts "ERROR in storing Record!!!"
                end

                # check if record is now a duplicate
                @check = Store.where(soya_dri: soya_dri, soya_tag: nil) rescue []
                if @check.count > 1
                    @record.destroy
                    return_id = nil
                    dri = nil
                else
                    return_id = @record.id
                end
            else
puts "NOT if soya_tag.nil? && !@record.soya_tag.nil? && @record.soya_tag != DEFAULT_SOYA_TAG"
                if @record.soya_tag == soya_tag
puts "@record.soya_tag == soya_tag: " + @record.soya_tag.to_s + " == " + soya_tag.to_s
                    if soya_tag.nil?
                        # should be new default/current
                        @check = Store.where(soya_dri: soya_dri, soya_tag: DEFAULT_SOYA_TAG).first rescue nil
                        if @check.nil?
                            return_id = create_soya(soya_name, soya_json, soya_yaml, meta_data, DEFAULT_SOYA_TAG, soya_dri, dri)
puts "return_id1 = " + return_id.to_s
                        else
                            if @check.id == @record.id
                                # do nothing
puts "return_id2 = do nothing!"
                            else
                                # remove tag from old record
                                @check.soya_tag = nil
                                meta_data = @check.meta.dup
                                meta_data.delete("soya_tag")
                                @check.meta = meta_data
                                @check.dri = Oydid.hash(Oydid.canonical({"data": @check.item, "meta": meta_data}.to_json))
                                @check.save

                                # set DEFAULT TAG (current) in new record
                                @record.soya_tag = DEFAULT_SOYA_TAG
                                meta_data = @record.meta.dup
                                meta_data["soya_tag"] = DEFAULT_SOYA_TAG
                                @record.meta = meta_data
                                @record.dri = Oydid.hash(Oydid.canonical({"data": @record.item, "meta": meta_data}.to_json))
                                @record.save
                                return_id = @record.id
puts "return_id3 = " + return_id.to_s
                            end
                        end
                    else
                        # overwrite
                        if HAS_JSONB
                            @record.item = soya_json
                            @record.meta = meta_data
                        else
                            @record.item = soya_json.to_json
                            @record.meta = meta_data.to_json
                        end
                        @record.dri = dri
                        @record.soya_name = soya_name
                        @record.soya_dri = soya_name
                        @record.soya_yaml = soya_yaml
                        @record.soya_tag = soya_tag
                        @record.save
                        return_id = @record.id

                        # write SOyA structure DRI-version
                        @store_dri = Store.find_by_dri(item_dri)
                        if @store_dri.nil?
                            if HAS_JSONB
                                @store_dri = Store.new(
                                    item: soya_dri_json, 
                                    meta: meta_data, 
                                    dri: item_dri, 
                                    soya_name: soya_name,
                                    soya_dri: soya_dri,
                                    soya_yaml: soya_yaml)
                                @store_dri.save
                            else                
                                @store_dri = Store.new
                                @store_dri.item = soya_dri_json.to_json
                                if !meta_data.nil?
                                    @store_dri.meta = meta_data.to_json
                                end
                                @store_dri.dri = item_dri
                                @store_dri.soya_name = soya_name
                                @store_dri.soya_dri = soya_dri
                                @store_dri.soya_yaml = soya_yaml
                                @store_dri.save
                            end
                        end

puts "return_id4 = " + return_id.to_s
                    end
                else
puts "@record.soya_tag != soya_tag"
                    # default case when using soya push for existing record
                    if @record.soya_tag == DEFAULT_SOYA_TAG
puts "@record.soya_tag == DEFAULT_SOYA_TAG"
                        if soya_tag.to_s == ""
puts "soya_tag.to_s == ''"
                            # overwrite
                            if HAS_JSONB
                                @record.item = soya_json
                                @record.meta = meta_data
                            else
                                @record.item = soya_json.to_json
                                @record.meta = meta_data.to_json
                            end
                            @record.dri = dri
                            @record.soya_name = soya_name
                            @record.soya_dri = soya_name
                            @record.soya_yaml = soya_yaml
                            @record.soya_tag = DEFAULT_SOYA_TAG
                            @record.save
                            return_id = @record.id
puts "return_id: " + return_id.to_s
                        else
                            # copy record with new tag
                            return_id = create_soya(soya_name, soya_json, soya_yaml, meta_data, soya_tag, soya_dri, dri)
                        end
                    else
                        # copy record with new tag
                        return_id = create_soya(soya_name, soya_json, soya_yaml, meta_data, soya_tag, soya_dri, dri)
                    end
                end
            end
        else
puts "-> no soya_dri (" + soya_dri.to_s + ")"
            if soya_tag.nil?
puts "branch: full_soya_update w/o tag"
puts "  soya_name: " + soya_name.to_s
puts "  soya_dri:  " + soya_dri.to_s
puts "  dri:       " + dri.to_s

                return_id = full_soya_update(soya_name, soya_json, soya_dri_json, soya_yaml, meta_data, DEFAULT_SOYA_TAG, soya_dri, dri, item_dri)
            else
puts "branch: full_soya_update w/ tag"
                return_id = full_soya_update(soya_name, soya_json, soya_dri_json, soya_yaml, meta_data, soya_tag, soya_dri, dri, item_dri)
            end
        end

        return {"dri": dri.to_s, "id": return_id}

    end

    def create_soya(soya_name, soya_json, soya_yaml, meta_data, soya_tag, soya_dri, dri)
        @cs_store = Store.find_by_dri(dri)
        if @cs_store.nil?
            if HAS_JSONB
                @cs_store = Store.new(
                    item: soya_json, 
                    meta: meta_data, 
                    dri: dri, 
                    soya_name: soya_name,
                    soya_dri: soya_dri,
                    soya_yaml: soya_yaml,
                    soya_tag: soya_tag)
            else
                @cs_store = Store.new
                @cs_store.item = soya_json.to_json
                if !meta_data.nil?
                    @cs_store.meta = meta_data.to_json
                end
                @cs_store.dri = dri
                @cs_store.soya_name = soya_name
                @cs_store.soya_dri = soya_dri
                @cs_store.soya_yaml = soya_yaml
                @cs_store.soya_tag = soya_tag
            end
            @cs_store.save
        end
        return @cs_store.id
    end

    def full_soya_update(soya_name, soya_json, soya_dri_json, soya_yaml, meta_data, soya_tag, soya_dri, dri, item_dri)
        # if combination of soya_name/soya_tag already exists
        # -> delte soya_tag of existing record
        @check_record = Store.where(soya_name: soya_name, soya_tag: soya_tag).update_all(soya_tag: nil)

        # write SOyA structure as-is
        @record = Store.find_by_soya_dri(soya_name) rescue nil
        if @record.nil?
            store_id = create_soya(soya_name, soya_json, soya_yaml, meta_data, soya_tag, soya_name, dri)
            @store = Store.find(store_id)
        else
            @store = Store.find_by_dri(dri)
            if @store.nil?
                if HAS_JSONB
                    @record.item = soya_json
                    @record.meta = meta_data
                else
                    @record.item = soya_json.to_json
                    @record.meta = meta_data.to_json
                end
                @record.dri = dri
                @record.soya_name = soya_name
                @record.soya_dri = soya_name
                @record.soya_yaml = soya_yaml
                @record.soya_tag = soya_tag
                @record.save
                @store = @record
            else
                @store.soya_name = soya_name
                @store.soya_dri = soya_name
                @store.soya_yaml = soya_yaml
                @store.soya_tag = soya_tag
                @store.save
            end
        end

        # write SOyA structure DRI-version
        @store_dri = Store.find_by_dri(item_dri)
        if @store_dri.nil?
            if HAS_JSONB
                @store_dri = Store.new(
                    item: soya_dri_json, 
                    meta: meta_data, 
                    dri: item_dri, 
                    soya_name: soya_name,
                    soya_dri: soya_dri,
                    soya_yaml: soya_yaml)
                @store_dri.save
            else                
                @store_dri = Store.new
                @store_dri.item = soya_dri_json.to_json
                if !meta_data.nil?
                    @store_dri.meta = meta_data.to_json
                end
                @store_dri.dri = item_dri
                @store_dri.soya_name = soya_name
                @store_dri.soya_dri = soya_dri
                @store_dri.soya_yaml = soya_yaml
                @store_dri.save
            end
        end
        return @store.id
    end
end