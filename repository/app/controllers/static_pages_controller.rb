class StaticPagesController < ApplicationController
    include ApplicationHelper
    def home
        output = "<html><head><title>Semantic Overlay Architecture Repository</title>"
        output +="</head><body>"
        output +="<h1>Semantic Overlay Architecture Repository</h1>"
        output +="<p><strong>Statistics</strong> for this repository:</p><ul>"
        output +="<li>unique SOyA Structures: " + Store.pluck(:soya_name).uniq.count.to_s + "</li>"
        output +="<li>overall SOyA elements: " + Store.where.not(soya_name: nil).count.to_s + "</li>"
        output +="</ul><p>Find more information here:</p><ul>"
        output +='<li>Specification: <a href="https://ownyourdata.github.io/soya/">https://ownyourdata.github.io/soya/</a></li>'
        output +='<li>Github: <a href="https://github.com/OwnYourData/soya/">https://github.com/OwnYourData/soya/</a></li>'
        output +="</ul></body></html>" 
        render html: output.html_safe, 
               status: 200

    end


end
