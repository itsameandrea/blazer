# Wezer

This file provides guidance to AI coding agents working with this repository.

## What is Wezer?

Wezer is Wellio's official fork of the Blazer gem. It is a SQL analytics engine used to power internal product and customer success workflows.

Current direction:
- PostgreSQL-first for now
- Keep adapter boundaries clean so additional databases can be added later
- Modern Rails defaults (engine compatibility with import maps and Tailwind CSS)
- AI-native workflows powered by `ruby_llm`
- MCP surface so external AI providers can discover and use Wezer tools

## Development Commands

### Setup
```bash
bundle install
```

### Testing
```bash
bundle exec rake test

# adapter-specific suites
bundle exec rake test:postgresql
bundle exec rake test:sqlite
bundle exec rake test:mysql

# matrix compatibility runs
BUNDLE_GEMFILE=gemfiles/rails80.gemfile bundle exec rake test
BUNDLE_GEMFILE=gemfiles/rails72.gemfile bundle exec rake test
BUNDLE_GEMFILE=gemfiles/rails71.gemfile bundle exec rake test
```

### Release / Packaging
```bash
bundle exec rake build
```

## Architecture Overview

### Rails Engine Boundary

Wezer is a mountable Rails engine and should remain engine-safe:
- Namespace isolation is configured in `lib/blazer/engine.rb`
- Routes are defined in `config/routes.rb`
- Main UI entrypoint is `app/controllers/blazer/queries_controller.rb#home`
- Keep host app integration minimal and explicit

### Query Lifecycle

Core query flow:
1. `Blazer::Query` stores SQL and metadata
2. `Blazer::Statement` parses variables and binds values
3. `Blazer::RunStatement` executes through a `Blazer::DataSource`
4. Adapter returns rows/columns/errors as `Blazer::Result`
5. `Blazer::Audit` records execution history

Primary files:
- `app/models/blazer/query.rb`
- `lib/blazer/statement.rb`
- `lib/blazer/run_statement.rb`
- `lib/blazer/data_source.rb`
- `lib/blazer/result.rb`
- `app/models/blazer/audit.rb`

### Adapter System (Postgres-first, Extensible)

Current Blazer codebase has many adapters, but Wezer should prioritize PostgreSQL behavior while preserving extension seams.

Adapter surface:
- Base interface: `lib/blazer/adapters/base_adapter.rb`
- SQL implementation: `lib/blazer/adapters/sql_adapter.rb`
- Adapter registry: `lib/blazer/adapters.rb`

Guidelines:
- Do not collapse adapter abstractions even when implementing Postgres-only behavior
- Prefer adding explicit PostgreSQL constraints over deleting extension points prematurely
- Keep SQL execution read-focused and safe by default

### Frontend & Assets Modernization

Current Blazer frontend includes legacy Sprockets assets and vendor JS. Wezer should move toward Rails modern defaults while maintaining incremental compatibility.

Current entrypoints:
- Layout: `app/views/layouts/blazer/application.html.erb`
- JS bundle entry: `app/assets/javascripts/blazer/application.js`
- CSS entry: `app/assets/stylesheets/blazer/application.css`

Modernization goals:
- Support import maps in host applications
- Support Tailwind-based styling patterns
- Reduce reliance on legacy jQuery plugin chains over time

### AI-Native Product Requirements

Minimum AI scope for Wezer:
- Prompt-assisted generation of new SQL queries
- Prompt-assisted semantic search for existing queries
- MCP server/tools to expose Wezer schema/query capabilities to external providers

Implementation direction:
- Integrate with `ruby_llm` for prompt execution and model abstraction
- Keep AI prompts and orchestration explicit and testable
- Keep query execution safety checks in the SQL layer, not only in prompt text

## Near-Term Product Priorities

1. Stabilize PostgreSQL-first behavior and tests
2. Modernize engine integration for import maps and Tailwind compatibility
3. Add AI query-generation and query-search paths with `ruby_llm`
4. Add MCP tool surface for external AI systems

## Guardrails for Agents

- Preserve backward-compatible extension seams unless explicitly asked to break them
- Make focused, minimal changes per PR
- Follow established file/module boundaries before introducing new abstractions
- Prefer explicit, readable Rails code over framework-heavy indirection
- Keep security posture conservative for query execution features

## Coding Style

Follow project style guidance in:

`STYLE.md`
