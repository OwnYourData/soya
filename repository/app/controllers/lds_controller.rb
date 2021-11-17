class LdsController < ApplicationController
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
end