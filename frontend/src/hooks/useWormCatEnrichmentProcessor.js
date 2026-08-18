import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { analyze_and_visualize_enrichment } from "../api/enrichmentAPI";

export const useWormCatEnrichmentProcessor = (fields) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const onClickRunAnalysis = async () => {
        if (fields.validateFields()) return;
        
        setLoading(true);
        setErrorMessage("");
        
        // Prepare request payload
        const enrichmentRequest = {
          gene_set: fields.geneSetText.trim().split(/\r?\n/).filter(Boolean),
          title: fields.analysisTitle || "Analysis", // Default title if empty
          email: fields.email,
          annotation_file_name: fields.annotationType,
          p_adjust_method: fields.significanceMethod,
          p_adjust_threshold: parseFloat(fields.significanceThreshold),
        };

        // Add custom background if selected
        if (fields.statisticalDomain === "custom") {
          enrichmentRequest.background_genes = fields.customBackgroundText.trim().split(/\r?\n/).filter(Boolean);
        }
    
        try {
          const response_data = await analyze_and_visualize_enrichment(enrichmentRequest);
          console.log("response_data", response_data);
          if (response_data?.run_id) {
            navigate(`/report/${response_data.run_id}`);
          } else if (response_data.status_code !== 200) {
            setErrorMessage(response_data.message);
          }else{
            setErrorMessage("Analysis failed: no run ID returned from the server.");
          }
        } catch (error) {
          // Handle specific error types
          if (error.name === "AbortError") {
            setErrorMessage("Request timed out. Please try again later.");
          } else {
            setErrorMessage(`Error: ${error.message || "Failed to process analysis"}`);
          }
          console.error("Analysis error:", error);
        } finally {
          setLoading(false);
        }
      };

      return {
        onClickRunAnalysis,
        loading,
        errorMessage
      };
}  
