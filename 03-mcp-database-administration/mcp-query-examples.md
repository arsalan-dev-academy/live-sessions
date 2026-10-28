# Querying Chinook with MCP and Natural Language

This guide shows example prompts you can use to query the Chinook database through MCP tools.

The goal is not to memorize SQL. Instead, you describe what you want in plain language and let MCP inspect the schema, generate SQL, and return results.

## How to Use These Examples

Use prompts like these in your AI chat after:

- your Supabase MCP server is connected
- the Chinook dataset has been loaded
- the assistant can access MCP database tools

Good prompt pattern:

- state the business question
- name the output shape you want
- ask MCP to explain the SQL if you want to learn from it

Example:

"Using MCP tools, query the Chinook database and show the top 5 customers by total spending. Include customer name, country, and total spent. Also explain the SQL you used."

## Example 1: Inspect the Schema First

Prompt:

"Using MCP tools, list the tables in the Chinook public schema and identify the most important relationships for sales reporting."

Why this is useful:

- confirms MCP is connected correctly
- helps you see which tables matter before asking more complex questions
- reduces the chance of asking for the wrong join

Likely tables involved:

- artist
- album
- track
- customer
- invoice
- invoice_line
- employee
- genre

## Example 2: Top Customers by Revenue

Prompt:

"Using MCP tools, find the top 10 customers in Chinook by total invoice amount. Return first name, last name, country, and total spent, ordered highest to lowest."

What MCP will likely use:

- `customer`
- `invoice`

SQL shape MCP may generate:

```sql
select
    c.first_name,
    c.last_name,
    c.country,
    sum(i.total) as total_spent
from customer c
join invoice i on i.customer_id = c.customer_id
group by c.customer_id, c.first_name, c.last_name, c.country
order by total_spent desc
limit 10;
```

Good follow-up prompt:

"Break that down by year as well."

## Example 3: Best-Selling Artists

Prompt:

"Using MCP tools, show the top 10 artists by sales revenue in Chinook. Include artist name, total revenue, and total tracks sold."

What MCP will likely use:

- `artist`
- `album`
- `track`
- `invoice_line`

Why this is useful:

- demonstrates a multi-table join across the catalog and sales tables
- shows how natural language can express an analytics question without writing SQL directly

## Example 4: Sales by Country

Prompt:

"Using MCP tools, summarize Chinook sales by billing country. Return country, number of invoices, and total revenue, sorted by revenue descending."

What MCP will likely use:

- `invoice`

Possible SQL shape:

```sql
select
    billing_country,
    count(*) as invoice_count,
    sum(total) as total_revenue
from invoice
group by billing_country
order by total_revenue desc;
```

Good follow-up prompt:

"Show only countries with more than 5 invoices."

## Example 5: Customers Assigned to Each Support Rep

Prompt:

"Using MCP tools, list each employee who supports customers in Chinook, along with the number of customers assigned to them. Sort by customer count descending."

What MCP will likely use:

- `employee`
- `customer`

Why this is useful:

- helps you inspect operational relationships in the dataset
- is a good example of a grouped reporting query

## Example 6: Tracks in a Given Genre

Prompt:

"Using MCP tools, list 15 Rock tracks from Chinook with track name, artist name, album title, and unit price."

What MCP will likely use:

- `track`
- `genre`
- `album`
- `artist`

Good follow-up prompt:

"Now do the same for Jazz and compare average track price by genre."

## Example 7: Monthly Revenue Trend

Prompt:

"Using MCP tools, calculate monthly revenue for Chinook using invoice date. Return year-month and total revenue in chronological order."

What MCP will likely use:

- `invoice`

SQL shape MCP may generate:

```sql
select
    to_char(invoice_date, 'YYYY-MM') as year_month,
    sum(total) as total_revenue
from invoice
group by to_char(invoice_date, 'YYYY-MM')
order by year_month;
```

Why this is useful:

- shows that date grouping can be described in plain language
- is a practical pattern for dashboards and trend analysis

## Example 8: Ask MCP to Explain the Query

Prompt:

"Using MCP tools, find the top 5 genres by revenue in Chinook, then explain the generated SQL step by step in plain English."

This is useful when you want both:

- the answer
- a short lesson on how the SQL works

## Example 9: Safe Filtering and Limits

Prompt:

"Using MCP tools, show 20 invoices from customers in Brazil, including customer name, invoice date, and total, ordered by newest first."

Why this is a good prompt:

- it scopes the request clearly
- it asks for a limit
- it names the fields you want returned

This usually produces better results than a vague prompt like:

"Show me Brazilian sales."

## Example 10: Compare Two Groups

Prompt:

"Using MCP tools, compare average invoice totals for customers in the USA versus Canada in Chinook. Return country, customer count, invoice count, and average invoice total."

Why this is useful:

- shows that MCP can handle grouped comparisons
- encourages more analytical prompts instead of simple row lookups

## Prompt Writing Tips

When prompting MCP, include as many of these as needed:

- the dataset name: Chinook
- the tool behavior: use MCP tools
- the tables or entities if you know them
- the columns you want returned
- sort order
- row limit
- whether you want the SQL explained

Stronger prompt:

"Using MCP tools, query Chinook for the top 5 customers by revenue. Return full name, country, invoice count, and total spent. Sort by total spent descending and explain the SQL."

Weaker prompt:

"Who are the best customers?"

## Recommended Workflow

1. Start with a schema or table discovery prompt.
2. Ask a narrow business question.
3. Review the MCP-generated SQL.
4. Refine with filters, grouping, or date ranges.
5. Ask MCP to explain the query if the result is surprising.

## One Good Starter Prompt

If you want one prompt to begin with, use this:

"Using MCP tools, inspect the Chinook schema and then show me the top 5 customers by total spending, including the SQL and a short explanation of how the joins work."