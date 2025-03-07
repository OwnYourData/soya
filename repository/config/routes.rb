Rails.application.routes.draw do
	match '/oauth/revoke'           => 'application#revoke_token',        via: 'post'
	use_doorkeeper do
		skip_controllers :applications
	end

    root 'static_pages#home'
    match '/' => 'static_pages#home', via: 'get'
    match 'test' => 'static_pages#home', via: 'get'

	namespace :api, defaults: { format: :json } do
		scope module: :v1, constraints: ApiConstraints.new(version: 1, default: true) do
			match 'active',             to: 'processes#active',       via: 'get'
			match 'init',               to: 'processes#init',         via: 'post'
			match 'meta',               to: 'semantics#create',       via: 'post'
			match 'meta',               to: 'semantics#show',	      via: 'get'
			match 'meta/info',          to: 'semantics#show_info',    via: 'get'
			match 'meta/usage',         to: 'semantics#show_usage',   via: 'get'
			match 'meta/example',       to: 'semantics#show_example', via: 'get'
			match 'meta/schemas',       to: 'semantics#schema',       via: 'get'
			match 'meta/tables',        to: 'semantics#table',        via: 'get'
			match 'data',               to: 'stores#index',           via: 'get'
			match 'data',               to: 'stores#delete',          via: 'delete'
			match 'data/:id',           to: 'stores#index',           via: 'get'
			match 'data',               to: 'stores#write',           via: 'post'
			match 'data/:id',           to: 'stores#write',           via: 'put'
			match 'data/:id',           to: 'stores#delete',          via: 'delete'
			match 'info',               to: 'infos#index',            via: 'get'
			match 'log',                to: 'logs#index',             via: 'get'
    
			match 'receipts',           to: 'receipts#index',         via: 'get'
			match 'receipt/:id',        to: 'receipts#show',          via: 'get'
			match 'receipt/:ttl/:id',   to: 'receipts#show',          via: 'get'
			match 'receipt/:id/revoke', to: 'receipts#revoke',        via: 'delete' 
			match 'rcpt/:id',           to: 'receipts#show',          via: 'get', defaults: { short: "TRUE" }
			match 'rcpt/:ttl/:id',      to: 'receipts#show',          via: 'get', defaults: { short: "TRUE" }
			match 'receipt/:id',        to: 'receipts#create',        via: 'post'
			match 'receipt',            to: 'receipts#create',        via: 'post'
    
			match 'buy',                to: 'payments#buy',           via: 'post'
			match 'paid',               to: 'payments#paid',          via: 'get'
			match 'payments',           to: 'payments#payments',      via: 'get'

			#watermarking
			match 'data/fragment/:fragment_id', 
				to: 'watermarks#account_fragment',                via: 'get'
			match 'watermark/account/:account_id',
				to: 'watermarks#account_data',                    via: 'get'
			match 'watermark/account/:account_id/fragment/:fragment_id',
				to: 'watermarks#account_fragment_data',           via: 'get'
			match 'watermark/account/:account_id/fragment/:fragment_id/error',
				to: 'watermarks#account_fragment_error',          via: 'get'
			match 'watermark/account/:account_id/fragment/:fragment_id/kpi/:kpi',
				to: 'watermarks#account_fragment_kpi',            via: 'get'
			match 'watermark/error/:key(/:len)',
				to: 'watermarks#key',                             via: 'get'
			match 'watermark/fragments',     
				to: 'watermarks#fragments_list',                  via: 'get'
			match 'watermark/fragment/:fragment_id',     
				to: 'watermarks#raw_data',                        via: 'get'
			match 'watermark/identify', 
				to: 'watermarks#identify',                        via: 'post'
			match 'watermark/account/:account_id/fragment/:fragment_id',
				to: 'watermarks#compare',                         via: 'post'

			# Relations
			match 'relation', to: 'relations#index', via: 'get'
			match 'relation', to: 'relations#create', via: 'post'

			# SOyA specific
			match 'soya/similar',      to: 'soyas#similar',       via: 'post'
			match 'soya/query',        to: 'dris#query', 		  via: 'get'
			match 'soya/info',         to: 'dris#info',           via: 'post'
			match 'record/:id',        to: 'soyas#record',        via: 'get'
			match 'records',           to: 'soyas#record_list',   via: 'get'
		end
	end

	# OAuth application handling
	match '/oauth/applications'     => 'application#create_application',  via: 'post'
	match '/oauth/applications/:id' => 'application#destroy_application', via: 'delete'

	# SOyA Instances
    match 'ld/:dri/:name/:sub', to: 'lds#read',  via: 'get', constraints: {dri: /.*/}
	match 'ld/:dri/:name',      to: 'lds#read',  via: 'get', constraints: {dri: /.*/}
	match 'ld/:dri',            to: 'lds#read',  via: 'get', constraints: {dri: /.*/}

	# SOyA Structures
    match ':dri/info',       to: 'dris#info', via: 'get', constraints: {dri: /.*/}
    match ':dri/yml',        to: 'dris#read_yaml', via: 'get', constraints: {dri: /.*/}
    match ':dri/yaml',       to: 'dris#read_yaml', via: 'get', constraints: {dri: /.*/}
    match ':dri/:name/:sub', to: 'dris#read', via: 'get', constraints: {dri: /.*/}
    match ':dri/:name',      to: 'dris#read', via: 'get', constraints: {dri: /.*/}
    match ':dri',            to: 'dris#read', via: 'get', constraints: {dri: /.*/}



	match ':not_found' => 'application#missing', :constraints => { :not_found => /.*/ }, via: [:get, :post]
end
