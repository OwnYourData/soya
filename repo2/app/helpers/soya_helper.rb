module SoyaHelper

    def get_soya(input)

        # Options for input
        # 1) name only (e.g.: "Person")
        # 2) name+tag (e.g.: "Person:current")
        # 3) DRI (e.g.: "zQmT3L...")
        # -> find record in Store

        found = false
        @gs_store = Store.find_by_soya_dri(input)
        if @gs_store.nil?
            soya_name,c,soya_tag = input.rpartition(':')
            if soya_name != '' && soya_tag != ''
                @gs_store = Store.where(soya_name: soya_name, soya_tag: soya_tag)
                if !@gs_store.nil? && @gs_store.length > 0
                    @gs_store = @gs_store.first
                    found = true
                end
            # else
            #     @gs_store = Store.where(soya_name: input).first rescue nil
            #     if !@gs_store.nil?
            #         found = true
            #     end
            end
        else
            found = true
        end

        if found
            # if @gs_store.meta.is_a?(String)
            #     meta = JSON.parse(@gs_store.meta)
            # else
            #     meta = @gs_store.meta
            # end
            # return [meta["soya_dri"], nil]
            return [@gs_store.id, nil]
        else
            return [nil, "not found"]
        end
    end

    def getSoyaName(input)
        base_url = input["@context"]["@base"].to_s rescue ""
        return base_url.split('/')[-1] rescue ""
    end

    def createDriVersion(input)
        begin
            base_url = input["@context"]["@base"] rescue ""
            input["@context"].delete("@base") rescue nil
            raw = input.to_json_c14n
            dri = Multibases.pack("base58btc", Multihashes.encode(Digest::SHA256.digest(raw), "sha2-256").unpack('C*')).to_s
            raw = JSON.parse(raw)
            raw["@context"]["@base"] = base_url.split('/')[0..-2].join("/") + "/" + dri + "/"
        rescue => error
            return [nil, nil, error.message]
        end
        return raw, dri, nil
    end

    # compare 2 vectors by calculating similarity search on shorter vector
    def similarity(vec1, vec2)
        simvec = []
        for i in 0..([vec1.length, vec2.length].min-1)
            simvec << String::Similarity.cosine(vec1[i], vec2[i])
        end
        simvec = (simvec << Array.new((vec1.length - vec2.length).abs, 0)).flatten
        return simvec.inject(:+).to_f / simvec.length # average of simvec
    end

end