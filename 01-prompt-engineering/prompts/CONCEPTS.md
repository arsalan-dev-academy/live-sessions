# Prompt Engineering: Best Practices

Techniques for getting better results out of an LLM when using it to read,
reason about, and debug code. Some of the techniques below are used against
the bugs in `src/discount.py`. See `FIXES.md`.
## Zero-shot prompting

Ask the model to do the task directly, with no examples — just a clear
instruction. Works well when the task is common enough that the model
already "knows" the pattern (e.g. "find the bug in this function").

Best for: quick first pass, simple/well-known bug classes.

## Few-shot prompting

Give the model a small number of input/output examples before the real
task, so it can infer the pattern you want rather than guessing at your
intent. Especially useful when:
- the desired output format is unusual (e.g. a specific bug-report template)
- the task is ambiguous in the abstract but clear from examples
- you want to bias the model toward the *kind* of bug you're looking for

Best for: steering output format, narrowing the search space, teaching the
model your team's conventions.

## Chain-of-thought (CoT) prompting

Ask the model to reason step by step *before* giving a final answer,
instead of jumping straight to a conclusion. For debugging, this means
tracing execution with concrete values rather than pattern-matching on
what "looks" buggy.

Best for: boundary conditions, off-by-one errors, anything where the bug
only shows up for specific inputs and reading the code alone isn't enough
— you have to *run it in your head*.

## Role / persona prompting

Frame the model as a specific kind of reviewer (e.g. "a senior engineer
doing a security-focused code review" or "a QA engineer looking for edge
cases"). This shifts what the model pays attention to without changing the
underlying task.

Best for: directing attention toward a specific category of bug (security,
edge cases, performance) when you don't want a generic review.

## Task decomposition

Break "find and fix the bug" into smaller, separately-prompted steps:
1. Understand the intended behavior (read the spec/docstring/tests)
2. Reproduce the discrepancy (run it, compare actual vs expected)
3. Localize the root cause
4. Propose a fix
5. Verify the fix against tests

Best for: multi-bug or multi-file problems, where solving everything in
one shot leads to the model fixating on the first thing it notices.

## Providing constraints and context

State what must *not* change alongside what should. E.g. "fix the bug
without changing the function signature" or "the fix must not affect the
other passing tests." Constraints prevent the model from taking a
technically-working but overly broad shortcut.

Best for: keeping fixes minimal and scoped, avoiding unwanted refactors.

## Self-consistency / asking the model to check its own work

After getting an answer, ask the model to re-verify it against the test
suite or against specific inputs before accepting it. Cheap to do, catches
cases where the first answer was plausible-sounding but wrong.

Best for: any fix you're about to trust — especially cap/threshold logic
where "looks right" and "is right" often diverge.

## Prompt chaining

Feed the output of one prompt in as input to the next, instead of asking
for everything in a single shot. E.g. "list the bugs" as prompt one, then
a separate "fix bug #2" prompt using that list.

Best for: multi-stage workflows where each stage benefits from a clean,
focused context rather than one long prompt trying to do it all.

## ReAct (reason + act)

Interleave reasoning steps with tool calls and their observations — reason,
run the test, observe the failure, reason again — rather than reasoning
entirely up front before taking any action.

Best for: debugging loops where the next reasoning step depends on real
output (a test result, a stack trace) you don't have yet.

## Least-to-most prompting

Solve a simpler sub-problem first, then use that result to tackle the
harder one, instead of attempting the full problem directly.

Best for: building confidence in a small piece of logic (one tier
boundary) before reasoning about the whole system (the full tier table
plus stacking plus cap).

## Tree-of-thought / branching exploration

Have the model consider multiple candidate root causes in parallel and
weigh them, instead of committing to the first plausible explanation it
finds.

Best for: bugs with more than one plausible cause, where jumping on the
first lead risks missing the actual one.

## Negative examples / counter-examples

Show an example of a *wrong* fix alongside the right one, so the model
knows what to avoid, not just what to do.

Best for: steering away from a specific bad pattern you've seen before
(e.g. "don't just widen the guard clause to catch every case — that's
what caused the last regression").

## Structured output via delimiters

Ask for output in a fixed, parseable format (XML tags, JSON) rather than
free-form prose.

Best for: when the model's answer needs to feed into another step or tool
automatically, not just be read by a human.

## Meta-prompting

Ask the model to critique or improve the prompt itself before answering
it, rather than answering directly.

Best for: when a prompt isn't getting good results and you're not sure
why — let the model diagnose the prompt, not just the code.
