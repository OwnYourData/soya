module SimilarityHelper
    # compare 2 vectors by calculating similarity search on shorter vector
    def similarity(vec1, vec2)
        simvec = []
        for i in 0..([vec1.length, vec2.length].min-1)
            simvec << String::Similarity.cosine(vec1[i], vec2[i])
        end
        simvec = (simvec << Array.new((vec1.length - vec2.length).abs, 0)).flatten
        return simvec.inject(:+).to_f / simvec.length # average of simvec
    end
end
