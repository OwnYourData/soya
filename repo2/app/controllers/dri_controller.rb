class DriController < ApplicationController
    # respond only to JSON requests
    respond_to :json
    respond_to :html, only: []
    respond_to :xml, only: []

    include SoyaHelper

    def read
        store_id, msg = get_soya(params[:dri])
        if store_id.nil?
            render json: {"error": "not found"},
                   status: 404
            return
        end
        @store = Store.find(store_id) rescue nil
        if @store.nil?
            render json: {"error": "not found"},
                   status: 404
            return
        end

        render json: @store.item,
               status: 200
    end

    def read_ttl
        store_id, msg = get_soya(params[:dri])
        if store_id.nil?
            render json: {"error": "not found"},
                   status: 404
            return
        end
        @store = Store.find(store_id) rescue nil
        if @store.nil?
            render json: {"error": "not found"},
                   status: 404
            return
        end

        jsonld = @store.item
        graph = RDF::Graph.new << JSON::LD::Reader.new(@store.item.to_json)
        render plain: graph.dump(:turtle, standard_prefixes: true),
               status: 200
    end

    def read_yaml
        store_id, msg = get_soya(params[:dri])
        if store_id.nil?
            render json: {"error": "not found"},
                   status: 404
            return
        end
        @store = Store.find(store_id) rescue nil
        if @store.nil?
            render json: {"error": "not found"},
                   status: 404
            return
        end
        if @store.soya_yaml.to_s == ""
            render plain: "",
                   status: 405
        else
            render plain: @store.soya_yaml,
                   status: 200
        end
    end

    def delete
        # only logged-in users can delete
        @at = Doorkeeper::AccessToken.find_by_token(doorkeeper_token.token) rescue nil
        if @at.nil?
            render json: {"error": "not authorized"},
                   status: 401
            return
        end
        case ENV['AUTH'].to_s.downcase
        when "optional", "delete"
            # only users of the same organisation can delete
        else
            # only admin users can delete
        end
        store_id, msg = get_soya(params[:dri])
        if store_id.nil?
            render json: {"error": "not found"},
                   status: 404
            return
        end
        @store = Store.find(store_id) rescue nil
        if @store.nil?
            render json: {"error": "not found"},
                   status: 404
            return
        end
        if @store.destroy
            render json: {"soya": params[:dri], "message": "SOyA structure '#{params[:dri].to_s}' successfully deleted"},
                   status: 200
        else
            render json: {"soya": params[:dri], "errors": @store.errors},
                   status: 500
        end

    end

    def info
        store_id, msg = get_soya(params[:dri])
        if store_id.nil?
            @store = Store.where(soya_name: params[:dri]).first rescue nil
            if @store.nil?
                render json: {"error": "not found"},
                       status: 404
                return
            end
        else
            @store = Store.find(store_id) rescue nil
        end
        if @store.nil?
            render json: {"error": "not found"},
                   status: 404
            return
        end

        soya_dri = @store.soya_dri
        soya_name = @store.soya_name

        @store = Store.where(soya_name: soya_name)
        history = @store
            .select(
                :id, :soya_dri, :soya_name, :soya_tag, :meta, :updated_at, 
                "CASE WHEN soya_yaml IS NOT NULL THEN 'true' ELSE 'false' END AS yaml")
            .map do|r| 
                if r.meta.is_a?(String)
                    meta = JSON.parse(r.meta)
                else
                    meta = r.meta
                end
                if r.soya_tag.to_s == ""
                    schema = r.soya_dri # meta["soya_dri"]
                else
                    schema = r.soya_tag
                end

                { 
                    schema: schema, 
                    name: r.soya_name, 
                    tag: r.soya_tag, 
                    dri: meta["soya_dri"],
                    id: r.id,
                    date: r.updated_at, 
                    yaml: r.yaml == 'true'
                }
            end rescue []
        sorted_history = history.sort_by do |i|
            name = i[:schema]
          
            # Check if the name starts with "zQm" (case-sensitive)
            if name.start_with?("zQm")
                [1, name]  # Group for "zQm", sort alphabetically within this group
            else
                [0, name.downcase]  # Group for all other names, case-insensitive alphabetical sorting
            end
        end

        bases = []
        overlays = []
        @store.each do |item|
            if item.item.is_a?(String)
                my_item = JSON.parse(item.item)
            else
                my_item = item.item
            end
            graph = my_item["@graph"] rescue []
            graph.each do |el|
                if el["@type"] == "owl:Class"
                    bases << el["@id"]
                elsif el["@type"] == "OverlayAlignment"
                    overlays << {"type": "Alignment", "name": item.dri, "base": el["onBase"]}
                elsif el["@type"] == "OverlayAnnotation"
                    overlays << {"type": "Annotation", "name": item.dri, "base": el["onBase"]}
                elsif el["@type"] == "OverlayClassification"
                    overlays << {"type": "Classification", "name": item.dri, "base": el["onBase"]}
                elsif el["@type"] == "OverlayEncoding"
                    overlays << {"type": "Encoding", "name": item.dri, "base": el["onBase"]}
                elsif el["@type"] == "OverlayForm"
                    overlays << {"type": "Form", "name": item.dri, "base": el["onBase"]}
                elsif el["@type"] == "OverlayFormat"
                    overlays << {"type": "Format", "name": item.dri, "base": el["onBase"]}
                elsif el["@type"] == "OverlayTransformation"
                    overlays << {"type": "Transformation", "name": item.dri, "base": el["onBase"]}
                elsif el["@type"] == "OverlayValidation"
                    overlays << {"type": "Validation", "name": item.dri, "base": el["onBase"]}
                end
            end unless graph == []
        end
        render json: {"name": soya_name, "dri": soya_dri, "history": sorted_history, "bases": bases.uniq, "overlays": overlays.uniq},
               status: 200

    end
end
