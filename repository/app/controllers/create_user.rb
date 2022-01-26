# login to SOWL: https://ssi-demo.esatus.com/login?tenant=17934

require("httparty")

tenant_id = "17934"
id="23183"
secret = "lzdysrq2sOZgVpJuSWDaVZXRGXf6prVDjxcdqxsVT6U"
secret = "123"
auth_token = Base64.strict_encode64(id + ":" + secret)
retval = HTTParty.post("https://core-ssi-demo.esatus.com:443/api/authentication/authenticateAPIConsumerOIDC", 
            headers: { 'Content-Type' => 'application/json', 'Authorization' => 'Basic ' + auth_token})

# create new user
user_object = JSON.parse('
{
  "tenant": ' + tenant_id + ',
  "userID": "Bj5rzkn20ew",
  "email": "office@ownyourdata.eu",
  "emailVerified": true,
  "firstname": "Verein",
  "lastname": "OYD"
}')

r2 = HTTParty.post("https://core-ssi-demo.esatus.com:443/api/data/identity?tenant=" + tenant_id, 
        headers: {  'Content-Type' => 'application/json', 
                    'Accept' => 'application/json',
                    'Authorization' => "Bearer " + retval.parsed_response["id_token"]},
        body: user_object.to_json)

# retrieve all users
r1=HTTParty.get("https://core-ssi-demo.esatus.com:443/api/data/identity?tenant=" + tenant_id, 
        headers: { 'Content-Type' => 'application/json', 'Authorization' => "Bearer " + retval.parsed_response["id_token"]})

# create new user
user_object = JSON.parse('
{
  "email": "office@ownyourdata.eu",
  "emailVerified": true,
  "firstname": "Verein",
  "lastname": "OYD"
}')

r2 = HTTParty.post("https://core-ssi-demo.esatus.com:443/api/data/identity?tenant=" + tenant_id, 
        headers: {  'Content-Type' => 'application/json', 
                    'Accept' => 'application/json',
                    'Authorization' => "Bearer " + retval.parsed_response["id_token"]},
        body: user_object.to_json)
