include SoyaHelper

ids = HTTParty.get("https://soya.ownyourdata.eu/api/records")
# ids=ids.first(100)
ids.each do |id|
    rec = HTTParty.get("https://soya.ownyourdata.eu/api/record/" + id.to_s)

    soya_json = rec["item"]
    soya_yaml = rec["soya_yaml"]
    soya_name = rec["soya_name"] #getSoyaName(soya_json.deep_dup)
    soya_dri_json, soya_dri, msg = createDriVersion(soya_json.deep_dup)
    meta_data = {soya_dri: soya_dri}
    dri = Oydid.hash(Oydid.canonical({"data": soya_json, "meta": meta_data}.to_json))
    soya_tag = nil
    if rec["soya_name"] == rec["dri"]
        soya_tag = "current"
    end

    @r = Store.new(
        item: soya_json, 
        meta: meta_data, 
        dri: dri, 
        soya_name: soya_name,
        soya_dri: soya_dri,
        soya_yaml: soya_yaml,
        soya_tag: soya_tag)
    if @r.save
        puts "Success for #" + id.to_s + " (at " + @r.id.to_s + ")"
    else
        puts "ERROR saving #" + id.to_s
    end
    @r.created_at = rec["created_at"]
    @r.save

end

# last Store: 108
# Store.where("id > ?", 108).delete_all

