#!/usr/bin/env node
/**
 * Blueprint Analysis CLI Tool
 * Command-line interface for testing blueprint analysis
 */

import { program } from 'commander';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';

const API_BASE = process.env.API_URL || 'http://localhost:5001/api';
const TOKEN = process.env.API_TOKEN || '';

const api = axios.create({
  baseURL: API_BASE,
  headers: TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {}
});

program
  .name('blueprint-cli')
  .description('CLI tool for blueprint analysis')
  .version('1.0.0');

// Health check command
program
  .command('health')
  .description('Check service health')
  .action(async () => {
    const spinner = ora('Checking services...').start();
    
    try {
      const [orchestrator, aecvision, floorplan] = await Promise.all([
        api.get('/blueprint/health').catch(() => ({ data: { status: 'down' } })),
        axios.get('http://localhost:8002/health').catch(() => ({ data: { status: 'down' } })),
        axios.get('http://localhost:8003/health').catch(() => ({ data: { status: 'down' } }))
      ]);

      spinner.stop();

      const table = new Table({
        head: ['Service', 'Status', 'Port'],
        colWidths: [20, 15, 10]
      });

      table.push(
        ['Orchestrator', orchestrator.data.status === 'healthy' ? chalk.green('✓ Up') : chalk.red('✗ Down'), '5001'],
        ['AECVision', aecvision.data.status === 'healthy' ? chalk.green('✓ Up') : chalk.red('✗ Down'), '8002'],
        ['Floorplan', floorplan.data.status === 'healthy' ? chalk.green('✓ Up') : chalk.red('✗ Down'), '8003']
      );

      console.log(table.toString());
    } catch (error) {
      spinner.fail('Health check failed');
      console.error(error.message);
    }
  });

// Analyze command
program
  .command('analyze <file>')
  .description('Analyze a blueprint PDF')
  .option('-s, --services <services>', 'Services to use (comma-separated: dimensions,vision,ai)', 'dimensions,vision,ai')
  .option('--sync', 'Wait for completion (synchronous)')
  .option('-o, --output <format>', 'Output format (json,table)', 'table')
  .action(async (file, options) => {
    if (!fs.existsSync(file)) {
      console.error(chalk.red(`File not found: ${file}`));
      process.exit(1);
    }

    const services = options.services.split(',').map(s => s.trim());
    const absolutePath = path.resolve(file);

    console.log(chalk.blue(`Analyzing: ${file}`));
    console.log(chalk.gray(`Services: ${services.join(', ')}`));

    const spinner = ora('Submitting analysis...').start();

    try {
      let response;

      if (options.sync) {
        // Synchronous analysis
        response = await api.post('/blueprint/analyze-sync', {
          filePath: absolutePath,
          services
        });
        spinner.succeed('Analysis complete!');
        displayResults(response.data, options.output);
      } else {
        // Asynchronous analysis
        response = await api.post('/blueprint/analyze', {
          filePath: absolutePath,
          services
        });

        const jobId = response.data.jobId;
        spinner.text = `Job submitted: ${jobId}`;

        // Poll for completion
        let completed = false;
        while (!completed) {
          await new Promise(r => setTimeout(r, 2000));
          
          const statusRes = await api.get(`/blueprint/jobs/${jobId}`);
          const job = statusRes.data;

          spinner.text = `Progress: ${job.progress}% (${job.status})`;

          if (job.status === 'completed') {
            completed = true;
            spinner.succeed('Analysis complete!');
            displayResults(job.results, options.output);
          } else if (job.status === 'failed') {
            spinner.fail('Analysis failed');
            console.error(chalk.red(job.errors.join('\n')));
            process.exit(1);
          }
        }
      }
    } catch (error) {
      spinner.fail('Analysis failed');
      console.error(chalk.red(error.response?.data?.error?.message || error.message));
      process.exit(1);
    }
  });

// Export command
program
  .command('export <jobId>')
  .description('Export analysis results')
  .option('-f, --format <format>', 'Export format (pdf,csv,excel,json)', 'pdf')
  .option('-o, --output <path>', 'Output path')
  .action(async (jobId, options) => {
    const spinner = ora('Creating export...').start();

    try {
      const response = await api.post(`/blueprint/export/${jobId}`, {
        format: options.format
      });

      spinner.succeed('Export created!');
      
      console.log(chalk.green('\nExport Details:'));
      console.log(`  Format: ${response.data.format}`);
      console.log(`  Filename: ${response.data.filename}`);
      console.log(`  Download: ${API_BASE.replace('/api', '')}${response.data.downloadUrl}`);
      console.log(`  Expires: ${new Date(response.data.expiresAt).toLocaleString()}`);
    } catch (error) {
      spinner.fail('Export failed');
      console.error(chalk.red(error.response?.data?.error?.message || error.message));
    }
  });

// Compare methods command
program
  .command('compare <file>')
  .description('Compare different analysis methods')
  .action(async (file) => {
    if (!fs.existsSync(file)) {
      console.error(chalk.red(`File not found: ${file}`));
      process.exit(1);
    }

    const spinner = ora('Running comparison...').start();

    try {
      const response = await api.post('/blueprint/compare-methods', {
        filePath: path.resolve(file)
      });

      spinner.succeed('Comparison complete!');

      const { comparison } = response.data;

      // Display comparison table
      console.log(chalk.blue('\nProcessing Time:'));
      const timeTable = new Table({
        head: ['Method', 'Seconds', 'Sources'],
        colWidths: [25, 10, 10]
      });

      Object.entries(comparison.processingTime).forEach(([method, data]) => {
        timeTable.push([
          method.replace(/([A-Z])/g, ' $1').trim(),
          data?.estimatedSeconds || '-',
          data?.sourcesUsed || '-'
        ]);
      });
      console.log(timeTable.toString());

      // Display fixture counts
      console.log(chalk.blue('\nFixture Detection:'));
      Object.entries(comparison.fixtureCounts).forEach(([method, fixtures]) => {
        console.log(chalk.gray(`\n${method.replace(/([A-Z])/g, ' $1').trim()}:`));
        Object.entries(fixtures).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      });

      console.log(chalk.green(`\nRecommendation: ${comparison.recommendation}`));
    } catch (error) {
      spinner.fail('Comparison failed');
      console.error(chalk.red(error.response?.data?.error?.message || error.message));
    }
  });

// Helper function to display results
function displayResults(results, format) {
  if (format === 'json') {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  const { combined } = results;

  if (!combined) {
    console.log(chalk.yellow('No combined results available'));
    return;
  }

  // Summary table
  console.log(chalk.blue('\n📊 Summary:'));
  const summaryTable = new Table({
    head: ['Metric', 'Value'],
    colWidths: [30, 40]
  });

  const fixtures = combined.fixtures || {};
  const totalFixtures = Object.values(fixtures).reduce((a, b) => a + b, 0);

  summaryTable.push(
    ['Total Fixtures', totalFixtures],
    ['Estimated Pipe (ft)', combined.pipeRuns?.combined?.estimatedFeet || combined.pipeRuns?.fromDimensions?.estimatedPipeFeet || 0],
    ['Material Cost', `$${(combined.totals?.material || 0).toLocaleString()}`],
    ['Total Estimate', `$${(combined.totals?.total || 0).toLocaleString()}`],
    ['Confidence', `${combined.confidence || 0}%`],
    ['Sources Used', (combined.sources || []).join(', ')]
  );

  console.log(summaryTable.toString());

  // Fixtures table
  if (Object.keys(fixtures).length > 0) {
    console.log(chalk.blue('\n🔧 Fixtures:'));
    const fixtureTable = new Table({
      head: ['Type', 'Count'],
      colWidths: [30, 20]
    });

    Object.entries(fixtures)
      .filter(([_, value]) => value > 0)
      .forEach(([key, value]) => {
        fixtureTable.push([key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), value]);
      });

    console.log(fixtureTable.toString());
  }

  // Materials table (top 10)
  const materials = combined.materials || [];
  if (materials.length > 0) {
    console.log(chalk.blue('\n📦 Top Materials:'));
    const matTable = new Table({
      head: ['Item', 'Qty', 'Unit', 'Cost'],
      colWidths: [35, 8, 8, 12]
    });

    materials.slice(0, 10).forEach(item => {
      matTable.push([
        item.item.substring(0, 35),
        item.qty || item.quantity || 0,
        item.unit || 'EA',
        `$${(item.cost || item.unitCost || 0).toFixed(2)}`
      ]);
    });

    console.log(matTable.toString());

    if (materials.length > 10) {
      console.log(chalk.gray(`  ... and ${materials.length - 10} more items`));
    }
  }
}

program.parse();
