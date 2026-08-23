// generate-curriculum-packs.js
// One-time script to generate all 72 curriculum data packs
// Run: node generate-curriculum-packs.js

const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, 'data', 'curriculum');

// ═══════════════════════════════════════════════════════════════════
// MATH CURRICULUM DATA — All grades, all curricula
// ═══════════════════════════════════════════════════════════════════

const MATH = {
  // ── GRADE 9 ──
  9: {
    american: {
      meta: { curriculumName: "US Algebra I / Geometry (Common Core)", language: "en" },
      units: [
        {
          title: "Linear Equations and Inequalities",
          topics: [
            { title: "Solving multi-step equations", concepts: ["distributive property", "combining like terms", "variables on both sides"], keyFormulas: ["ax + b = c → x = (c-b)/a"], keyFacts: ["Always check solution by substituting back", "No solution when you get a contradiction like 5 = 3", "Infinite solutions when you get an identity like 0 = 0"] },
            { title: "Systems of Linear Equations", concepts: ["substitution", "elimination", "graphing method"], keyFormulas: ["y = mx + b", "Ax + By = C (standard form)"], keyFacts: ["Parallel lines: no solution", "Same line: infinite solutions", "Intersecting: exactly one solution"] },
            { title: "Linear Inequalities", concepts: ["inequality symbols", "graphing on number line", "compound inequalities"], keyFacts: ["Flip the inequality sign when multiplying or dividing by a negative", "AND inequalities: intersection", "OR inequalities: union"] }
          ],
          commonMisconceptions: ["Forgetting to flip inequality when dividing by negative", "Distributing without changing all signs"]
        },
        {
          title: "Exponents and Polynomials",
          topics: [
            { title: "Laws of Exponents", concepts: ["product rule", "quotient rule", "power rule", "zero exponent", "negative exponent"], keyFormulas: ["aᵐ·aⁿ = aᵐ⁺ⁿ", "(aᵐ)ⁿ = aᵐⁿ", "a⁰ = 1", "a⁻ⁿ = 1/aⁿ"] },
            { title: "Polynomial Operations", concepts: ["degree", "leading coefficient", "FOIL", "special products"], keyFormulas: ["(a+b)² = a²+2ab+b²", "(a-b)² = a²-2ab+b²", "(a+b)(a-b) = a²-b²"] },
            { title: "Factoring", concepts: ["GCF", "trinomial factoring", "difference of squares", "grouping"], keyFacts: ["Always factor out GCF first", "a²-b² = (a+b)(a-b)", "Perfect square trinomial: a²±2ab+b² = (a±b)²"] }
          ]
        },
        {
          title: "Quadratic Functions",
          topics: [
            { title: "Graphing Parabolas", concepts: ["vertex", "axis of symmetry", "direction of opening", "intercepts"], keyFormulas: ["y = ax²+bx+c", "vertex: (-b/2a, f(-b/2a))", "y = a(x-h)²+k"], keyFacts: ["a > 0: opens up (minimum)", "a < 0: opens down (maximum)"] },
            { title: "Solving Quadratics", concepts: ["factoring", "quadratic formula", "completing the square"], keyFormulas: ["x = (-b ± √(b²-4ac)) / 2a", "Discriminant Δ = b²-4ac"] }
          ]
        },
        {
          title: "Introduction to Geometry",
          topics: [
            { title: "Pythagorean Theorem", concepts: ["right triangles", "hypotenuse", "legs", "Pythagorean triples"], keyFormulas: ["a² + b² = c²"], keyFacts: ["Common triples: (3,4,5), (5,12,13), (8,15,17)"] },
            { title: "Coordinate Geometry", concepts: ["distance formula", "midpoint formula", "slope"], keyFormulas: ["d = √((x₂-x₁)²+(y₂-y₁)²)", "M = ((x₁+x₂)/2, (y₁+y₂)/2)", "m = (y₂-y₁)/(x₂-x₁)"] }
          ]
        }
      ],
      examFormat: { papers: ["Unit Tests", "Semester Exam (cumulative)"], commandWords: ["solve", "simplify", "graph", "factor", "evaluate"], tips: ["Show all work for full credit", "Always check for extraneous solutions"] }
    },
    uk: {
      meta: { curriculumName: "UK GCSE Mathematics (Year 10 — Foundation/Higher)", language: "en" },
      units: [
        {
          title: "Algebra",
          topics: [
            { title: "Quadratic Equations", concepts: ["factorising", "quadratic formula", "completing the square"], keyFormulas: ["x = (-b±√(b²-4ac))/2a"], keyFacts: ["Higher tier: completing the square and discriminant", "Foundation: factorising and formula"] },
            { title: "Simultaneous Equations", concepts: ["elimination", "substitution", "linear-quadratic pairs"], keyFacts: ["Linear-quadratic: substitute linear into quadratic, solve resulting quadratic"] },
            { title: "Inequalities", concepts: ["solving", "graphing", "set notation"], keyFacts: ["Use open circle for < >, closed circle for ≤ ≥", "Shade the region that satisfies all inequalities"] }
          ]
        },
        {
          title: "Ratio, Proportion and Rates of Change",
          topics: [
            { title: "Direct and Inverse Proportion", concepts: ["y ∝ x", "y ∝ 1/x", "constant of proportionality"], keyFormulas: ["y = kx (direct)", "y = k/x (inverse)"], keyFacts: ["Direct: as x doubles, y doubles", "Inverse: as x doubles, y halves"] },
            { title: "Compound Measures", concepts: ["speed", "density", "pressure"], keyFormulas: ["speed = distance/time", "density = mass/volume", "pressure = force/area"] }
          ]
        },
        {
          title: "Geometry and Measures",
          topics: [
            { title: "Trigonometry (SOHCAHTOA)", concepts: ["sine", "cosine", "tangent", "finding angles and sides"], keyFormulas: ["sinθ = O/H", "cosθ = A/H", "tanθ = O/A"] },
            { title: "Pythagoras' Theorem", concepts: ["hypotenuse", "2D and 3D problems"], keyFormulas: ["a²+b²=c²"] },
            { title: "Circle Theorems (Higher)", concepts: ["angle at centre", "angle in semicircle", "cyclic quadrilateral", "tangent"], keyFacts: ["Angle at centre = 2× angle at circumference", "Angle in semicircle = 90°", "Opposite angles in cyclic quad sum to 180°"] }
          ]
        },
        {
          title: "Probability and Statistics",
          topics: [
            { title: "Probability", concepts: ["tree diagrams", "Venn diagrams", "relative frequency", "conditional probability"], keyFormulas: ["P(A or B) = P(A)+P(B)-P(A and B)", "P(A') = 1-P(A)"] },
            { title: "Statistics", concepts: ["mean", "median", "mode", "range", "IQR", "box plots", "cumulative frequency"], keyFacts: ["Median from grouped data: use cumulative frequency graph", "Mean from grouped data: use midpoints"] }
          ]
        }
      ],
      examFormat: { papers: ["Paper 1 (non-calculator, 1h30)", "Paper 2 (calculator, 1h30)", "Paper 3 (calculator, 1h30)"], commandWords: ["work out", "show that", "explain", "prove", "give reasons"], tips: ["'Show that' requires full working to the given answer", "'Give reasons' means cite the theorem name"] }
    },
    german: {
      meta: { curriculumName: "Gymnasium Klasse 9 — Mathematik", language: "de" },
      units: [
        {
          title: "Quadratische Funktionen und Gleichungen",
          topics: [
            { title: "Normalparabel und Verschiebung", concepts: ["Scheitelform", "Normalform", "Nullstellen", "Scheitelpunkt"], keyFormulas: ["f(x) = a(x-d)²+e (Scheitelform)", "f(x) = ax²+bx+c (Normalform)", "S(d|e) = (-b/2a | -Δ/4a)"], keyFacts: ["a > 0: nach oben geöffnet", "a < 0: nach unten geöffnet", "Nullstellen: Lösungen von f(x)=0"] },
            { title: "Quadratische Gleichungen lösen", concepts: ["p-q-Formel", "Diskriminante", "Faktorisierung"], keyFormulas: ["x² + px + q = 0 → x₁,₂ = -p/2 ± √((p/2)²-q)", "Δ = (p/2)²-q"] }
          ],
          commonMisconceptions: ["Vorzeichenfehler bei der p-q-Formel", "Verwechslung von Scheitelform und Normalform"]
        },
        {
          title: "Ähnlichkeit und Strahlensätze",
          topics: [
            { title: "Strahlensätze", concepts: ["Erster Strahlensatz", "Zweiter Strahlensatz", "Ähnlichkeit"], keyFormulas: ["a/a' = b/b' (1. Strahlensatz)", "a/b = a'/b' (2. Strahlensatz)"], keyFacts: ["Strahlensätze gelten nur bei parallelen Geraden", "Ähnliche Dreiecke: gleiche Winkel, proportionale Seiten"] },
            { title: "Zentrische Streckung", concepts: ["Streckzentrum", "Streckfaktor k", "Vergrößerung und Verkleinerung"], keyFacts: ["|k| > 1: Vergrößerung", "|k| < 1: Verkleinerung", "k < 0: Punktspiegelung + Streckung"] }
          ]
        },
        {
          title: "Potenzen und Wurzeln",
          topics: [
            { title: "Potenzgesetze", concepts: ["Basis", "Exponent", "negative Exponenten", "rationale Exponenten"], keyFormulas: ["aⁿ·aᵐ = aⁿ⁺ᵐ", "aⁿ/aᵐ = aⁿ⁻ᵐ", "(aⁿ)ᵐ = aⁿᵐ", "a^(1/n) = ⁿ√a"] },
            { title: "Wurzelrechnung", concepts: ["Quadratwurzel", "Kubikwurzel", "Rationalmachen des Nenners"], keyFormulas: ["√(a·b) = √a·√b", "√(a/b) = √a/√b"], keyFacts: ["√(a+b) ≠ √a + √b !!!"] }
          ]
        },
        {
          title: "Wahrscheinlichkeitsrechnung",
          topics: [
            { title: "Mehrstufige Zufallsexperimente", concepts: ["Baumdiagramm", "Pfadregel", "Pfadadditionsregel", "Gegenwahrscheinlichkeit"], keyFormulas: ["P(Pfad) = Produkt der Einzelwahrscheinlichkeiten", "P(A̅) = 1 - P(A)"], keyFacts: ["Pfadmultiplikationsregel: entlang eines Pfades multiplizieren", "Pfadadditionsregel: verschiedene Pfade addieren"] }
          ]
        }
      ],
      examFormat: { papers: ["Schulaufgabe (45 min)", "Stegreifaufgabe (20 min)", "Jahresabschlusstest"], commandWords: ["berechne", "bestimme", "zeige", "begründe", "skizziere"], tips: ["Immer die Formel zuerst aufschreiben", "Einheiten nicht vergessen"] }
    },
    greek: {
      meta: { curriculumName: "Ελληνικό Λύκειο Α' Τάξη — Μαθηματικά", language: "el" },
      units: [
        {
          title: "Equations and Inequalities",
          topics: [
            { title: "Quadratic Equations", concepts: ["discriminant", "Vieta's formulas", "factoring"], keyFormulas: ["ax²+bx+c=0", "x = (-b±√Δ)/2a", "Δ=b²-4ac", "x₁+x₂=-b/a", "x₁·x₂=c/a"], keyFacts: ["Greek curriculum emphasizes Vieta's relations heavily", "Sign analysis of quadratic trinomial required"] },
            { title: "Quadratic Inequalities", concepts: ["sign table", "solution intervals", "parabola sign"], keyFacts: ["For ax²+bx+c > 0: find roots, determine sign between/outside roots", "If Δ < 0 and a > 0: expression always positive"] }
          ]
        },
        {
          title: "Functions",
          topics: [
            { title: "Real Functions", concepts: ["domain", "range", "monotonicity", "parity"], keyFacts: ["Even function: f(-x) = f(x), symmetric about y-axis", "Odd function: f(-x) = -f(x), symmetric about origin", "Monotonicity proven via f(x₁)-f(x₂) sign analysis"] },
            { title: "Quadratic Function", concepts: ["vertex", "axis of symmetry", "maximum/minimum"], keyFormulas: ["f(x) = ax²+bx+c", "Vertex: (-b/2a, -Δ/4a)"] }
          ]
        },
        {
          title: "Trigonometry",
          topics: [
            { title: "Trigonometric Ratios and Identities", concepts: ["unit circle", "reference angle", "fundamental identity"], keyFormulas: ["sin²θ+cos²θ=1", "tanθ=sinθ/cosθ", "1+tan²θ=1/cos²θ"], keyFacts: ["Greek curriculum covers all four quadrants in Year 1", "Sign rules: All Students Take Calculus (ASTC)"] }
          ]
        }
      ],
      examFormat: { papers: ["Γραπτή εξέταση (3 ώρες)"], commandWords: ["Να αποδείξετε", "Να λύσετε", "Να βρείτε", "Να σχεδιάσετε"], tips: ["Proofs are heavily weighted in Greek exams", "Always state which theorem you are using"] }
    }
  },
  // ── GRADE 10 ──
  10: {
    albanian: {
      meta: { curriculumName: "Albanian MAS — Klasa 10", language: "sq" },
      units: [
        { title: "Funksionet trigonometrike", topics: [
          { title: "Rrethi trigonometrik", concepts: ["sinus", "kosinus", "tangjent", "kotangjent", "rrethi njësi"], keyFormulas: ["sin²α + cos²α = 1", "tanα = sinα/cosα", "sin(α+β) = sinα·cosβ + cosα·sinβ", "cos(α+β) = cosα·cosβ - sinα·sinβ"], keyFacts: ["Kuadranti I: sin>0, cos>0", "Kuadranti II: sin>0, cos<0", "Kuadranti III: sin<0, cos<0", "Kuadranti IV: sin<0, cos>0"] },
          { title: "Ekuacione trigonometrike bazë", concepts: ["sinx=a", "cosx=a", "tanx=a"], keyFormulas: ["sinx=a → x=(-1)ⁿarcsin(a)+nπ", "cosx=a → x=±arccos(a)+2nπ", "tanx=a → x=arctan(a)+nπ"] }
        ]},
        { title: "Vargjet dhe seritë", topics: [
          { title: "Progresioni aritmetik", concepts: ["diferenca", "termi i përgjithshëm", "shuma e n termave"], keyFormulas: ["aₙ = a₁ + (n-1)d", "Sₙ = n(a₁+aₙ)/2"] },
          { title: "Progresioni gjeometrik", concepts: ["raporti", "termi i përgjithshëm", "shuma"], keyFormulas: ["aₙ = a₁·qⁿ⁻¹", "Sₙ = a₁(qⁿ-1)/(q-1)", "S∞ = a₁/(1-q) për |q|<1"] }
        ]},
        { title: "Vektorët në plan", topics: [
          { title: "Veprime me vektorë", concepts: ["mbledhja", "zbritja", "shumëzimi me skalar", "prodhimi skalar"], keyFormulas: ["ā·b̄ = |ā||b̄|cosθ", "ā·b̄ = a₁b₁+a₂b₂", "|ā| = √(a₁²+a₂²)"], keyFacts: ["Vektorë pingulë: ā·b̄ = 0", "Vektorë paralelë: a₁/b₁ = a₂/b₂"] }
        ]},
        { title: "Gjeometria analitike", topics: [
          { title: "Rrethi", concepts: ["ekuacioni i rrethit", "qendra", "rrezja", "tangjentja"], keyFormulas: ["(x-a)²+(y-b)²=r²", "Distanca pikë-drejtëz: d=|Ax₀+By₀+C|/√(A²+B²)"], keyFacts: ["Tangjentja është pingule me rrezen në pikën e tangencës"] }
        ]}
      ],
      examFormat: { papers: ["Provimi vjetor (3 orë)"], commandWords: ["llogarit", "vërteto", "gjej", "skico"], tips: ["Shkruaj formulën para zëvendësimit"] }
    },
    ib: {
      meta: { curriculumName: "IB Mathematics: Analysis & Approaches SL (Year 2)", language: "en" },
      units: [
        { title: "Calculus — Introduction to Differentiation", topics: [
          { title: "Limits and First Principles", concepts: ["limit definition", "derivative from first principles", "gradient function"], keyFormulas: ["f'(x) = lim(h→0) [f(x+h)-f(x)]/h"] },
          { title: "Differentiation Rules", concepts: ["power rule", "chain rule", "product rule", "quotient rule"], keyFormulas: ["d/dx(xⁿ) = nxⁿ⁻¹", "d/dx[f(g(x))] = f'(g(x))·g'(x)", "d/dx[uv] = u'v+uv'", "d/dx[u/v] = (u'v-uv')/v²"], keyFacts: ["Tangent gradient = f'(x₀)", "Normal gradient = -1/f'(x₀)", "Stationary point: f'(x)=0"] },
          { title: "Applications of Differentiation", concepts: ["optimization", "related rates", "increasing/decreasing functions", "concavity"], keyFacts: ["f'(x)>0: increasing", "f'(x)<0: decreasing", "f''(x)>0: concave up (minimum)", "f''(x)<0: concave down (maximum)"] }
        ]},
        { title: "Calculus — Integration", topics: [
          { title: "Indefinite Integration", concepts: ["antiderivative", "constant of integration"], keyFormulas: ["∫xⁿdx = xⁿ⁺¹/(n+1)+C for n≠-1", "∫eˣdx = eˣ+C", "∫(1/x)dx = ln|x|+C"] },
          { title: "Definite Integration & Area", concepts: ["area under curve", "area between curves", "Fundamental Theorem"], keyFormulas: ["∫ₐᵇf(x)dx = F(b)-F(a)", "Area = ∫ₐᵇ|f(x)|dx"] }
        ]},
        { title: "Probability Distributions", topics: [
          { title: "Binomial Distribution", concepts: ["n trials", "probability p", "expected value", "variance"], keyFormulas: ["P(X=r) = C(n,r)pʳ(1-p)ⁿ⁻ʳ", "E(X) = np", "Var(X) = np(1-p)"] },
          { title: "Normal Distribution", concepts: ["bell curve", "z-score", "standard normal", "68-95-99.7 rule"], keyFormulas: ["Z = (X-μ)/σ", "P(μ-σ<X<μ+σ) ≈ 0.68"] }
        ]}
      ],
      examFormat: { papers: ["Paper 1 (non-calc)", "Paper 2 (calc)"], commandWords: ["find", "show", "hence", "write down"], tips: ["Use GDC for normal distribution on Paper 2"] }
    },
    american: {
      meta: { curriculumName: "US Geometry / Algebra II", language: "en" },
      units: [
        { title: "Geometric Proofs and Congruence", topics: [
          { title: "Triangle Congruence", concepts: ["SSS", "SAS", "ASA", "AAS", "HL (right triangles)"], keyFacts: ["SSA is NOT a valid congruence criterion (ambiguous case)", "CPCTC: Corresponding Parts of Congruent Triangles are Congruent"] },
          { title: "Parallel Lines and Transversals", concepts: ["corresponding angles", "alternate interior", "alternate exterior", "co-interior"], keyFacts: ["Corresponding angles equal ↔ lines parallel", "Alternate interior angles equal ↔ lines parallel"] }
        ]},
        { title: "Polynomial and Rational Functions", topics: [
          { title: "Polynomial Division", concepts: ["synthetic division", "Remainder Theorem", "Factor Theorem"], keyFormulas: ["f(a) = 0 ⟹ (x-a) is a factor"], keyFacts: ["Degree n polynomial has at most n real roots"] },
          { title: "Rational Expressions", concepts: ["simplifying", "asymptotes", "domain restrictions"], keyFacts: ["Vertical asymptote: denominator = 0", "Horizontal asymptote: compare degrees"] }
        ]},
        { title: "Exponential and Logarithmic Functions", topics: [
          { title: "Exponential Growth and Decay", concepts: ["base e", "half-life", "doubling time", "compound interest"], keyFormulas: ["A = P(1+r/n)ⁿᵗ", "A = Pe^(rt)", "t₁/₂ = ln2/k"] }
        ]}
      ],
      examFormat: { papers: ["Unit tests", "State assessment (End of Course)"], commandWords: ["solve", "prove", "justify", "construct"], tips: ["Show all work", "Justify each step in proofs"] }
    },
    uk: {
      meta: { curriculumName: "UK GCSE Higher — Year 11", language: "en" },
      units: [
        { title: "Advanced Algebra", topics: [
          { title: "Algebraic Fractions", concepts: ["simplifying", "adding/subtracting", "solving equations with fractions"], keyFacts: ["Factor numerator and denominator first", "Find LCD for addition"] },
          { title: "Surds", concepts: ["simplifying surds", "rationalising the denominator"], keyFormulas: ["√a × √b = √(ab)", "a/(√b) = a√b/b", "(a+√b)(a-√b) = a²-b"] },
          { title: "Functions and Iteration", concepts: ["function notation", "inverse functions", "iteration"], keyFacts: ["Iteration: xₙ₊₁ = g(xₙ), converges to root of x = g(x)"] }
        ]},
        { title: "Trigonometry Extended", topics: [
          { title: "Sine and Cosine Rules", concepts: ["non-right triangles", "bearings"], keyFormulas: ["a/sinA = b/sinB = c/sinC", "a² = b²+c²-2bc·cosA", "Area = ½ab·sinC"] },
          { title: "Trigonometric Graphs", concepts: ["y=sinx", "y=cosx", "y=tanx", "transformations"], keyFacts: ["Period of sin/cos: 360°", "Period of tan: 180°"] }
        ]},
        { title: "Vectors", topics: [
          { title: "Vector Geometry", concepts: ["position vectors", "column vectors", "magnitude", "direction"], keyFormulas: ["|v| = √(a²+b²)", "AB = b - a (position vectors)"], keyFacts: ["Parallel vectors: one is scalar multiple of other", "Midpoint M: m = (a+b)/2"] }
        ]}
      ],
      examFormat: { papers: ["Paper 1 (non-calc)", "Paper 2 (calc)", "Paper 3 (calc)"], commandWords: ["work out", "prove", "explain why", "give reasons"], tips: ["State circle theorem names", "Show working for 'prove' questions"] }
    },
    german: {
      meta: { curriculumName: "Gymnasium Klasse 10 — Mathematik", language: "de" },
      units: [
        { title: "Trigonometrie", topics: [
          { title: "Sinus, Kosinus, Tangens am Einheitskreis", concepts: ["Einheitskreis", "Bogenmaß", "Sinusfunktion", "Kosinusfunktion"], keyFormulas: ["sin²α+cos²α=1", "Bogenmaß: α(rad)=α°·π/180"], keyFacts: ["Sinus: y-Koordinate am Einheitskreis", "Kosinus: x-Koordinate am Einheitskreis"] },
          { title: "Sinussatz und Kosinussatz", concepts: ["allgemeines Dreieck", "Flächenberechnung"], keyFormulas: ["a/sinA=b/sinB=c/sinC", "a²=b²+c²-2bc·cosA", "A=½ab·sinC"] }
        ]},
        { title: "Exponentialfunktion und Logarithmus", topics: [
          { title: "Exponentielles Wachstum und Zerfall", concepts: ["Wachstumsfaktor", "Halbwertszeit", "Verdopplungszeit"], keyFormulas: ["f(t) = a·bᵗ", "t₁/₂ = ln2/k", "f(t) = a·e^(kt)"] },
          { title: "Logarithmengesetze", concepts: ["Logarithmus", "natürlicher Logarithmus", "Umkehrfunktion"], keyFormulas: ["log(a·b)=log(a)+log(b)", "log(aⁿ)=n·log(a)", "log_b(x)=ln(x)/ln(b)"] }
        ]},
        { title: "Stochastik", topics: [
          { title: "Bedingte Wahrscheinlichkeit", concepts: ["Vierfeldertafel", "Baumdiagramm", "stochastische Unabhängigkeit"], keyFormulas: ["P(A|B)=P(A∩B)/P(B)", "Unabhängig: P(A∩B)=P(A)·P(B)"], keyFacts: ["Bayes: P(A|B)=P(B|A)·P(A)/P(B)"] }
        ]}
      ],
      examFormat: { papers: ["Schulaufgabe (45-60 min)"], commandWords: ["berechne", "bestimme", "zeige", "begründe", "untersuche"], tips: ["Immer Einheit angeben"] }
    },
    greek: {
      meta: { curriculumName: "Ελληνικό Λύκειο Β' Τάξη — Μαθηματικά", language: "el" },
      units: [
        { title: "Trigonometry Extended", topics: [
          { title: "Trigonometric Identities", concepts: ["addition formulas", "double angle", "transformations"], keyFormulas: ["sin(α±β)=sinαcosβ±cosαsinβ", "cos(α±β)=cosαcosβ∓sinαsinβ", "sin2α=2sinαcosα", "cos2α=cos²α-sin²α"] },
          { title: "Trigonometric Equations", concepts: ["general solution", "auxiliary angle"], keyFacts: ["General solution for sinx=k: x=(-1)ⁿarcsin(k)+nπ", "General solution for cosx=k: x=±arccos(k)+2nπ"] }
        ]},
        { title: "Exponential and Logarithmic Functions", topics: [
          { title: "Properties and Equations", concepts: ["exponential function", "logarithmic function", "growth models"], keyFormulas: ["logₐ(xy)=logₐx+logₐy", "logₐ(xⁿ)=nlogₐx"], keyFacts: ["Greek curriculum requires proofs of logarithm properties"] }
        ]},
        { title: "Sequences", topics: [
          { title: "Arithmetic and Geometric Sequences", concepts: ["general term", "sum formula", "convergence"], keyFormulas: ["aₙ=a₁+(n-1)d", "Sₙ=n(a₁+aₙ)/2", "aₙ=a₁·rⁿ⁻¹", "S∞=a₁/(1-r) for |r|<1"] }
        ]}
      ],
      examFormat: { papers: ["Γραπτή εξέταση (3 ώρες)"], commandWords: ["Να αποδείξετε", "Να λύσετε", "Να βρείτε"] }
    }
  },
  // ── GRADE 11 ──
  11: {
    albanian: {
      meta: { curriculumName: "Albanian MAS — Klasa 11", language: "sq" },
      units: [
        { title: "Limitet dhe vazhdueshmëria", topics: [
          { title: "Koncepti i limitit", concepts: ["limit", "limiti i funksionit", "limiti i pafund"], keyFormulas: ["lim(x→a) f(x) = L", "lim(x→∞) 1/x = 0", "lim(x→0) sinx/x = 1"], keyFacts: ["Limiti ekziston nëse limiti nga e majta = limiti nga e djathta", "0/0 është formë e pacaktuar — duhet thjeshtëzim"] },
          { title: "Vazhdueshmëria", concepts: ["funksion i vazhdueshëm", "pikat e ndërprerjes"], keyFacts: ["f vazhdueshëm në a nëse: 1) f(a) ekziston, 2) lim f(x) ekziston, 3) lim f(x)=f(a)"] }
        ]},
        { title: "Derivati", topics: [
          { title: "Derivati i funksionit", concepts: ["shkalla e ndryshimit", "derivati", "tangjentja"], keyFormulas: ["f'(x) = lim(h→0) [f(x+h)-f(x)]/h", "(xⁿ)' = nxⁿ⁻¹", "(sinx)' = cosx", "(cosx)' = -sinx", "(eˣ)' = eˣ", "(lnx)' = 1/x"], keyFacts: ["Derivati jep koeficientin këndor të tangjentes", "f'(x₀) = 0 → pikë stacionare"] },
          { title: "Rregullat e derivimit", concepts: ["rregulla e prodhimit", "rregulla e herësit", "rregulla e zinxhirit"], keyFormulas: ["(fg)' = f'g + fg'", "(f/g)' = (f'g-fg')/g²", "[f(g(x))]' = f'(g(x))·g'(x)"] }
        ]},
        { title: "Aplikimet e derivatit", topics: [
          { title: "Ekstremumet dhe monotonia", concepts: ["pikë minimumi", "pikë maksimumi", "intervale rritëse/zbritëse"], keyFacts: ["f'(x) > 0: funksion rritës", "f'(x) < 0: funksion zbritës", "Derivati i dytë: f''(x₀)>0 → minimum, f''(x₀)<0 → maksimum"] },
          { title: "Problemet e optimizimit", concepts: ["vlera maksimale", "vlera minimale", "modelim"], keyFacts: ["Hapat: 1) Shkruaj funksionin objektiv, 2) Gjej derivatin, 3) Zgjidh f'(x)=0, 4) Kontrollo me f''"] }
        ]},
        { title: "Kombinatorika", topics: [
          { title: "Permutacione dhe kombinacione", concepts: ["faktorial", "permutacion", "kombinacion"], keyFormulas: ["n! = n·(n-1)·...·1", "P(n,r) = n!/(n-r)!", "C(n,r) = n!/(r!(n-r)!)"], keyFacts: ["Permutacione: radha ka rëndësi", "Kombinacione: radha nuk ka rëndësi", "C(n,0) = C(n,n) = 1"] }
        ]}
      ]
    },
    ib: {
      meta: { curriculumName: "IB Math AA SL — Exam Preparation", language: "en" },
      units: [
        { title: "Advanced Calculus", topics: [
          { title: "Integration Techniques", concepts: ["substitution", "integration by parts", "partial fractions"], keyFormulas: ["∫f(g(x))g'(x)dx = F(g(x))+C", "∫u·dv = uv - ∫v·du"] },
          { title: "Differential Equations", concepts: ["separable ODEs", "particular solutions", "growth/decay"], keyFormulas: ["dy/dx = ky → y = Ae^(kt)"], keyFacts: ["Separable: rewrite as g(y)dy = f(x)dx then integrate both sides"] }
        ]},
        { title: "Vectors in 3D", topics: [
          { title: "Vector Operations", concepts: ["dot product", "cross product", "angle between vectors", "vector equation of line"], keyFormulas: ["a·b = |a||b|cosθ", "r = a + tb (line equation)"], keyFacts: ["Perpendicular vectors: a·b = 0", "Parallel vectors: a = kb"] }
        ]},
        { title: "Exploration (Internal Assessment)", topics: [
          { title: "Mathematical Exploration", concepts: ["personal engagement", "mathematical communication", "use of mathematics"], keyFacts: ["6-12 pages recommended", "Must include personal interest topic", "Criteria: A (Presentation), B (Mathematical communication), C (Personal engagement), D (Reflection), E (Use of mathematics)"] }
        ]}
      ]
    },
    american: {
      meta: { curriculumName: "US Pre-Calculus / AP Precalculus", language: "en" },
      units: [
        { title: "Trigonometric Functions", topics: [
          { title: "Unit Circle and Graphs", concepts: ["radian measure", "amplitude", "period", "phase shift"], keyFormulas: ["y = Asin(B(x-C))+D", "Period = 2π/B", "Amplitude = |A|"] },
          { title: "Trigonometric Identities", concepts: ["Pythagorean", "double angle", "sum-to-product"], keyFormulas: ["sin²θ+cos²θ=1", "sin2θ=2sinθcosθ", "cos2θ=2cos²θ-1"] }
        ]},
        { title: "Limits and Introduction to Calculus", topics: [
          { title: "Concept of Limit", concepts: ["intuitive understanding", "one-sided limits", "continuity"], keyFormulas: ["lim(x→a) f(x) = L"] },
          { title: "Rate of Change", concepts: ["average rate", "instantaneous rate", "secant vs tangent"], keyFacts: ["Average rate = Δy/Δx", "Instantaneous rate = limit of average rate as Δx→0"] }
        ]},
        { title: "Conic Sections", topics: [
          { title: "Circles, Ellipses, Parabolas, Hyperbolas", concepts: ["standard form", "foci", "directrix", "eccentricity"], keyFormulas: ["Circle: (x-h)²+(y-k)²=r²", "Ellipse: (x-h)²/a²+(y-k)²/b²=1", "Parabola: y=a(x-h)²+k", "Hyperbola: (x-h)²/a²-(y-k)²/b²=1"] }
        ]}
      ]
    },
    uk: {
      meta: { curriculumName: "UK A-Level Mathematics (Year 12)", language: "en" },
      units: [
        { title: "Differentiation", topics: [
          { title: "Rules and Applications", concepts: ["power rule", "chain rule", "product rule", "quotient rule", "stationary points"], keyFormulas: ["d/dx(xⁿ)=nxⁿ⁻¹", "d/dx(eˣ)=eˣ", "d/dx(lnx)=1/x", "d/dx(sinx)=cosx", "d/dx(cosx)=-sinx"] },
          { title: "Tangents and Normals", concepts: ["gradient at a point", "equation of tangent", "equation of normal"], keyFormulas: ["Tangent: y-y₁=f'(x₁)(x-x₁)", "Normal: y-y₁=-1/f'(x₁)·(x-x₁)"] }
        ]},
        { title: "Integration", topics: [
          { title: "Indefinite and Definite Integrals", concepts: ["reverse of differentiation", "area under curve", "trapezium rule"], keyFormulas: ["∫xⁿdx = xⁿ⁺¹/(n+1)+C", "∫eˣdx=eˣ+C", "Area = ∫ₐᵇf(x)dx"] }
        ]},
        { title: "Mechanics", topics: [
          { title: "Kinematics", concepts: ["displacement", "velocity", "acceleration", "constant acceleration"], keyFormulas: ["v=u+at", "s=ut+½at²", "v²=u²+2as", "s=½(u+v)t"], keyFacts: ["SUVAT equations assume CONSTANT acceleration", "Take one direction as positive and be consistent"] },
          { title: "Forces and Newton's Laws", concepts: ["weight", "normal reaction", "friction", "tension", "F=ma"], keyFormulas: ["W=mg", "F=ma", "F≤μR (friction)"], keyFacts: ["Draw a force diagram first", "Resolve forces parallel and perpendicular to motion"] }
        ]},
        { title: "Statistics", topics: [
          { title: "Statistical Distributions", concepts: ["binomial", "normal", "hypothesis testing"], keyFormulas: ["X~B(n,p): P(X=r)=C(n,r)pʳ(1-p)ⁿ⁻ʳ", "X~N(μ,σ²): Z=(X-μ)/σ"] }
        ]}
      ]
    },
    german: {
      meta: { curriculumName: "Gymnasium Klasse 11 (Qualifikationsphase Q1)", language: "de" },
      units: [
        { title: "Analysis: Differentialrechnung", topics: [
          { title: "Ableitungsregeln", concepts: ["Potenzregel", "Kettenregel", "Produktregel", "Quotientenregel"], keyFormulas: ["(xⁿ)'=nxⁿ⁻¹", "(eˣ)'=eˣ", "(ln x)'=1/x", "(sin x)'=cos x", "(f·g)'=f'g+fg'"] },
          { title: "Kurvendiskussion", concepts: ["Nullstellen", "Extrempunkte", "Wendepunkte", "Monotonie", "Krümmung"], keyFacts: ["f'(x₀)=0 und f''(x₀)>0 → Minimum", "f'(x₀)=0 und f''(x₀)<0 → Maximum", "f''(x₀)=0 und f'''(x₀)≠0 → Wendepunkt"] }
        ]},
        { title: "Analysis: Integralrechnung", topics: [
          { title: "Stammfunktion und bestimmtes Integral", concepts: ["Stammfunktion", "Hauptsatz", "Flächenberechnung"], keyFormulas: ["∫xⁿdx = xⁿ⁺¹/(n+1)+C", "∫ₐᵇf(x)dx = F(b)-F(a)"], keyFacts: ["Fläche zwischen Kurve und x-Achse: Vorzeichen beachten!", "Fläche zwischen zwei Kurven: ∫|f(x)-g(x)|dx"] }
        ]}
      ]
    },
    greek: {
      meta: { curriculumName: "Ελληνικό Λύκειο Γ' Τάξη — Μαθηματικά Κατεύθυνσης", language: "el" },
      units: [
        { title: "Limits and Continuity", topics: [
          { title: "Limit Theory", concepts: ["definition of limit", "limit properties", "squeeze theorem", "indeterminate forms"], keyFormulas: ["lim(x→a)[f(x)±g(x)] = lim f(x) ± lim g(x)", "lim(x→0) sinx/x = 1"], keyFacts: ["Greek curriculum emphasizes epsilon-delta proofs at this level"] }
        ]},
        { title: "Differential Calculus", topics: [
          { title: "Derivative and Applications", concepts: ["derivative definition", "differentiation rules", "L'Hôpital's rule", "Rolle's theorem", "Mean Value Theorem"], keyFormulas: ["(fⁿ)'=nfⁿ⁻¹·f'", "L'Hôpital: lim f/g = lim f'/g' (for 0/0 or ∞/∞)"], keyFacts: ["Rolle's: if f(a)=f(b), ∃c∈(a,b) with f'(c)=0", "MVT: ∃c with f'(c)=(f(b)-f(a))/(b-a)"] }
        ]},
        { title: "Integral Calculus", topics: [
          { title: "Definite and Indefinite Integrals", concepts: ["antiderivative", "FTC", "area calculation"], keyFormulas: ["∫xⁿdx=xⁿ⁺¹/(n+1)+C", "∫ₐᵇf(x)dx=F(b)-F(a)"] }
        ]}
      ]
    }
  },
  // ── GRADE 12 ──
  12: {
    albanian: {
      meta: { curriculumName: "Albanian MAS — Klasa 12 (Matura)", language: "sq" },
      units: [
        { title: "Integrali", topics: [
          { title: "Integrali i pacaktuar", concepts: ["antiderivati", "konstantja e integrimit"], keyFormulas: ["∫xⁿdx = xⁿ⁺¹/(n+1)+C", "∫sinxdx = -cosx+C", "∫cosxdx = sinx+C", "∫eˣdx = eˣ+C", "∫(1/x)dx = ln|x|+C"] },
          { title: "Integrali i caktuar dhe sipërfaqja", concepts: ["sipërfaqja nën grafik", "teorema themelore e kalkulusit"], keyFormulas: ["∫ₐᵇf(x)dx = F(b)-F(a)", "Sipërfaqja = ∫ₐᵇ|f(x)|dx"] }
        ]},
        { title: "Numrat kompleksë", topics: [
          { title: "Forma algjebrike dhe trigonometrike", concepts: ["njësia imagjinare i", "moduli", "argumenti", "forma trigonometrike"], keyFormulas: ["i² = -1", "|z| = √(a²+b²)", "z = r(cosθ + isinθ)", "z₁·z₂ = r₁r₂[cos(θ₁+θ₂)+isin(θ₁+θ₂)]"], keyFacts: ["Konjugati: z̄ = a-bi", "z·z̄ = |z|²", "Formula e Moivrit: zⁿ = rⁿ(cos(nθ)+isin(nθ))"] }
        ]},
        { title: "Përgatitje për Maturën Shtetërore", topics: [
          { title: "Ripërsëritje gjithëpërfshirëse", concepts: ["ekuacione", "funksione", "derivate", "integrale", "trigonometri", "gjeometri", "probabilitet"], keyFacts: ["Provimi: 4 detyra me zgjidhje, 3 orë", "Llogaritësi nuk lejohet", "Trego të gjitha hapat e zgjidhjes"] }
        ]}
      ],
      examFormat: { papers: ["Matura Shtetërore (3 orë, 4 detyra)"], commandWords: ["llogarit", "vërteto", "gjej", "skico"], tips: ["Fokus te limitet, derivatet, integralet", "Ushtrohu me provimet e viteve të mëparshme"] }
    },
    ib: {
      meta: { curriculumName: "IB Math AA SL — Final Exam Review", language: "en" },
      units: [
        { title: "Full Syllabus Review", topics: [
          { title: "Number & Algebra Review", concepts: ["sequences", "exponents", "logarithms", "binomial"], keyFormulas: ["uₙ=u₁+(n-1)d", "S∞=u₁/(1-r)", "logₐb=lnb/lna"] },
          { title: "Functions Review", concepts: ["transformations", "quadratics", "rational functions", "exponential"], keyFacts: ["Know all transformation rules cold", "Sketch key features: intercepts, asymptotes, turning points"] },
          { title: "Calculus Review", concepts: ["differentiation rules", "integration", "optimization", "kinematics"], keyFormulas: ["v=ds/dt, a=dv/dt", "s=∫v dt", "Area=∫|f(x)|dx"] },
          { title: "Probability & Statistics Review", concepts: ["binomial", "normal", "probability rules", "descriptive stats"], keyFormulas: ["E(X)=np", "Z=(X-μ)/σ"] }
        ]}
      ],
      examFormat: { papers: ["Paper 1 non-calc (90 min, 80 marks)", "Paper 2 calc (90 min, 80 marks)"], tips: ["Manage time: ~1.1 min per mark", "Read 'hence' questions carefully", "Check units in applied problems"] }
    },
    american: {
      meta: { curriculumName: "AP Calculus AB", language: "en" },
      units: [
        { title: "Limits and Continuity", topics: [
          { title: "Limits", concepts: ["limit definition", "one-sided limits", "infinite limits", "limits at infinity", "squeeze theorem"], keyFormulas: ["lim(x→0)sinx/x=1", "lim(x→∞)1/x=0"], keyFacts: ["Indeterminate forms: 0/0, ∞/∞ — use L'Hôpital or algebra"] }
        ]},
        { title: "Differentiation", topics: [
          { title: "Derivative Rules", concepts: ["power rule", "product rule", "quotient rule", "chain rule", "implicit differentiation"], keyFormulas: ["d/dx[xⁿ]=nxⁿ⁻¹", "d/dx[sin x]=cos x", "d/dx[eˣ]=eˣ", "d/dx[ln x]=1/x"] },
          { title: "Applications", concepts: ["related rates", "optimization", "linear approximation", "Mean Value Theorem"], keyFormulas: ["L(x)=f(a)+f'(a)(x-a)"] }
        ]},
        { title: "Integration", topics: [
          { title: "Fundamental Theorem and Techniques", concepts: ["Riemann sums", "FTC Part 1 & 2", "u-substitution", "area between curves", "volume of revolution"], keyFormulas: ["d/dx[∫ₐˣf(t)dt]=f(x) (FTC1)", "∫ₐᵇf(x)dx=F(b)-F(a) (FTC2)", "V=π∫ₐᵇ[R(x)]²dx (disk method)", "V=2π∫ₐᵇx·f(x)dx (shell method)"] }
        ]},
        { title: "Differential Equations", topics: [
          { title: "Separable DEs and Slope Fields", concepts: ["slope fields", "separation of variables", "exponential growth/decay"], keyFormulas: ["dy/dx=ky → y=Ce^(kt)"], keyFacts: ["AP exam: sketch slope field by evaluating dy/dx at grid points", "Verify solution by substituting back into DE"] }
        ]}
      ],
      examFormat: { papers: ["Section I: 45 MC (1h45min)", "Section II: 6 FRQ (1h30min)"], tips: ["MC: no calculator on Part A, calculator on Part B", "FRQ: show ALL work, answers without work = no credit", "Euler's method may appear on calculator section"] }
    },
    uk: {
      meta: { curriculumName: "UK A-Level Mathematics (Year 13)", language: "en" },
      units: [
        { title: "Further Calculus", topics: [
          { title: "Advanced Integration", concepts: ["integration by parts", "partial fractions", "parametric integration"], keyFormulas: ["∫u dv = uv - ∫v du", "∫1/(x-a)dx=ln|x-a|+C"] },
          { title: "Differential Equations", concepts: ["first order separable", "integrating factor", "family of curves"], keyFormulas: ["dy/dx+P(x)y=Q(x), IF=e^∫P dx"] }
        ]},
        { title: "Further Mechanics", topics: [
          { title: "Moments and Equilibrium", concepts: ["moments", "centre of mass", "tilting and toppling"], keyFormulas: ["Moment = Force × perpendicular distance"], keyFacts: ["For equilibrium: ΣF=0 and ΣM=0 about any point"] },
          { title: "Projectiles", concepts: ["horizontal/vertical components", "range", "maximum height", "time of flight"], keyFormulas: ["Horizontal: x=ucosθ·t", "Vertical: y=usinθ·t-½gt²", "Range=u²sin2θ/g"] }
        ]},
        { title: "Further Statistics", topics: [
          { title: "Normal Distribution and Hypothesis Testing", concepts: ["Z-test", "significance level", "p-value", "critical region", "Type I/II errors"], keyFormulas: ["Z=(X̄-μ)/(σ/√n)"], keyFacts: ["If p-value < significance level → reject H₀", "Type I error: rejecting true H₀", "Type II error: accepting false H₀"] }
        ]}
      ]
    },
    german: {
      meta: { curriculumName: "Gymnasium Klasse 12 (Q2) — Abitur-Vorbereitung", language: "de" },
      units: [
        { title: "Analytische Geometrie", topics: [
          { title: "Geraden und Ebenen im Raum", concepts: ["Parameterform", "Normalenform", "Lagebeziehungen", "Abstände"], keyFormulas: ["Gerade: r=a+t·b", "Ebene: r=a+s·b+t·c", "n·(r-a)=0 (Normalenform)"], keyFacts: ["Abstand Punkt-Ebene: d=|n·(p-a)|/|n|", "Schnittwinkel: cosα=|n₁·n₂|/(|n₁||n₂|)"] }
        ]},
        { title: "Stochastik (Abitur)", topics: [
          { title: "Binomialverteilung und Hypothesentest", concepts: ["Binomialverteilung", "Erwartungswert", "Standardabweichung", "Signifikanztest"], keyFormulas: ["P(X=k)=C(n,k)·pᵏ·(1-p)ⁿ⁻ᵏ", "E(X)=np", "σ=√(np(1-p))"], keyFacts: ["Ablehnungsbereich bestimmen mit kumulierter Binomialverteilung", "Fehler 1. Art: H₀ fälschlich ablehnen"] }
        ]}
      ],
      examFormat: { papers: ["Abiturprüfung (4-5 Stunden)", "Analysis + Analytische Geometrie + Stochastik"], tips: ["Alle drei Gebiete werden geprüft", "Hilfsmittel: CAS oder wissenschaftlicher Taschenrechner (je nach Bundesland)"] }
    },
    greek: {
      meta: { curriculumName: "Πανελλαδικές Εξετάσεις — Μαθηματικά", language: "el" },
      units: [
        { title: "Integral Calculus (Full)", topics: [
          { title: "Integration Techniques", concepts: ["substitution", "integration by parts", "definite integrals", "area"], keyFormulas: ["∫f(g(x))g'(x)dx=F(g(x))+C", "∫udv=uv-∫vdu"], keyFacts: ["Panhellenic exams: heavy emphasis on proving integrability and FTC application"] }
        ]},
        { title: "Complex Numbers", topics: [
          { title: "Algebraic and Trigonometric Form", concepts: ["imaginary unit", "modulus", "argument", "De Moivre's theorem"], keyFormulas: ["z=a+bi", "|z|=√(a²+b²)", "zⁿ=rⁿ(cosnθ+isinnθ)"] }
        ]}
      ],
      examFormat: { papers: ["Πανελλαδικές (3 ώρες, 4 θέματα)"], tips: ["Θέμα Α: θεωρία", "Θέματα Β-Δ: ασκήσεις με αυξανόμενη δυσκολία"] }
    }
  }
};

// ═══════════════════════════════════════════════════════════════════
// PHYSICS CURRICULUM DATA
// ═══════════════════════════════════════════════════════════════════

const PHYSICS = {
  9: {
    albanian: { meta: { curriculumName: "Albanian MAS — Fizikë Klasa 9", language: "sq" }, units: [
      { title: "Termodinamika", topics: [
        { title: "Temperatura dhe nxehtësia", concepts: ["temperatura", "nxehtësia", "ekuilibri termik", "shkallët e temperaturës"], keyFormulas: ["Q = mcΔT", "T(K) = T(°C) + 273.15"], keyFacts: ["Nxehtësia lëviz nga trupi më i nxehtë tek më i ftohtë", "Ekuilibri termik: temperatura e njëjtë", "Kapaciteti specifik termik: energjia për 1°C për 1 kg"] },
        { title: "Ligjet e termodinamikës", concepts: ["ligji i parë", "ligji i dytë", "entropia"], keyFormulas: ["ΔU = Q - W", "η = W/Q_h = 1 - Q_c/Q_h"], keyFacts: ["Ligji I: energjia ruhet (konservohet)", "Ligji II: entropia e universit rritet gjithmonë", "Efiqenca e Carnot: η_max = 1 - T_c/T_h"] }
      ]},
      { title: "Vetitë e lëndës", topics: [
        { title: "Lëngjet dhe gazet", concepts: ["dendësia", "shtypja", "ligji i Paskalit", "ligji i Arkimedit", "ligji i Bernulit"], keyFormulas: ["ρ = m/V", "P = F/A", "P = ρgh", "F_ngjitëse = ρ_lëng·g·V_zhytur"], keyFacts: ["Shtypja atmosferike: ~101325 Pa = 1 atm", "Arkimedi: forca ngjitëse = pesha e lëngut të zhvendosur"] }
      ]},
      { title: "Lëvizja harmonike e thjeshtë", topics: [
        { title: "Oshilimet", concepts: ["perioda", "frekuenca", "amplituda", "lavjerrësi", "sustë"], keyFormulas: ["T = 2π√(l/g) (lavjerrësi)", "T = 2π√(m/k) (sustë)", "f = 1/T", "x = A·sin(ωt)"], keyFacts: ["ω = 2πf = 2π/T", "Energjia totale e oshilatorit është konstante në mungesë të fërkimit"] }
      ]}
    ]},
    ib: { meta: { curriculumName: "IB Physics SL — Topic 3: Thermal Physics", language: "en" }, units: [
      { title: "Thermal Concepts", topics: [
        { title: "Temperature and Heat", concepts: ["internal energy", "temperature", "heat", "specific heat capacity", "phase changes"], keyFormulas: ["Q = mcΔT", "Q = mL (latent heat)"], keyFacts: ["Temperature: average KE of particles", "Internal energy: total KE + PE of particles", "During phase change: temperature stays constant, energy changes PE"] },
        { title: "Ideal Gas Law", concepts: ["moles", "Avogadro", "ideal gas", "Boltzmann constant"], keyFormulas: ["PV = nRT", "PV = NkT", "KE_avg = 3/2 kT"], keyFacts: ["R = 8.314 J/(mol·K)", "k = 1.38×10⁻²³ J/K", "Ideal gas assumptions: point particles, elastic collisions, no intermolecular forces"] }
      ]},
      { title: "Waves", topics: [
        { title: "Wave Properties", concepts: ["transverse", "longitudinal", "wavelength", "frequency", "amplitude", "speed"], keyFormulas: ["v = fλ", "T = 1/f"], keyFacts: ["Sound: longitudinal", "Light: transverse", "EM waves travel at c = 3×10⁸ m/s in vacuum"] },
        { title: "Wave Phenomena", concepts: ["reflection", "refraction", "diffraction", "superposition", "standing waves"], keyFormulas: ["n₁sinθ₁ = n₂sinθ₂ (Snell's law)", "sin θ_c = n₂/n₁ (critical angle)"], keyFacts: ["Diffraction greatest when gap ≈ wavelength", "Standing waves: nodes and antinodes", "Doppler: higher pitch when approaching"] }
      ]}
    ]},
    american: { meta: { curriculumName: "US Physics 1 (AP-aligned)", language: "en" }, units: [
      { title: "Mechanics Review & Waves", topics: [
        { title: "Rotational Motion", concepts: ["angular velocity", "torque", "moment of inertia", "angular momentum"], keyFormulas: ["τ = rFsinθ", "τ = Iα", "L = Iω", "KE_rot = ½Iω²"], keyFacts: ["Conservation of angular momentum: if Στ=0, L=constant", "Moment of inertia depends on mass distribution"] },
        { title: "Simple Harmonic Motion", concepts: ["restoring force", "spring constant", "pendulum", "energy in SHM"], keyFormulas: ["F = -kx (Hooke's law)", "T = 2π√(m/k)", "T = 2π√(L/g)", "E_total = ½kA²"] },
        { title: "Mechanical Waves and Sound", concepts: ["wave speed", "superposition", "standing waves", "resonance", "beats"], keyFormulas: ["v = fλ", "fₙ = nv/2L (string fixed at both ends)", "f_beat = |f₁-f₂|"] }
      ]}
    ]},
    uk: { meta: { curriculumName: "UK GCSE Physics — Waves and Energy", language: "en" }, units: [
      { title: "Energy", topics: [
        { title: "Energy Stores and Transfers", concepts: ["kinetic", "gravitational PE", "elastic PE", "thermal", "specific heat capacity"], keyFormulas: ["KE = ½mv²", "GPE = mgh", "Q = mcΔT", "Efficiency = useful output / total input"], keyFacts: ["Energy cannot be created or destroyed", "Efficiency always < 100% due to thermal waste"] },
        { title: "Power and Energy Resources", concepts: ["power", "renewable", "non-renewable", "nuclear", "fossil fuels"], keyFormulas: ["P = E/t", "P = W/t"] }
      ]},
      { title: "Waves", topics: [
        { title: "Properties of Waves", concepts: ["transverse", "longitudinal", "frequency", "period", "wave speed"], keyFormulas: ["v = fλ", "T = 1/f"] },
        { title: "EM Spectrum", concepts: ["radio", "microwave", "infrared", "visible", "UV", "X-ray", "gamma"], keyFacts: ["All EM waves travel at c = 3×10⁸ m/s in vacuum", "Higher frequency = more energy = more dangerous"] }
      ]}
    ]},
    german: { meta: { curriculumName: "Gymnasium Klasse 9 — Physik", language: "de" }, units: [
      { title: "Wärmelehre", topics: [
        { title: "Temperatur und Wärme", concepts: ["Temperatur", "Wärme", "spezifische Wärmekapazität", "Phasenübergänge"], keyFormulas: ["Q = mcΔT", "Q = mL (Schmelz-/Verdampfungswärme)"], keyFacts: ["Bei Phasenübergang: T bleibt konstant", "Wärmeleitung, Konvektion, Wärmestrahlung"] },
        { title: "Ideales Gas", concepts: ["Druck", "Volumen", "Temperatur", "Gasgesetz"], keyFormulas: ["pV = nRT", "p₁V₁/T₁ = p₂V₂/T₂"] }
      ]},
      { title: "Mechanische Schwingungen und Wellen", topics: [
        { title: "Schwingungen", concepts: ["Federpendel", "Fadenpendel", "Amplitude", "Periode", "Frequenz"], keyFormulas: ["T = 2π√(m/k)", "T = 2π√(l/g)", "f = 1/T"] },
        { title: "Wellen", concepts: ["Transversalwelle", "Longitudinalwelle", "Wellenlänge", "Ausbreitungsgeschwindigkeit"], keyFormulas: ["v = f·λ"] }
      ]}
    ]},
    greek: { meta: { curriculumName: "Greek Lykeio A — Physics", language: "el" }, units: [
      { title: "Thermodynamics", topics: [
        { title: "Heat and Temperature", concepts: ["specific heat", "latent heat", "gas laws"], keyFormulas: ["Q=mcΔT", "Q=mL", "PV=nRT"], keyFacts: ["Greek curriculum: heavy focus on ideal gas derivations and problem-solving"] }
      ]},
      { title: "Waves", topics: [
        { title: "Mechanical Waves", concepts: ["transverse", "longitudinal", "superposition", "standing waves"], keyFormulas: ["v=fλ", "v=√(T/μ) for string"], keyFacts: ["Standing wave: nodes fixed, antinodes maximum displacement"] }
      ]}
    ]}
  },
  10: {
    albanian: { meta: { curriculumName: "Albanian MAS — Fizikë Klasa 10", language: "sq" }, units: [
      { title: "Valët dhe optika", topics: [
        { title: "Valët mekanike", concepts: ["valë tërthore", "valë gjatësore", "shpejtësia", "gjatësia valore"], keyFormulas: ["v = fλ", "T = 1/f"] },
        { title: "Optika gjeometrike", concepts: ["pasqyrimi", "përthyerja", "ligji i Snell-it", "lente"], keyFormulas: ["n₁sinθ₁ = n₂sinθ₂", "1/f = 1/do + 1/di", "M = -di/do"], keyFacts: ["Lente konvergjente: f > 0", "Lente divergjente: f < 0", "Këndi kritik: sinθ_c = n₂/n₁"] }
      ]}
    ]},
    ib: { meta: { curriculumName: "IB Physics SL — Topics 4-5: Mechanics and Electricity", language: "en" }, units: [
      { title: "Mechanics", topics: [
        { title: "Newton's Laws and Forces", concepts: ["inertia", "F=ma", "action-reaction", "free body diagrams", "friction"], keyFormulas: ["F=ma", "W=mg", "f=μN"], keyFacts: ["Free body diagram: essential first step", "Net force = 0 ⟹ constant velocity or at rest"] },
        { title: "Work, Energy, Power", concepts: ["work", "kinetic energy", "potential energy", "conservation of energy", "power", "efficiency"], keyFormulas: ["W=Fs·cosθ", "KE=½mv²", "PE=mgh", "P=W/t=Fv", "η=useful/total"] }
      ]},
      { title: "Electricity", topics: [
        { title: "Electric Circuits", concepts: ["current", "voltage", "resistance", "Ohm's law", "Kirchhoff's laws", "series/parallel"], keyFormulas: ["V=IR", "P=IV=I²R=V²/R", "Series: R_total=R₁+R₂+...", "Parallel: 1/R_total=1/R₁+1/R₂+..."], keyFacts: ["Kirchhoff I: ΣI_in = ΣI_out (junction)", "Kirchhoff II: ΣV = 0 (loop)"] }
      ]}
    ]},
    american: { meta: { curriculumName: "US Physics 1/2 — Electricity", language: "en" }, units: [
      { title: "Electrostatics", topics: [
        { title: "Coulomb's Law and Electric Fields", concepts: ["charge", "Coulomb's law", "electric field", "field lines", "potential"], keyFormulas: ["F=kq₁q₂/r²", "E=F/q=kQ/r²", "V=kQ/r", "k=8.99×10⁹ N·m²/C²"] }
      ]},
      { title: "DC Circuits", topics: [
        { title: "Ohm's Law and Circuit Analysis", concepts: ["resistance", "current", "voltage", "power", "series", "parallel", "Kirchhoff"], keyFormulas: ["V=IR", "P=IV", "R_series=R₁+R₂", "1/R_par=1/R₁+1/R₂"] }
      ]}
    ]},
    uk: { meta: { curriculumName: "UK GCSE Physics — Electricity and Forces", language: "en" }, units: [
      { title: "Electricity", topics: [
        { title: "Circuit Fundamentals", concepts: ["current", "potential difference", "resistance", "Ohm's law", "I-V characteristics"], keyFormulas: ["V=IR", "P=IV", "E=Pt", "Q=It"], keyFacts: ["Ohmic conductor: straight line through origin", "Filament lamp: curved (resistance increases with temperature)"] }
      ]},
      { title: "Forces", topics: [
        { title: "Newton's Laws and Momentum", concepts: ["resultant force", "F=ma", "momentum", "conservation of momentum"], keyFormulas: ["F=ma", "p=mv", "F=Δp/Δt", "m₁u₁+m₂u₂=m₁v₁+m₂v₂"] }
      ]}
    ]},
    german: { meta: { curriculumName: "Gymnasium Klasse 10 — Physik", language: "de" }, units: [
      { title: "Optik", topics: [
        { title: "Brechung und Linsen", concepts: ["Brechungsgesetz", "Totalreflexion", "Sammellinse", "Zerstreuungslinse"], keyFormulas: ["n₁sinθ₁=n₂sinθ₂", "1/f=1/g+1/b"] }
      ]},
      { title: "Elektrizitätslehre", topics: [
        { title: "Grundgrößen und Schaltungen", concepts: ["Spannung", "Stromstärke", "Widerstand", "Reihen-/Parallelschaltung"], keyFormulas: ["U=R·I", "P=U·I", "R_ges=R₁+R₂ (Reihe)", "1/R_ges=1/R₁+1/R₂ (Parallel)"] }
      ]}
    ]},
    greek: { meta: { curriculumName: "Greek Lykeio B — Physics", language: "el" }, units: [
      { title: "Electromagnetism", topics: [
        { title: "Electric Fields and Circuits", concepts: ["Coulomb's law", "electric field", "Ohm's law", "Kirchhoff's laws"], keyFormulas: ["F=kq₁q₂/r²", "V=IR"] }
      ]}
    ]}
  },
  11: {
    albanian: { meta: { curriculumName: "Albanian MAS — Fizikë Klasa 11", language: "sq" }, units: [
      { title: "Elektrostatika", topics: [
        { title: "Ngarkesa dhe fusha elektrike", concepts: ["ngarkesa", "ligji i Kulonit", "fusha elektrike", "potenciali"], keyFormulas: ["F=kq₁q₂/r²", "E=F/q=kQ/r²", "V=kQ/r", "k=9×10⁹ N·m²/C²"] }
      ]},
      { title: "Qarqet elektrike", topics: [
        { title: "Ligji i Omit dhe Kirhofit", concepts: ["rryma", "tensioni", "rezistenca", "seria", "paraleli"], keyFormulas: ["V=IR", "P=IV=I²R", "R_tot=R₁+R₂ (seri)", "1/R_tot=1/R₁+1/R₂ (paralel)"] }
      ]},
      { title: "Magnetizmi", topics: [
        { title: "Fusha magnetike dhe induksioni", concepts: ["forca Lorenc", "induksioni elektromagnetik", "ligji i Faradeit"], keyFormulas: ["F=qvBsinθ", "F=BILsinθ", "ε=-dΦ/dt", "Φ=BA·cosθ"] }
      ]}
    ]},
    ib: { meta: { curriculumName: "IB Physics SL — Topics 6-8", language: "en" }, units: [
      { title: "Circular Motion and Gravitation", topics: [
        { title: "Uniform Circular Motion", concepts: ["centripetal acceleration", "centripetal force", "period"], keyFormulas: ["a=v²/r=ω²r", "F=mv²/r", "v=2πr/T", "ω=2π/T"] },
        { title: "Gravitational Fields", concepts: ["Newton's law of gravitation", "gravitational field strength", "orbital mechanics"], keyFormulas: ["F=GMm/r²", "g=GM/r²", "v_orbital=√(GM/r)", "T²=4π²r³/GM (Kepler III)"] }
      ]},
      { title: "Atomic and Nuclear Physics", topics: [
        { title: "Nuclear Reactions", concepts: ["mass-energy equivalence", "binding energy", "fission", "fusion", "radioactive decay"], keyFormulas: ["E=mc²", "N=N₀e^(-λt)", "t₁/₂=ln2/λ"], keyFacts: ["Fission: heavy nucleus splits → energy released", "Fusion: light nuclei combine → energy released", "Binding energy per nucleon: maximum at Fe-56 (most stable)"] }
      ]}
    ]},
    american: { meta: { curriculumName: "AP Physics 2", language: "en" }, units: [
      { title: "Electricity and Magnetism", topics: [
        { title: "Electrostatics and Gauss's Law", concepts: ["electric flux", "Gauss's law", "conductors", "capacitors"], keyFormulas: ["Φ=EA·cosθ", "Φ=Q_enc/ε₀ (Gauss)", "C=Q/V", "U=½CV²=½QV"] },
        { title: "Magnetic Fields", concepts: ["Lorentz force", "magnetic flux", "Faraday's law", "Lenz's law"], keyFormulas: ["F=qvBsinθ", "F=BIL", "ε=-NdΦ/dt"] }
      ]},
      { title: "Modern Physics", topics: [
        { title: "Quantum and Nuclear Physics", concepts: ["photoelectric effect", "photon energy", "de Broglie wavelength", "nuclear decay"], keyFormulas: ["E=hf", "λ=h/p=h/mv", "E=mc²", "KE_max=hf-φ"] }
      ]}
    ]},
    uk: { meta: { curriculumName: "UK A-Level Physics (Year 12)", language: "en" }, units: [
      { title: "Electricity", topics: [
        { title: "Advanced Circuits", concepts: ["EMF", "internal resistance", "potential divider"], keyFormulas: ["ε=I(R+r)", "V_out=V_in·R₂/(R₁+R₂)"] }
      ]},
      { title: "Waves and Optics", topics: [
        { title: "Interference and Diffraction", concepts: ["Young's double slit", "diffraction grating", "coherence"], keyFormulas: ["λ=ax/D (double slit)", "dsinθ=nλ (grating)"] }
      ]},
      { title: "Particle Physics", topics: [
        { title: "Standard Model", concepts: ["quarks", "leptons", "bosons", "hadrons", "conservation laws"], keyFacts: ["Up quark: +2/3e, Down quark: -1/3e", "Proton=uud, Neutron=udd", "Conservation: charge, baryon number, lepton number"] }
      ]}
    ]},
    german: { meta: { curriculumName: "Gymnasium Klasse 11 — Physik (Qualifikationsphase)", language: "de" }, units: [
      { title: "Elektromagnetismus", topics: [
        { title: "Elektrische und magnetische Felder", concepts: ["Coulomb-Kraft", "Feldlinien", "Lorentzkraft", "Induktion"], keyFormulas: ["F=kq₁q₂/r²", "F=qvB", "U_ind=-NdΦ/dt"] }
      ]}
    ]},
    greek: { meta: { curriculumName: "Greek Lykeio C — Physics", language: "el" }, units: [
      { title: "Oscillations and Waves", topics: [
        { title: "Simple Harmonic Motion", concepts: ["restoring force", "energy in SHM", "resonance"], keyFormulas: ["x=Asinωt", "v=Aωcosωt", "a=-ω²x", "T=2π/ω"] }
      ]},
      { title: "Electromagnetism", topics: [
        { title: "Faraday's Law and Applications", concepts: ["electromagnetic induction", "Lenz's law", "AC generator"], keyFormulas: ["ε=-dΦ/dt", "Φ=BAcosθ"] }
      ]}
    ]}
  },
  12: {
    albanian: { meta: { curriculumName: "Albanian MAS — Fizikë Klasa 12", language: "sq" }, units: [
      { title: "Fizika moderne", topics: [
        { title: "Efekti fotoelektrik", concepts: ["fotoni", "energjia e fotonit", "funksioni i daljes", "pragu i frekuencës"], keyFormulas: ["E=hf", "KE_max=hf-φ", "h=6.63×10⁻³⁴ J·s"], keyFacts: ["Drita sillet si grimcë (foton) në efektin fotoelektrik", "Einstein 1905: shpjegimi kuantik"] },
        { title: "Fizika bërthamore", concepts: ["fisioni", "fuzioni", "radioaktiviteti", "zbërthimi"], keyFormulas: ["E=mc²", "N=N₀e^(-λt)", "t₁/₂=ln2/λ"], keyFacts: ["Fisioni: bërthama e rëndë ndahet", "Fuzioni: bërthama të lehta bashkohen", "Energjia lidhëse për nukleon: maksimale te Fe-56"] }
      ]}
    ]},
    ib: { meta: { curriculumName: "IB Physics SL — Revision & Exam Prep", language: "en" }, units: [
      { title: "Full Syllabus Review", topics: [
        { title: "Core Topics 1-8 Review", concepts: ["mechanics", "thermal", "waves", "electricity", "circular motion", "nuclear"], keyFacts: ["Paper 1: 30 MC (45 min)", "Paper 2: structured questions (75 min)", "Paper 3: option + data-based (60 min)", "Data booklet provided"] }
      ]}
    ]},
    american: { meta: { curriculumName: "AP Physics C — Mechanics/E&M", language: "en" }, units: [
      { title: "Advanced Mechanics", topics: [
        { title: "Rotational Dynamics and Calculus-Based Mechanics", concepts: ["moment of inertia", "torque", "angular momentum", "oscillations"], keyFormulas: ["τ=Iα", "L=Iω", "KE=½Iω²", "I=∫r²dm"] }
      ]},
      { title: "Electromagnetism (Calculus)", topics: [
        { title: "Maxwell's Equations and Applications", concepts: ["Gauss's law", "Ampere's law", "Faraday's law", "displacement current"], keyFormulas: ["∮E·dA=Q/ε₀", "∮B·dl=μ₀I", "ε=-dΦ_B/dt"] }
      ]}
    ]},
    uk: { meta: { curriculumName: "UK A-Level Physics (Year 13)", language: "en" }, units: [
      { title: "Fields", topics: [
        { title: "Gravitational and Electric Fields", concepts: ["radial fields", "uniform fields", "potential", "field lines"], keyFormulas: ["g=GM/r²", "E=kQ/r²", "V_grav=-GM/r", "V_elec=kQ/r"] }
      ]},
      { title: "Nuclear Physics", topics: [
        { title: "Radioactivity and Nuclear Energy", concepts: ["alpha", "beta", "gamma", "half-life", "binding energy", "fission", "fusion"], keyFormulas: ["N=N₀e^(-λt)", "A=λN", "t₁/₂=ln2/λ", "E=mc²"] }
      ]}
    ]},
    german: { meta: { curriculumName: "Gymnasium Klasse 12 — Physik (Abitur)", language: "de" }, units: [
      { title: "Quantenphysik", topics: [
        { title: "Photoelektrischer Effekt und Materiewellen", concepts: ["Photon", "Photoeffekt", "de-Broglie-Wellenlänge", "Heisenberg"], keyFormulas: ["E=hf", "λ=h/p", "ΔxΔp≥h/4π"] }
      ]},
      { title: "Atomphysik", topics: [
        { title: "Bohr'sches Atommodell und Spektrallinien", concepts: ["Energieniveaus", "Emission", "Absorption", "Franck-Hertz"], keyFormulas: ["E_n=-13.6/n² eV", "ΔE=hf"] }
      ]}
    ]},
    greek: { meta: { curriculumName: "Πανελλαδικές — Φυσική", language: "el" }, units: [
      { title: "Oscillations (SHM)", topics: [
        { title: "Full SHM Analysis", concepts: ["spring", "pendulum", "energy", "resonance", "damping"], keyFormulas: ["x=Acosωt", "v=-Aωsinωt", "a=-ω²x", "E=½kA²", "T=2π√(m/k)"] }
      ]},
      { title: "Electromagnetic Induction", topics: [
        { title: "Faraday and Applications", concepts: ["flux", "EMF", "Lenz's law", "AC generator", "transformer"], keyFormulas: ["ε=-NdΦ/dt", "Φ=BAcosθ", "V₁/V₂=N₁/N₂"] }
      ]}
    ]}
  }
};

// ═══════════════════════════════════════════════════════════════════
// ECONOMICS CURRICULUM DATA
// ═══════════════════════════════════════════════════════════════════

const ECONOMICS = {
  9: {
    albanian: { meta: { curriculumName: "Albanian MAS — Ekonomi Klasa 9", language: "sq" }, units: [
      { title: "Hyrje në ekonomi", topics: [
        { title: "Problemi ekonomik", concepts: ["mungesa", "zgjedhja", "kosto oportune", "sisteme ekonomike"], definitions: {"Mungesa": "Burimet janë të kufizuara ndërsa nevojat janë të pakufizuara", "Kosto oportune": "Vlera e alternativës më të mirë të hequr dorë", "PPF": "Kufiri i mundësive të prodhimit — tregon kombinimet maksimale"}, keyFacts: ["Ekonomia e tregut: vendime nga tregu (ashku i padukshëm)", "Ekonomia e planifikuar: vendime nga shteti", "Ekonomia e përzier: kombinim i të dyjave (shumica e vendeve sot)"] },
        { title: "Kërkesa dhe oferta", concepts: ["ligji i kërkesës", "ligji i ofertës", "ekuilibri", "teprica", "mungesa"], keyFacts: ["Kërkesa rritet → kurbës zhvendoset djathtas → çmimi rritet", "Oferta rritet → kurbës zhvendoset djathtas → çmimi bie", "Ekuilibri: sasia e kërkuar = sasia e ofruar"], keyFormulas: ["Use /graph supply-demand to visualize!"] }
      ]}
    ]},
    ib: { meta: { curriculumName: "IB Economics SL — Unit 1: Microeconomics Intro", language: "en" }, units: [
      { title: "Introduction to Economics", topics: [
        { title: "The Economic Problem", concepts: ["scarcity", "choice", "opportunity cost", "factors of production", "PPF"], definitions: {"Scarcity": "Unlimited wants exceed limited resources", "Opportunity cost": "The next best alternative forgone", "PPF": "Shows maximum combinations of two goods that can be produced with existing resources"}, keyFacts: ["Inside PPF: inefficient", "On PPF: efficient", "Outside PPF: unattainable with current resources", "Factors of production: Land, Labour, Capital, Enterprise"] },
        { title: "Demand and Supply", concepts: ["law of demand", "law of supply", "equilibrium", "shortage", "surplus", "price mechanism", "consumer/producer surplus"], keyFacts: ["Demand curve: downward sloping (inverse price-quantity relationship)", "Supply curve: upward sloping (direct price-quantity relationship)", "Equilibrium: Qd = Qs", "Consumer surplus: area above price, below demand curve", "Producer surplus: area below price, above supply curve"] }
      ]}
    ]},
    american: { meta: { curriculumName: "US Economics — Introduction", language: "en" }, units: [
      { title: "Fundamentals of Economics", topics: [
        { title: "Economic Systems", concepts: ["market economy", "command economy", "mixed economy", "invisible hand", "circular flow"], keyFacts: ["Adam Smith's invisible hand: self-interest leads to social benefit in free markets", "Circular flow: households provide factors, firms provide goods/services"] },
        { title: "Supply and Demand Basics", concepts: ["demand schedule", "supply schedule", "equilibrium price", "shifts vs movements"], keyFacts: ["Change in PRICE: movement along curve", "Change in other factors (income, tastes): shift of curve"] }
      ]}
    ]},
    uk: { meta: { curriculumName: "UK GCSE Economics — Theme 1", language: "en" }, units: [
      { title: "Introduction", topics: [
        { title: "Basic Economic Problem", concepts: ["scarcity", "opportunity cost", "economic agents", "specialisation"], keyFacts: ["Specialisation increases productivity but creates interdependence", "Trade allows countries to consume beyond their PPF"] }
      ]}
    ]},
    german: { meta: { curriculumName: "Gymnasium Klasse 9 — Wirtschaft/Politik", language: "de" }, units: [
      { title: "Grundlagen der Wirtschaft", topics: [
        { title: "Das ökonomische Prinzip", concepts: ["Maximalprinzip", "Minimalprinzip", "Knappheit", "Opportunitätskosten"], definitions: {"Maximalprinzip": "Mit gegebenen Mitteln maximalen Ertrag erzielen", "Minimalprinzip": "Ein gegebenes Ziel mit minimalem Mitteleinsatz erreichen"} }
      ]}
    ]},
    greek: { meta: { curriculumName: "Greek Lykeio — Αρχές Οικονομίας", language: "el" }, units: [
      { title: "Introduction to Economics", topics: [
        { title: "Basic Economic Concepts", concepts: ["scarcity", "production possibilities", "economic systems"], keyFacts: ["Greek curriculum introduces circular flow and basic market mechanism"] }
      ]}
    ]}
  },
  10: {
    albanian: { meta: { curriculumName: "Albanian MAS — Ekonomi Klasa 10 (Mikroekonomi)", language: "sq" }, units: [
      { title: "Mikroekonomia", topics: [
        { title: "Elasticiteti", concepts: ["elasticiteti i çmimit", "elasticiteti i të ardhurës", "elasticiteti kryq"], keyFormulas: ["PED = %ΔQd / %ΔP", "YED = %ΔQd / %ΔY", "XED = %ΔQd_A / %ΔP_B"], keyFacts: ["|PED|>1: elastike (luksoze)", "|PED|<1: joelastike (domosdoshmëri)", "|PED|=1: njësi elastike", "YED>0: mall normal, YED<0: mall inferior"] },
        { title: "Strukturat e tregut", concepts: ["konkurrenca e plotë", "monopoli", "oligopoli", "konkurrenca monopolistike"], keyFacts: ["Konkurrenca e plotë: shumë firma, produkt identik, çmimmarrëse", "Monopoli: një firmë, barriera hyrjeje, çmimvendosëse", "Oligopoli: pak firma dominante, ndërvarësi strategjike"] },
        { title: "Dështimet e tregut", concepts: ["eksternalitete", "të mira publike", "informacion asimetrik", "ndërhyrja e qeverisë"], keyFacts: ["Eksternalitet negativ: kosto sociale > kosto private (ndotja)", "Eksternalitet pozitiv: përfitim social > përfitim privat (arsimi)", "Të mira publike: jo-përjashtuese dhe jo-rivale"] }
      ]}
    ]},
    ib: { meta: { curriculumName: "IB Economics SL — Unit 1: Microeconomics", language: "en" }, units: [
      { title: "Microeconomics", topics: [
        { title: "Elasticity", concepts: ["PED", "YED", "XED", "PES", "tax incidence"], keyFormulas: ["PED = %ΔQd/%ΔP", "PES = %ΔQs/%ΔP"], keyFacts: ["Elastic demand: PED > 1 (luxury goods)", "Inelastic demand: PED < 1 (necessities, addictive goods)", "Perfectly elastic: horizontal demand curve", "Perfectly inelastic: vertical demand curve", "Tax burden falls more on inelastic side"] },
        { title: "Market Failure", concepts: ["externalities", "public goods", "merit goods", "demerit goods", "common pool resources"], keyFacts: ["MSC = MPC + MEC (negative externality)", "MSB = MPB + MEB (positive externality)", "Optimal output: MSC = MSB", "Government: taxes (Pigouvian), subsidies, regulation, cap-and-trade"] },
        { title: "Government Intervention", concepts: ["price ceiling", "price floor", "indirect tax", "subsidy", "regulation"], keyFacts: ["Price ceiling below equilibrium → shortage", "Price floor above equilibrium → surplus", "Indirect tax: shifts supply left → higher price, lower quantity, deadweight loss"] }
      ]}
    ]},
    american: { meta: { curriculumName: "US AP Microeconomics", language: "en" }, units: [
      { title: "AP Microeconomics", topics: [
        { title: "Consumer and Producer Theory", concepts: ["utility maximization", "marginal utility", "budget constraint", "production function", "costs"], keyFormulas: ["MU/P should be equal across goods (utility max)", "MC = ΔTC/ΔQ", "ATC = TC/Q", "Profit = TR - TC"], keyFacts: ["Diminishing marginal returns: MP eventually decreases as input increases", "Profit maximization: MR = MC"] },
        { title: "Market Structures", concepts: ["perfect competition", "monopoly", "monopolistic competition", "oligopoly"], keyFacts: ["Perfect competition: P=MR=AR, long-run: P=min ATC (zero economic profit)", "Monopoly: P>MR, produces where MR=MC, deadweight loss", "Oligopoly: game theory, Nash equilibrium, prisoner's dilemma"] }
      ]}
    ]},
    uk: { meta: { curriculumName: "UK A-Level Economics — Microeconomics", language: "en" }, units: [
      { title: "Microeconomics", topics: [
        { title: "Elasticity and Market Failure", concepts: ["PED", "YED", "XED", "PES", "externalities", "public goods"], keyFormulas: ["PED = %ΔQd/%ΔP"], keyFacts: ["UK exams heavily test diagram analysis and evaluation", "Always consider government failure when discussing intervention"] }
      ]}
    ]},
    german: { meta: { curriculumName: "Gymnasium Klasse 10 — Wirtschaft", language: "de" }, units: [
      { title: "Markt und Preis", topics: [
        { title: "Marktmechanismus", concepts: ["Angebot", "Nachfrage", "Gleichgewichtspreis", "Marktversagen"], keyFacts: ["Preismechanismus: unsichtbare Hand koordiniert Ressourcenallokation", "Externe Effekte führen zu Marktversagen"] }
      ]}
    ]},
    greek: { meta: { curriculumName: "Greek Lykeio — Μικροοικονομία", language: "el" }, units: [
      { title: "Microeconomics", topics: [
        { title: "Market Structures and Efficiency", concepts: ["perfect competition", "monopoly", "elasticity"], keyFacts: ["Greek curriculum focuses on mathematical derivation of equilibrium"] }
      ]}
    ]}
  },
  11: {
    albanian: { meta: { curriculumName: "Albanian MAS — Ekonomi Klasa 11 (Makroekonomi)", language: "sq" }, units: [
      { title: "Makroekonomia", topics: [
        { title: "GDP dhe të ardhurat kombëtare", concepts: ["GDP", "GNP", "GDP nominal vs real", "deflatori"], keyFormulas: ["GDP = C + I + G + (X-M)", "GDP real = GDP nominal / Deflatori × 100"], keyFacts: ["GDP mat vlerën e mallrave dhe shërbimeve finale", "GDP real eliminon efektin e inflacionit", "Use /graph gdp to calculate components!"] },
        { title: "Papunësia", concepts: ["shkalla e papunësisë", "lloje: frikcionare, strukturore, ciklike"], keyFormulas: ["Shkalla = (Të papunë / Forca punëtore) × 100"], keyFacts: ["Papunësia frikcionare: kalimtare, e shëndetshme", "Papunësia strukturore: ndryshime teknologjike", "Papunësia ciklike: rënie ekonomike"] },
        { title: "Inflacioni", concepts: ["CPI", "inflacion i kërkesës", "inflacion i kostove", "kurba e Filipsit"], keyFormulas: ["CPI = (Kosto korente / Kosto e vitit bazë) × 100", "Shkalla e inflacionit = ((CPI_new - CPI_old)/CPI_old) × 100"], keyFacts: ["Use /graph inflation to calculate CPI!", "Inflacioni i kërkesës: shumë para ndjekin pak mallra", "Inflacioni i kostove: rritja e kostove të prodhimit"] },
        { title: "Modeli AD-AS", concepts: ["kërkesa agregate", "oferta agregate afatshkurtër", "oferta agregate afatgjatë", "hendeku recesionar", "hendeku inflacionar"], keyFacts: ["AD zhvendoset djathtas: rritje ekonomike + inflacion", "SRAS zhvendoset majtas: stagflacion", "LRAS vertikale: prodhimi potencial", "Use /graph adas to simulate!"] }
      ]}
    ]},
    ib: { meta: { curriculumName: "IB Economics SL — Unit 2: Macroeconomics", language: "en" }, units: [
      { title: "Macroeconomics", topics: [
        { title: "GDP and Economic Activity", concepts: ["GDP", "GNI", "real vs nominal", "GDP per capita", "green GDP"], keyFormulas: ["GDP = C+I+G+(X-M)"], keyFacts: ["GDP limitations: ignores inequality, informal economy, externalities, non-market activity"] },
        { title: "AD-AS Model", concepts: ["aggregate demand", "short-run aggregate supply", "long-run aggregate supply", "Keynesian vs monetarist"], keyFacts: ["AD shifts: C, I, G, NX changes", "SRAS shifts: input costs, productivity, exchange rate", "LRAS shifts: technology, labour force, capital stock", "Full employment: AD intersects LRAS"] },
        { title: "Fiscal and Monetary Policy", concepts: ["expansionary fiscal", "contractionary fiscal", "interest rates", "money supply", "quantitative easing"], keyFacts: ["Fiscal: government changes G or T", "Monetary: central bank changes interest rates or money supply", "Multiplier effect: ΔY = k × ΔG where k = 1/(1-MPC)", "Time lags limit policy effectiveness"] },
        { title: "Unemployment and Inflation", concepts: ["natural rate of unemployment", "Phillips curve", "demand-pull", "cost-push", "deflation"], keyFormulas: ["Unemployment rate = (Unemployed/Labour force) × 100"], keyFacts: ["Short-run Phillips curve: inverse relationship between inflation and unemployment", "Long-run: vertical at natural rate (expectations-augmented Phillips curve)"] }
      ]}
    ]},
    american: { meta: { curriculumName: "US AP Macroeconomics", language: "en" }, units: [
      { title: "AP Macroeconomics", topics: [
        { title: "National Income Accounting", concepts: ["GDP calculation methods", "expenditure approach", "income approach"], keyFormulas: ["GDP = C+I+G+NX", "Real GDP = Nominal GDP / Price level × 100"], keyFacts: ["Expenditure approach: most common on AP exam", "Transfer payments NOT included in G"] },
        { title: "Money, Banking, and Monetary Policy", concepts: ["money multiplier", "Federal Reserve", "open market operations", "discount rate", "reserve requirement"], keyFormulas: ["Money multiplier = 1/rr", "ΔM = ΔD × (1/rr)"], keyFacts: ["Fed buys bonds → money supply ↑ → interest rate ↓ → investment ↑ → AD ↑", "Quantity theory: MV = PY"] },
        { title: "International Trade and Finance", concepts: ["comparative advantage", "balance of payments", "exchange rates", "capital flows"], keyFormulas: ["Terms of trade", "Real exchange rate = e × (P*/P)"], keyFacts: ["Current account + Capital account = 0 (in theory)", "Currency appreciation: imports cheaper, exports more expensive"] }
      ]}
    ]},
    uk: { meta: { curriculumName: "UK A-Level Economics — Macroeconomics", language: "en" }, units: [
      { title: "Macroeconomics", topics: [
        { title: "Economic Performance and Policy", concepts: ["GDP", "inflation", "unemployment", "BoP", "fiscal policy", "monetary policy", "supply-side"], keyFacts: ["UK exams want EVALUATION: advantages AND limitations of each policy", "Always mention time lags, crowding out, government failure"] }
      ]}
    ]},
    german: { meta: { curriculumName: "Gymnasium Klasse 11 — VWL (Makroökonomie)", language: "de" }, units: [
      { title: "Makroökonomie", topics: [
        { title: "BIP und Konjunktur", concepts: ["BIP", "Konjunkturzyklus", "Wirtschaftswachstum", "Rezession"], keyFormulas: ["BIP = C+I+G+(X-M)"], keyFacts: ["Konjunkturphasen: Aufschwung, Hochkonjunktur, Abschwung, Depression"] },
        { title: "Geldpolitik der EZB", concepts: ["Leitzins", "Geldmenge", "Inflation", "Deflation"], keyFacts: ["EZB-Ziel: Preisstabilität, nahe 2%", "Leitzinssenkung → billige Kredite → mehr Investition → AD↑"] }
      ]}
    ]},
    greek: { meta: { curriculumName: "Greek Lykeio — Μακροοικονομία", language: "el" }, units: [
      { title: "Macroeconomics", topics: [
        { title: "National Income and AD-AS", concepts: ["GDP", "multiplier", "fiscal policy", "monetary policy"], keyFormulas: ["Y=C+I+G+NX", "Multiplier=1/(1-MPC)"] }
      ]}
    ]}
  },
  12: {
    albanian: { meta: { curriculumName: "Albanian MAS — Ekonomi Klasa 12 (Int'l & Albania)", language: "sq" }, units: [
      { title: "Ekonomia ndërkombëtare dhe Shqipëria", topics: [
        { title: "Tregtia ndërkombëtare", concepts: ["avantazhi krahasues", "bilanci i pagesave", "kursi i këmbimit", "proteksionizmi"], keyFacts: ["Shqipëria: eksporton tekstile, mbathje, materiale ndërtimi", "Remitancat: ~10% e GDP (diaspora në Itali, Greqi)", "Procesi i integrimit në BE: kapitulli i negociatave"] },
        { title: "Zhvillimi ekonomik", concepts: ["GDP per capita", "HDI", "varfëria", "pabarazia", "FDI", "turizmi"], keyFacts: ["INSTAT: Instituti i Statistikave", "Banka e Shqipërisë: banka qendrore", "Sfidat: ekonomia informale, korrupcioni, emigracioni i trurit", "Turizmi: sektor në rritje, bregdeti, trashëgimia kulturore"] }
      ]}
    ]},
    ib: { meta: { curriculumName: "IB Economics SL — Units 3-4: International & Development", language: "en" }, units: [
      { title: "International Economics", topics: [
        { title: "Trade Theory and Policy", concepts: ["absolute advantage", "comparative advantage", "terms of trade", "WTO", "trade blocs", "protectionism"], keyFacts: ["Comparative advantage: produce where opportunity cost is lowest", "Protectionism tools: tariffs, quotas, subsidies, administrative barriers", "Free trade area vs customs union vs common market vs economic union"] },
        { title: "Exchange Rates", concepts: ["floating", "fixed", "managed float", "appreciation", "depreciation"], keyFacts: ["Appreciation: currency strengthens → imports cheaper, exports expensive → current account worsens", "Depreciation: opposite effect", "Marshall-Lerner condition: devaluation improves BoP if PED_x + PED_m > 1", "J-curve effect: BoP worsens before improving after depreciation"] }
      ]},
      { title: "Development Economics", topics: [
        { title: "Economic Development", concepts: ["HDI", "GNI per capita", "sustainability", "poverty trap", "foreign aid", "microfinance"], keyFacts: ["Development ≠ Growth: development includes human well-being", "HDI: life expectancy, education, GNI per capita", "Barriers: institutional, geographical, historical (colonial legacy)", "Strategies: import substitution vs export promotion, FDI, aid, trade"] }
      ]}
    ]},
    american: { meta: { curriculumName: "US AP Economics — Review & International", language: "en" }, units: [
      { title: "International Economics & Review", topics: [
        { title: "Trade and Finance", concepts: ["comparative advantage", "tariffs", "exchange rates"], keyFacts: ["AP exam: draw graphs for tariff analysis showing deadweight loss", "Know the difference between financial account and current account"] },
        { title: "Full AP Review", concepts: ["all micro + macro topics"], keyFacts: ["AP Micro: 60 MC + 3 FRQ", "AP Macro: 60 MC + 3 FRQ", "Graph drawing is essential for FRQ full marks"] }
      ]}
    ]},
    uk: { meta: { curriculumName: "UK A-Level Economics — Year 13", language: "en" }, units: [
      { title: "Global Economics", topics: [
        { title: "Globalisation, Trade and Development", concepts: ["globalisation", "trade liberalisation", "development indicators", "poverty", "inequality"], keyFacts: ["UK exam: evaluation is key — always discuss limitations, unintended consequences", "Discuss developed vs developing country perspectives"] }
      ]}
    ]},
    german: { meta: { curriculumName: "Gymnasium Klasse 12 — VWL (International)", language: "de" }, units: [
      { title: "Internationale Wirtschaftsbeziehungen", topics: [
        { title: "Außenhandel und Globalisierung", concepts: ["komparativer Vorteil", "EU-Binnenmarkt", "Wechselkurse", "Handelspolitik"], keyFacts: ["EU-Binnenmarkt: Freier Verkehr von Waren, Dienstleistungen, Kapital, Personen", "Euro: gemeinsame Währung, EZB-Geldpolitik"] }
      ]}
    ]},
    greek: { meta: { curriculumName: "Greek — International Economics & Review", language: "el" }, units: [
      { title: "International Economics", topics: [
        { title: "Trade and Development", concepts: ["comparative advantage", "balance of payments", "exchange rates"], keyFacts: ["Greek curriculum: emphasis on EU integration and eurozone economics"] }
      ]}
    ]}
  }
};

// ═══════════════════════════════════════════════════════════════════
// GENERATE FILES
// ═══════════════════════════════════════════════════════════════════

function writePack(grade, subject, curriculum, data) {
  const dir = path.join(BASE, `grade-${grade}`, subject);
  fs.mkdirSync(dir, { recursive: true });
  
  const pack = {
    meta: {
      grade,
      subject,
      curriculum,
      ...data.meta,
      version: "2024"
    },
    units: data.units || [],
    examFormat: data.examFormat || null
  };
  
  const filePath = path.join(dir, `${curriculum}.json`);
  fs.writeFileSync(filePath, JSON.stringify(pack, null, 2));
  console.log(`  ✅ ${filePath}`);
}

console.log('\n📚 Generating all curriculum packs...\n');

let count = 0;

// Math packs
for (const [grade, curricula] of Object.entries(MATH)) {
  for (const [curriculum, data] of Object.entries(curricula)) {
    writePack(parseInt(grade), 'math', curriculum, data);
    count++;
  }
}

// Physics packs
for (const [grade, curricula] of Object.entries(PHYSICS)) {
  for (const [curriculum, data] of Object.entries(curricula)) {
    writePack(parseInt(grade), 'physics', curriculum, data);
    count++;
  }
}

// Economics packs
for (const [grade, curricula] of Object.entries(ECONOMICS)) {
  for (const [curriculum, data] of Object.entries(curricula)) {
    writePack(parseInt(grade), 'economics', curriculum, data);
    count++;
  }
}

console.log(`\n✅ Generated ${count} curriculum packs!`);
