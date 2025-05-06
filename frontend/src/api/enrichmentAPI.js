import { apiRequest } from "./apiRequestUtil.js";

  
export const analyze_and_visualize_enrichment = (enrichmentRequest) => {
    const result =  apiRequest('post', `/wormcat3/analyze_and_visualize_enrichment`, enrichmentRequest);
    return result
};
