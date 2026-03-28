---
name: property-based-testing
description: "Property-based testing (PBT): generate hundreds of inputs automatically to verify mathematical properties of code. Use when user mentions property testing, QuickCheck, Hypothesis, Shrinking, invariant testing, generative testing, or when unit test coverage feels insufficient. Covers Haskell/QuickCheck, Python/Hypothesis, JavaScript/JSVerify/Fast-Check, and Go/testing."
---

# Property-Based Testing — Test Once, Verify Against Thousands

## Core Concept

Instead of writing specific test cases, you write **properties** — statements about what your code MUST do for ALL inputs:

```
Unit test:  "sort([3,1,2]) == [1,2,3]"         → 1 case
Property:   "sorted(xs) == sorted(sorted(xs))"  → thousands of cases
```

The testing library **generates** random inputs, runs the property, and **shrinks** failures to minimal counterexamples.

## The Three Phases of PBT

```
1. GENERATE  → library produces random inputs from domain
2. RUN       → property function evaluated for each input
3. SHRINK    → on failure, reduce input to smallest counterexample
```

## Shrinking — Why It Matters

Shrink failure: `[3, 9, 7, 1, 8, 2, 5]` → `[]` (empty list triggers the bug)
Shrinking transforms massive inputs into minimal, readable bugs.

## When PBT Beats Unit Testing

| Scenario | Why PBT wins |
|----------|-------------|
| Boundary conditions | Hard to enumerate: negatives, zero, max_int, Unicode |
| Commutativity/associativity | Test `f(a,b) == f(b,a)` for thousands of pairs |
| Round-trip serialization | Encode→Decode→Decode == Encode |
| Invariant preservation | "sorting never loses elements" |
| Protocol/state machines | Exhaustively explore state transitions |
| Async race conditions | Generate interleavings |

## Language Tooling

| Language | Library | Best For |
|----------|---------|---------|
| Haskell | QuickCheck | The original, pure FP |
| Python | Hypothesis | Django, Flask, data pipelines |
| JavaScript | Fast-Check | Node.js, TypeScript |
| Go | testing/quick | Standard library, simple cases |
| Rust | proptest | Rust idiomatic PBT |
| Java | JUnit-QuickFIX | Legacy Java systems |

---

## Python + Hypothesis

### Setup
```bash
pip install hypothesis pytest
```

### Basic Pattern
```python
from hypothesis import given, strategies as st, assume, settings

@given(st.lists(st.integers(min_value=1, max_value=1000), min_size=1))
def test_sort_preserves_elements(xs):
    """Sorting never loses or duplicates elements."""
    sorted_xs = sorted(xs)
    assert len(sorted_xs) == len(xs)
    assert set(sorted_xs) == set(xs)          # preservation
    assert sorted_xs == sorted(sorted_xs)      # idempotence

@given(st.lists(st.integers()), st.lists(st.integers()))
def test_merge_preserves_all(a, b):
    """Merging two lists preserves all elements."""
    merged = sorted(a + b)
    expected = sorted(sorted(a) + sorted(b))
    assert merged == expected
```

### Composite Strategies (Realistic Data)
```python
# Realistic API-like data
@st.composite
def api_response(draw):
    status = draw(st.sampled_from([200, 201, 400, 404, 500]))
    body = draw(st.dictionaries(
        st.text(min_size=1),
        st.one_of(st.none(), st.text(), st.integers())
    ))
    return {"status": status, "body": body, "timestamp": draw(st.floats(min_value=0))}

@given(api_response())
def test_api_response_roundtrip(response):
    """API response JSON serialize/deserialize preserves structure."""
    import json
    serialized = json.dumps(response)
    deserialized = json.loads(serialized)
    assert deserialized == response
```

### Settings for Real Projects
```python
from hypothesis import Phase, settings

@settings(
    max_examples=500,          # more examples = higher confidence
    deadline=2000,             # 2s per example (fail fast on slow code)
    phases=[Phase.generate, Phase.shrink],  # shrink failures
    database=ExampleDatabase(".hypothesis/examples"),  # save known failures
    print_blob=True,           # print counterexamples
)
@given(st.integers())
def test_divide_by_zero_safe(x):
    result = safe_divide(10, x)
    if x == 0:
        assert result is None or result == float('inf')
    else:
        assert result == 10 / x
```

### Stateful Testing (Advanced)
```python
from hypothesis.stateful import Rule, rule, invariant

class StackModel:
    def __init__(self):
        self.items = []

    def push(self, x):
        self.items.append(x)

    def pop(self):
        if self.items:
            return self.items.pop()
        raise IndexError("pop from empty")

class Stack harness(StatedFile:
    def __init__(self):
        self.target = StackModel()

    @rule(x=st.integers())
    def push(self, x):
        self.target.push(x)
        assert len(self.target.items) == len(self.items) + 1
        self.items.append(x)

    @rule()
    def pop(self):
        if self.target.items:
            result = self.target.pop()
            assert result == self.items.pop()
        else:
            with selfRaises(IndexError):
                self.target.pop()

TestStack.harness().run_test(n=500)
```

---

## Go + testing/quick

### Basic Pattern
```go
func TestReversePreservesLength(t *testing.T) {
    f := func(xs []int) bool {
        reversed := reverse(reverse(xs))
        return len(reversed) == len(xs)
    }
    if err := quick.Check(f, nil); err != nil {
        t.Error(err)
    }
}

func reverse(xs []int) []int {
    result := make([]int, len(xs))
    copy(result, xs)
    for i, j := 0, len(result)-1; i < j; i, j = i+1, j-1 {
        result[i], result[j] = result[j], result[i]
    }
    return result
}
```

### With Custom Generator
```go
// Generate non-empty slices of ints
func intSlice(ok func([]int) bool) *testing.T {
    f := func(pair struct{ N, V int }) bool {
        if pair.N <= 0 {
            return true
        }
        xs := make([]int, pair.N%100)  // cap at 100
        for i := range xs {
            xs[i] = pair.V % (2*pair.N + 1)
        }
        return ok(xs)
    }
    testing.QuickCheck(f)
}
```

---

## JavaScript + Fast-Check

```bash
npm install fast-check
```

```javascript
import fc from 'fast-check';

// Core property: sort preserves length and elements
test('sort preserves elements', () => {
  fc.assert(
    fc.property(fc.array(fc.integer()), (xs) => {
      const sorted = [...xs].sort((a, b) => a - b);
      return sorted.length === xs.length
          && sorted.every(v => xs.includes(v));
    }),
    { numRuns: 1000 }
  );
});

// Realistic input: HTTP request shapes
test('request validator accepts valid shapes', () => {
  fc.assert(
    fc.property(
      fc.record({
        method: fc.oneof(
          fc.constant('GET'), fc.constant('POST'),
          fc.constant('PUT'), fc.constant('DELETE')
        ),
        path: fc.string({ minLength: 1, maxLength: 200 }),
        headers: fc.dictionary(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 0, maxLength: 500 })
        ),
        body: fc.oneof(
          fc.constant(null),
          fc.record({ id: fc.integer(), data: fc.json() }),
        ),
      }),
      (req) => {
        const errors = validateRequest(req);
        return errors.length === 0; // should have no errors
      }
    ),
    { numRuns: 500 }
  );
});
```

---

## Identifying Good Properties

### 1. Invariants (Never Change)
```
✓ "sum(xs) + sum(ys) == sum(xs ++ ys)"
✓ "len(sorted(xs)) == len(xs)"
✓ "all even numbers remain even after transform(x)"
```

### 2. Equivalences (Two Paths, Same Result)
```
✓ "parse(serialize(obj)) == obj"
✓ "hash(original) == hash(deserialized)"
✓ "f(a,b) == f(b,a)"  (commutativity)
```

### 3. Idempotence (Applying Twice == Applying Once)
```
✓ "unique(unique(xs)) == unique(xs)"
✓ "sort(sort(xs)) == sort(xs)"
✓ "normalize(normalize(x)) == normalize(x)"
```

### 4. Monotonicity / Directionality
```
✓ "if x > y then f(x) > f(y)"  (monotone increasing)
✓ "if x >= 0 then sqrt(x) >= 0"
```

### 5. Round-trip (Encode → Decode)
```
✓ "JSON.parse(JSON.stringify(obj)) == obj"
✓ "base64_decode(base64_encode(bytes)) == bytes"
✓ "gzip_decompress(gzip_compress(data)) == data"
```

---

## Anti-Patterns (AVOID)

❌ **Property too close to implementation**
```python
# This just tests that sort() calls sorted() — useless
@given(st.lists(st.integers()))
def test_bad_implementation_tested(xs):
    assert my_sort(xs) == sorted(xs)  # copies builtin
```

❌ **Property with no falsifiable claim**
```python
# "sometimes works" is not a property
@given(st.lists(st.integers()))
def test_wrong(xs):
    assert my_sort(xs) is not None  # always passes
```

❌ **No shrink target — unshrunkable failure**
```python
# Custom class without known shrinker = messy failure output
@given(st.integers())
def test_bad(x):
    assert MyClass(x).value == x  # MyClass has no shrink strategy
```

✅ **Always pair with classic unit tests for edge cases** — PBT handles the long tail, unit tests handle the critical known cases.

---

## Integration with CI/CD

```yaml
# .github/workflows/pbt.yml
- name: Property-Based Tests
  run: |
    pytest \
      --hypothesis-show-statistics \
      --hypothesis-seed="${{ github.run_id }}" \
      tests/properties/ \
      -v
```

Key flags:
- `--hypothesis-show-statistics` — see distribution of generated inputs
- `--hypothesis-seed=X` — reproducible runs from a seed
- `--hypothesis-database` — persist failing examples across runs

---

## Counterexample → Minimal Test Case Workflow

When Hypothesis finds a failure:
1. Copy the **minimal shrunk** example from the output
2. Create a **regression unit test** with the counterexample
3. Add it to your test suite so it never regresses

```python
# Regression test created from counterexample
def test_regression_edge_case_387():
    """Regression: empty list with max_value=0 caused crash"""
    assert safe_divide(10, 0) == float('inf')  # or appropriate behavior

@given(st.lists(st.integers(max_value=0)))
def test_empty_edge_case(xs):
    """Counterexample from failed property run"""
    result = process(xs)
    assert result is not None  # or whatever invariant held
```

---

*Last updated: 2026-03-28*
