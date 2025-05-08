export const ANNOTATION_OPTIONS = [
    { value: "whole_genome_v2_nov-11-2021.csv", label: "Whole genome" },
    { value: "ORF_only_v2_nov-11-2021.csv", label: "ORF only" },
    { value: "ahringer_v2_nov-11-2021.csv", label: "Ahringer RNAi" },
    { value: "orfeome_v2_nov-11-2021.csv", label: "Orfeome RNAi" },
  ];
  
  export const SIGNIFICANCE_METHODS = [
    { value: "bonferroni", label: "Bonferroni correction" },
    { value: "fdr_bh", label: "Benjamini-Hochberg FDR" },
  ];
  
  export const DOMAIN_SCOPES = [
    { value: "all_genes", label: "All Genes" },
    { value: "custom", label: "Custom" },
  ];

  export const FILE_TYPE = [
    { value: "batch", label: "Excel" },
    { value: "gene_set", label: "CSV" },
  ];