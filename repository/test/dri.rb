#!/usr/bin/env ruby
# encoding: utf-8

# gem install 'json-canonicalization'
require 'Multibases'
require 'Multihashes'
require 'digest'
require 'json/canonicalization'
require 'optparse'
require 'uri'

def checkDRI(val)
    pos = (val =~ /zQm[1-9A-HJ-NP-Za-km-z]{44}/)
    if pos.nil?
      return val
    else
      if val =~ URI::DEFAULT_PARSER.regexp[:ABS_URI]
        return val[pos..(pos+46)]
      else
        return val
      end
    end
end

def iterate(i)
  if i.is_a?(Hash)
    i.each do |k, v|
      if v.is_a?(Hash) || v.is_a?(Array)
        iterate(v)
      else
        i[k] = checkDRI(v)
      end
    end
  elsif i.is_a?(Array)
    i.map! do |v|
      if v.is_a?(String)
        checkDRI(v)
      else
        iterate(v)
      end
    end
  end
end

# commandline options
options = { }
options[:verbose] = false
opt_parser = OptionParser.new do |opt|
  options[:doc_type] = 0 # 0 = layer
  opt.on("-l", "--layer", "document is a layer (base or overlay)") do |v|
    options[:doc_type] = 0
  end
  opt.on("-i", "--instance", "document is an instance") do |v|
    options[:doc_type] = 1 # 1 = instance
  end
  opt.on("-v", "--verbose", "print additional processing information") do |v|
    options[:verbose] = true
  end
end
opt_parser.parse!

# parse input
input = []
ARGF.each_line { |line| input << line }
input = input.join("\n")
raw = JSON.parse(input)

# sanitize input
if options[:doc_type].to_s == "0"
	# document is a layer (base or overlay)
	raw["@context"].delete("@base") rescue nil
else
	# document is an instance
	raw["@graph"].map{|i| i.delete("@id") rescue nil} rescue nil
end
raw = iterate(JSON.parse(raw.to_json_c14n)).to_json_c14n
if options[:verbose]
  puts "Raw input"
  puts raw.to_s
end

# hash and encode
puts Multibases.pack("base58btc", Multihashes.encode(Digest::SHA256.digest(raw), "sha2-256").unpack('C*')).to_s