# Rendering wie dc-pod SoyaHelper#render_soya_label (Gem handlebars-engine).
# Aufruf: ruby test/render.rb <struktur.jsonld> <daten.json> [<daten.json> ...]
require "json"
require "handlebars/engine"

doc = JSON.parse(File.read(ARGV.shift))
overlay = doc["@graph"].find do |item|
  next false unless item.is_a?(Hash)
  type = item["@type"]
  type == "OverlayDataBudRendering" || (type.is_a?(Array) && type.include?("OverlayDataBudRendering"))
end
label = overlay && overlay["renderingLabel"]
abort("kein renderingLabel") if label.to_s.empty?

handlebars = Handlebars::Engine.new
template = handlebars.compile(label)
ARGV.each do |file|
  record = JSON.parse(File.read(file))
  puts "#{File.basename(file)} -> \"#{template.call(record)}\""
end
