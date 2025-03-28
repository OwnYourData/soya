scope '/' do
    namespace :api, defaults: { format: :json } do
        scope "(:version)", :version => /v1/, module: :v1 do
            match 'data/:id',     to: 'soya#read',    via: 'get'
            match 'soya/query',   to: 'soya#query',   via: 'get'
            match 'soya/info',    to: 'soya#info',    via: 'post'
            match 'soya/similar', to: 'soya#similar', via: 'post'
            match 'soya/tag',     to: 'soya#tag',     via: 'post'
        end
    end
    match '/soya/register', to: 'frontend#register', via: 'get'
    match '/soya/user',     to: 'frontend#user',     via: 'get'
    match ':dri/info',   to: 'dri#info',      via: 'get',    constraints: {dri: /.*/}
    match ':dri/yaml',   to: 'dri#read_yaml', via: 'get',    constraints: {dri: /.*/}
    match ':dri/yml',    to: 'dri#read_yaml', via: 'get',    constraints: {dri: /.*/}
    match ':dri/ttl',    to: 'dri#read_ttl',  via: 'get',    constraints: {dri: /.*/}
    match ':dri/turtle', to: 'dri#read_ttl',  via: 'get',    constraints: {dri: /.*/}
    match ':dri',        to: 'dri#read',      via: 'get',    constraints: {dri: /.*/}
    match ':dri',        to: 'dri#delete',    via: 'delete', constraints: {dri: /.*/}
end