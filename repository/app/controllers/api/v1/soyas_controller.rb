module Api
    module V1
        class SoyasController < ApiController
            # respond only to JSON requests
            respond_to :json
            respond_to :html, only: []
            respond_to :xml, only: []

            include BaseHelper
            include SimilarityHelper

            def similar
                inputAttributes = getAttributes(params)
                retval = []
                Store.all.each do |item|
                    if item.dri.to_s != ""
                        simval = similarity(inputAttributes, getAttributes(JSON.parse(item.item))) rescue 0
                        retval << {:schema => item.dri.to_s, :similarity => simval}
                    end
                end
                retval = retval.sort_by { |i| i[:similarity] }.reverse.first(20) rescue []

                render json: retval.to_json,
                       status: 200
            end

            def record
                id = params[:id]
                @store = Store.find(id)
                retVal = JSON.parse(@store.to_json)
                retVal["item"] = JSON.parse(@store.item)
                render json: retVal,
                       status: 200
            end

            def record_list
                render json: Store.pluck(:id),
                       status: 200
            end
        end
    end
end
