import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { analyze_and_visualize_enrichment } from "../api/enrichmentAPI.mjs"

export default function WormCatForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("dan@none.com");
  const [annotationType, setAnnotationType] = useState("whole_genome_v2_nov-11-2021.csv");
  const [significanceMethod, setSignificanceMethod] = useState("bonferroni");
  const [significanceThreshold, setSignificanceThreshold] = useState("0.05");
  const [analysisTitle, setAnalysisTitle] = useState("Test");
  const [geneSetText, setGeneSetText] = useState("");
  const [fileName, setFileName] = useState("");

  const [statisticalDomain, setStatisticalDomain] = useState("all_genes");
  const [customBackgroundText, setCustomBackgroundText] = useState("");
  const [customBackgroundFileName, setCustomBackgroundFileName] = useState("");


  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setGeneSetText(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleCustomDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setCustomBackgroundFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomBackgroundText(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  function is_geneset(text_area_data) {
    // Split input into non-empty trimmed lines
    const lines = text_area_data
      .split("\n")
      .map(line => line.trim())
      .filter(line => line !== "");
  
    // Rule 1: At least 2 rows
    if (lines.length < 2) {
      return false;
    }
  
    // Rule 2: Each line ≤ 20 characters
    if (lines.some(line => line.length > 20)) {
      return false;
    }
  
    const startsWithWBGene = line => line.startsWith("WBGene");
  
    // Rule 3: Consistency in format
    // Either both lines start with WBGene or both do not
    const isConsistent =
      startsWithWBGene(lines[0]) === startsWithWBGene(lines[1]);

    if (!isConsistent) {
      return false;
    }
  
    // All rules passed
    return true;
  }


  const handleSubmit = async (e) => {
        e.preventDefault();

        if (statisticalDomain === "custom" &&  !is_geneset(customBackgroundText.trim())){
            // Manually trigger validation message on the textarea
            const textarea = document.getElementById("custom-background-textarea-id");
            textarea.setCustomValidity("If 'Custom' is selected you must have a custom background gene set. \nNote: Each row is either a Sequence Id or Wormbase Id and no header Row.");
            textarea.reportValidity(); // Shows the message
            return;   
        }

        if (!is_geneset(geneSetText.trim())){
          // Manually trigger validation message on the textarea
          const textarea = document.getElementById("gene-set-textarea-id");
          textarea.setCustomValidity("This does not look like a gene set. \nNote: Each row is either a Sequence Id or Wormbase Id and no header Row.");
          textarea.reportValidity(); // Shows the message
          return;   
      }

      const enrichmentRequest = {
        gene_set: geneSetText.trim().split(/\r?\n/).filter(Boolean),
        title: analysisTitle,
        email: email,
        annotation_file_name: annotationType,
        background:
          statisticalDomain === "custom"
            ? customBackgroundText.trim().split(/\r?\n/).filter(Boolean)
            : null,
        p_adjust_method: significanceMethod,
        p_adjust_threshold: parseFloat(significanceThreshold),
      };

      try {
        const response = await analyze_and_visualize_enrichment(enrichmentRequest);
        console.log(response)
        // Navigate to report page, pass data via state
        navigate("/report", { state: { data: response } });
      } catch (error) {
        alert("There was an error processing the analysis.");
        console.error(error);
      }

  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Process your Regulated Gene Set with WormCat
      </h1>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email, Annotation Type, Significance Method, Threshold */}
          <div>
            <label className="block font-semibold mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your Email"
              className="w-full border rounded p-2"
              required
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Annotation Type</label>
            <select
              value={annotationType}
              onChange={(e) => setAnnotationType(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="whole_genome_v2_nov-11-2021.csv">Whole genome</option>
              <option value="ORF_only_v2_nov-11-2021.csv">ORF only</option>
              <option value="ahringer_v2_nov-11-2021.csv">Ahringer RNAi</option>
              <option value="orfeome_v2_nov-11-2021.csv">Orfeome RNAi</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Significance Method</label>
            <select
              value={significanceMethod}
              onChange={(e) => setSignificanceMethod(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="bonferroni">Bonferroni correction</option>
              <option value="fdr_bh">Benjamini-Hochberg FDR</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Significance Threshold</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={significanceThreshold}
              onChange={(e) => {
                e.target.setCustomValidity(""); // Clear any previous custom message
                setSignificanceThreshold(e.target.value);
              }}
              onInvalid={(e) =>
                e.target.setCustomValidity("Significance threshold must be a number between 0 and 1.")
              }
              className="w-full border rounded p-2"
              required
            />
          </div>
        </div>

        {/* Statistical Domain Scope */}
        <div>
          <label className="block font-semibold mb-1">Statistical Domain Scope</label>
          <select
            value={statisticalDomain}
            onChange={(e) => setStatisticalDomain(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="all_genes">All Genes</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {/* Animate Presence */}
        <AnimatePresence>
          {statisticalDomain === "custom" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="overflow-hidden"
            >
              <div className="border-2 border-dashed border-orange-400 rounded p-6 mb-4">
                <label className="block font-semibold mb-2">
                  Upload or Paste Custom Background
                </label>
                <div
                  onDrop={handleCustomDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-gray-300 rounded p-6 text-center cursor-pointer mb-2"
                >
                  {customBackgroundFileName ? (
                    <p className="text-green-600">{customBackgroundFileName} loaded</p>
                  ) : (
                    <p>Drop Custom Background File Here</p>
                  )}
                </div>
                <textarea
                  id="custom-background-textarea-id"
                  value={customBackgroundText}
                  onChange={(e) => {
                    e.target.setCustomValidity(""); // clear custom error
                    setCustomBackgroundText(e.target.value);
                  }}
                  placeholder="Or Paste Custom Background Gene Set"
                  rows="6"
                  className="w-full border rounded p-2"
                  
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analysis Title */}
        <div>
          <label className="block font-semibold mb-1">Analysis Title</label>
          <input
            type="text"
            value={analysisTitle}
            onChange={(e) => setAnalysisTitle(e.target.value)}
            placeholder="Analysis Title"
            className="w-full border rounded p-2"
          />
        </div>

        {/* Regulated Gene Set */}
        <div>
          <label className="block font-semibold mb-1">Regulated Gene Set</label>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 rounded p-6 text-center cursor-pointer mb-2"
          >
            {fileName ? (
              <p className="text-green-600">{fileName} loaded</p>
            ) : (
              <p>Drop File Here</p>
            )}
          </div>
          <textarea
            id="gene-set-textarea-id"
            value={geneSetText}
            onChange={(e) => {
              e.target.setCustomValidity(""); // clear custom error
              setGeneSetText(e.target.value)
            }}

            placeholder="Or Paste Regulated Gene Set"
            rows="6"
            className="w-full border rounded p-2"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded"
        >
          Submit
        </button>
      </form>
    </div>
  );
}