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

    def info
        soya_dri = Store.find_by_soya_name(params[:dri].to_s).soya_dri rescue ""
        if soya_dri == ""
            soya_dri = Store.find_by_dri(params[:dri].to_s).soya_dri rescue ""
        end

        history = []
        @store = Store.where(soya_name: params[:dri].to_s)
        @store.pluck(:dri, :updated_at).sort_by{|i| i[1]}.reverse.each{|i| history << {"schema": i[0], "date": i[1].strftime("%FT%RZ")} }
        if history.length == 0
            @store = Store.where(dri: params[:dri].to_s)
            @store.pluck(:dri, :updated_at).each{|i| history << {"schema": i[0], "date": i[1].strftime("%FT%RZ")} }
        end

        overlay = []
        @store.each do |item|
            graph = JSON.parse(item.item)["@graph"] rescue []
            graph.each do |el|
                if el["@type"] == "OverlayValidation"
                    overlay << {"type": "Validation", "name": item.dri, "base": el["onBase"]}
                end
            end unless graph == []
        end
        @store = Store.where(table_name: params[:dri].to_s)
        @store.each do |item|
            graph = JSON.parse(item.item)["@graph"] rescue []
            graph.each do |el|
                if el["@type"] == "OverlayValidation"
                    overlay << {"type": "Validation", "name": item.dri, "base": el["onBase"]}
                elsif el["@type"] == "OverlayAlignment"
                    overlay << {"type": "Alignment", "name": item.dri, "base": el["onBase"]}
                elsif el["@type"] == "OverlayAnnotation"
                    overlay << {"type": "Annotation", "name": item.dri, "base": el["onBase"]}
                elsif el["@type"] == "OverlayClassification"
                    overlay << {"type": "Classification", "name": item.dri, "base": el["onBase"]}
                elsif el["@type"] == "OverlayEncoding"
                    overlay << {"type": "Encoding", "name": item.dri, "base": el["onBase"]}
                elsif el["@type"] == "OverlayFormat"
                    overlay << {"type": "Format", "name": item.dri, "base": el["onBase"]}
                elsif el["@type"] == "OverlayTransformation"
                    overlay << {"type": "Transformation", "name": item.dri, "base": el["onBase"]}
                end
            end unless graph == []
        end
        render json: {"dri": soya_dri, "history": history, "overlays": overlay.uniq},
               status: 200
    end
end