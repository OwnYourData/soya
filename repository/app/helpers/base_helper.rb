module BaseHelper
    def getAttributes(input)
        return input["@graph"].map{|e| e["@id"] unless e["domain"].nil?}.compact rescue []
    end

    def getBaseName(input)
        base_name = ""
        input.each do |k, v|
            if k == "onBase" && v.is_a?(String)
                if v =~ /\A#{URI::regexp(['http', 'https'])}\z/
                    base_name = v.split('/')[-1]
                else
                    base_name = v
                end
            elsif v.is_a?(Hash)
                base_name = getBaseName v
            elsif v.is_a?(Array)
                v.flatten.each do |x| 
                    if x.is_a?(Hash)
                        retVal = getBaseName(x)
                        if retVal != ""
                            base_name = retVal
                        end
                    end
                end
            end
        end
        base_name
    end

    def getSoyaName(input)
        base_url = input["@context"]["@base"].to_s rescue ""
        return base_url.split('/')[-1] rescue ""
    end

    def createDriVersion(input)
        begin
puts "in createDriVersion"
            base_url = input["@context"]["@base"] rescue ""
puts "base_url: " + base_url.to_s
            input["@context"].delete("@base") rescue nil
            raw = iterate(JSON.parse(input.to_json_c14n)).to_json_c14n
            dri = Multibases.pack("base58btc", Multihashes.encode(Digest::SHA256.digest(raw), "sha2-256").unpack('C*')).to_s
            raw = JSON.parse(raw)
            raw["@context"]["@base"] = base_url.split('/')[0..-2].join("/") + "/" + dri + "/"
puts "raw------------"
puts raw.to_json
puts "------------"
        rescue
            return input
        end
        return raw
    end

    def getDriFromUrl(url)
        begin
puts "url: " + url
            response = HTTParty.get(url + "info", timeout: 5)
puts "response: " + response.to_json
            # dri = Store.find_by_dri(url.split('/')[-1]).soya_dri rescue nil
            dri = response.parsed_response["dri"]
puts "dri: " + dri.to_s
            if dri.nil? || dri.to_s == ""
                return url
            else
                return url.split('/')[0..-2].join("/") + "/" + dri + "/"
            end
        rescue
            return url
        end
    end

    def updateOnBase(input)
        input.each do |k, v|
            if k == "onBase" && v.is_a?(String)
                dri = getDriFromUrl(v)
                v.replace dri
            elsif v.is_a?(Hash)
                updateOnBase v
            elsif v.is_a?(Array)
                v.flatten.each { |x| updateOnBase(x) if x.is_a?(Hash) }
            end
        end
        input        
    end

    def calculateDri(input)
        input["@context"].delete("@base") rescue nil
        raw = iterate(JSON.parse(input.to_json_c14n)).to_json_c14n
        return Multibases.pack("base58btc", Multihashes.encode(Digest::SHA256.digest(raw), "sha2-256").unpack('C*')).to_s
    end

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

end