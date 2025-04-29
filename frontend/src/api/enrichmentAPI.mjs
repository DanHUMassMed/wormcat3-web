import { apiRequest } from "./apiRequestUtil.mjs";

  
export const analyze_and_visualize_enrichment = (enrichmentRequest) => {
    return apiRequest('post', `/wormcat3/analyze_and_visualize_enrichment`, enrichmentRequest);
};
