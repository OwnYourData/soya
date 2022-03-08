module Api
    module V1
        class DrisController < ApiController
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
                qry = params[:_json]
                retVal = []
                qry.each do |el|
                    soya_name = Store.find_by_soya_dri(el.to_s).soya_name rescue ""
                    if soya_name == ""
                        retVal << {"dri": el, "name": el}
                    else
                        retVal << {"dri": el, "name": soya_name}
                    end
                end
                render json: retVal,
                       status: 200
            end

            def query
                retVal = []
                name_query = params[:name].to_s
                if name_query != ""
                    items = Store.where('soya_name LIKE ?', "%" + name_query + "%").all.pluck(:soya_name).uniq
                    items.each do |item|
                        retVal << {"name": item, "dri": Store.find_by_dri(item).soya_dri }
                    end
                end

                render json: retVal,
                       status: 200
            end
        end
    end
end