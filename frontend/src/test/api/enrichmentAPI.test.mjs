import test from 'ava';
import { analyze_and_visualize_enrichment } from '../../api/enrichmentAPI.mjs';

const enrichmentRequest = {
  gene_set: ["gene1", "gene2", "gene3"],
  title: "My Analysis",
  email: "user@example.com",
  annotation_file_name: "whole_genome_v2_nov-11-2021.csv",
  background: ["geneA", "geneB", "geneC"],
  p_adjust_method: "bonferroni",
  p_adjust_threshold: 0.05
};

test('analyze_and_visualize_enrichment returns expected response', async t => {
  const response = await analyze_and_visualize_enrichment(enrichmentRequest);
  
  t.truthy(response); // checks that response is not null or undefined
  t.assert(response.run_id !== undefined, 'Response should contain a run_id');
  t.assert(response.chart_base !== undefined, 'Response should contain a chart_base');
});