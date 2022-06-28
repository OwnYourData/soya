class DrisController < ApplicationController
    include ApplicationHelper

    # respond only to JSON requests
    respond_to :json
    respond_to :html, only: []
    respond_to :xml, only: []

    def read
        @item = Store.find_by_dri(params[:dri]) rescue nil
        if @item.nil?
            render json: {"error": "not found"},
                    status: 404
            return
        end
        render json: JSON.parse(@item.item),
               status: 200
    end

    def read_yaml
        @item = Store.find_by_dri(params[:dri]) rescue nil
        if @item.nil?
            render json: {"error": "not found"},
                    status: 404
            return
        end
        if @item.soya_yaml.to_s == ""
            render plain: "",
                   status: 405
        else
            render plain: @item.soya_yaml,
                   status: 200
        end
    end

    def info
        soya_dri = Store.find_by_dri(params[:dri].to_s).soya_dri rescue ""
        soya_name = Store.find_by_dri(params[:dri].to_s).soya_name rescue ""
        # if soya_dri == ""
        #     soya_dri = Store.find_by_soya_name(params[:dri].to_s).soya_dri rescue ""
        # end

        history = []
        @store = Store.where(soya_name: params[:dri].to_s)
        @store.pluck(:dri, :updated_at).sort_by{|i| i[1]}.reverse.each{|i| history << {"schema": i[0], "date": i[1].strftime("%FT%RZ")} }
        if history.length == 0
            @store = Store.where(dri: params[:dri].to_s)
            @store.pluck(:dri, :updated_at).each{|i| history << {"schema": i[0], "date": i[1].strftime("%FT%RZ")} }
        end

        bases = []
        overlays = []
        @store.each do |item|
            graph = JSON.parse(item.item)["@graph"] rescue []
            graph.each do |el|
                if el["@type"] == "owl:Class"
                    bases << el["@id"]
                elsif el["@type"] == "OverlayValidation"
                    overlays << {"type": "Validation", "name": item.dri, "base": el["onBase"]}
                elsif el["@type"] == "OverlayAlignment"
                    overlays << {"type": "Alignment", "name": item.dri, "base": el["onBase"]}
                elsif el["@type"] == "OverlayAnnotation"
                    overlays << {"type": "Annotation", "name": item.dri, "base": el["onBase"]}
                elsif el["@type"] == "OverlayClassification"
                    overlays << {"type": "Classification", "name": item.dri, "base": el["onBase"]}
                elsif el["@type"] == "OverlayEncoding"
                    overlays << {"type": "Encoding", "name": item.dri, "base": el["onBase"]}
                elsif el["@type"] == "OverlayFormat"
                    overlays << {"type": "Format", "name": item.dri, "base": el["onBase"]}
                elsif el["@type"] == "OverlayTransformation"
                    overlays << {"type": "Transformation", "name": item.dri, "base": el["onBase"]}
                end
            end unless graph == []
        end
        @store = Store.where(table_name: params[:dri].to_s)
        @store.each do |item|
            graph = JSON.parse(item.item)["@graph"] rescue []
            graph.each do |el|
                if el["@type"] == "owl:Class"
                    bases << el["@id"]
                elsif el["@type"] == "OverlayValidation"
                    overlays << {"type": "Validation", "name": item.dri, "base": el["onBase"]}
                elsif el["@type"] == "OverlayAlignment"
                    overlays << {"type": "Alignment", "name": item.dri, "base": el["onBase"]}
                elsif el["@type"] == "OverlayAnnotation"
                    overlays << {"type": "Annotation", "name": item.dri, "base": el["onBase"]}
                elsif el["@type"] == "OverlayClassification"
                    overlays << {"type": "Classification", "name": item.dri, "base": el["onBase"]}
                elsif el["@type"] == "OverlayEncoding"
                    overlays << {"type": "Encoding", "name": item.dri, "base": el["onBase"]}
                elsif el["@type"] == "OverlayFormat"
                    overlays << {"type": "Format", "name": item.dri, "base": el["onBase"]}
                elsif el["@type"] == "OverlayTransformation"
                    overlays << {"type": "Transformation", "name": item.dri, "base": el["onBase"]}
                end
            end unless graph == []
        end
        render json: {"name": soya_name, "dri": soya_dri, "history": history, "bases": bases.uniq, "overlays": overlays.uniq},
               status: 200
    end

    def query
        retVal = []
        name_query = params[:name].to_s
        if name_query != ""
            items = Store.where('lower(soya_name) LIKE ?', "%" + name_query.downcase + "%").all.pluck(:soya_name).uniq
            items.each do |item|
                retVal << {"name": item, "dri": Store.find_by_dri(item).soya_dri }
            end
        end

        render json: retVal,
               status: 200
    end
end