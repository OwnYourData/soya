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

    # UI ==========================
    match '/soya/user',     to: 'static_pages#user',     via: 'get'
    match '/soya/register', to: 'static_pages#register', via: 'get'

    # SOyA ========================
    match ':dri/info',           to: 'dri#info',           via: 'get',    constraints: {dri: /.*/}
    match ':dri/yaml',           to: 'dri#read_yaml',      via: 'get',    constraints: {dri: /.*/}
    match ':dri/yml',            to: 'dri#read_yaml',      via: 'get',    constraints: {dri: /.*/}
    match ':dri/ttl',            to: 'dri#read_ttl',       via: 'get',    constraints: {dri: /.*/}
    match ':dri/turtle',         to: 'dri#read_ttl',       via: 'get',    constraints: {dri: /.*/}
    match ':dri/context.jsonld', to: 'dri#context_jsonld', via: 'get',    constraints: {dri: /.*/}
    match ':dri/:term',          to: 'dri#read',           via: 'get',    constraints: {dri: /[^\/]+/}
    match ':dri',                to: 'dri#read',           via: 'get',    constraints: {dri: /.*/}
    match ':dri',                to: 'dri#delete',         via: 'delete', constraints: {dri: /.*/}

end