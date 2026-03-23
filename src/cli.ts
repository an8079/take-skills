#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { version } from '../package.json' assert { type: 'json' };

const program = new Command();

program
  .name('claude-studio')
  .alias('cs')
  .description('Advanced Claude Code development assistant')
  .version(version);

program
  .command('interview')
  .description('Start deep interview for requirements')
  .action(() => {
    console.log(chalk.blue('Starting interview mode...'));
  });

program
  .command('plan')
  .description('Create project plan')
  .action(() => {
    console.log(chalk.blue('Planning...'));
  });

program
  .command('code')
  .description('Generate code implementation')
  .action(() => {
    console.log(chalk.blue('Coding...'));
  });

program
  .command('test')
  .description('Run tests')
  .action(() => {
    console.log(chalk.blue('Testing...'));
  });

program
  .command('review')
  .description('Review code')
  .action(() => {
    console.log(chalk.blue('Reviewing...'));
  });

program.parse(process.argv);
