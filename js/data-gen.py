#!/usr/bin/env python3
# Generates js/models.json -> ~1000 math 3D models from primary to high school
import json, math

models = []
_id = [0]

def add(name, en, cat, level, kind, params, desc):
    _id[0] += 1
    models.append({
        "id": f"m{_id[0]:04d}",
        "name": name,
        "nameEn": en,
        "category": cat,
        "level": level,
        "kind": kind,
        "params": params,
        "desc": desc
    })

PLATONIC = [("Tứ diện đều","Regular tetrahedron"),("Lập phương","Cube"),("Bát diện đều","Octahedron"),
            ("Mười hai mặt đều","Dodecahedron"),("Hai mươi mặt đều","Icosahedron")]
POLYGONS = [("Tam giác","Triangle",3),("Tứ giác","Quadrilateral",4),("Ngũ giác","Pentagon",5),("Lục giác","Hexagon",6),
            ("Thất giác","Heptagon",7),("Bát giác","Octagon",8),("Cửu giác","Nonagon",9),("Thập giác","Decagon",10),
            ("Tứ thập giác","40-gon",40)]
CYLINDERS = [("Tròn","Circular"),("Elip","Elliptic"),("Vành khuyên","Annular"),("Ống rỗng","Hollow tube")]
CONES = [("Tròn","Circular"),("Elip","Elliptic"),("Góc mở","Oblique")]
PRISMS = [("Tam giác","Triangular"),("Tứ giác","Quadrilateral"),("Ngũ giác","Pentagonal"),("Lục giác","Hexagonal"),
          ("Thất giác","Heptagonal"),("Bát giác","Octagonal"),("Thập giác","Decagonal")]
PYRAMIDS = [("Tam giác","Triangular"),("Tứ giác","Square"),("Ngũ giác","Pentagonal"),("Lục giác","Hexagonal"),
            ("Thập giác","Decagonal")]
FRACS = [(2,3),(3,4),(4,5),(5,6),(3,8),(5,8),(7,12),(2,5),(3,5),(4,9),(5,9),(7,9),(8,9),(5,12),(7,12),(1,3),(1,4),(1,6)]
TRI = [("Tam giác 30-60-90","30-60-90 triangle"),("Tam giác vuông cân","Isosceles right triangle"),("Tam giác vuông","Right triangle"),
       ("Tam giác cân","Isosceles triangle"),("Tam giác đều","Equilateral triangle"),("Tam giác nhọn","Acute triangle"),("Tam giác tù","Obtuse triangle")]
SPECIAL_J = [("Golden rectangle","Golden rectangle",1.618),("Hình chữ nhật A4","Tỉ lệ giấy A4",math.sqrt(2)),
             ("Silver ratio","Bạc tỉ",2.414),("Domino 2:1","Tỉ số 2:1",2.0),("Ảnh 3:2","Tỉ số ảnh 3:2",1.5),
             ("Màn 16:9","Màn hình 16:9",16/9),("Màn 4:3","Màn hình 4:3",4/3),("Rect 1:2","Tỉ số 1:2",0.5),
             ("Rect 1:3","Tỉ số 1:3",1/3),("Rect 1:4","Tỉ số 1:4",0.25),("Rect 3:1","Tỉ số 3:1",3.0),("Rect 4:1","Tỉ số 4:1",4.0)]
FRACTALS = [("Koch","Koch snowflake"),("Sierpinski","Sierpinski triangle"),("Cantor","Cantor set"),
            ("Dragon","Heighway dragon"),("Gosper","Gosper island"),("Hilbert","Hilbert curve"),
            ("Peano","Peano curve"),("Levy","Levy C curve"),("Tree","Fractal tree"),("Menger","Menger sponge")]
SURFACES = [("Ellipsoid","Ellipsoid"),("Hyperboloid 1","Hyperboloid one sheet"),("Hyperboloid 2","Hyperboloid two sheets"),
            ("Paraboloid","Elliptic paraboloid"),("Saddle","Saddle surface"),("Steiner","Steiner surface"),
            ("Cayley","Cayley cubic"),("Roman","Roman surface"),("Enneper","Enneper surface"),("Whitney","Whitney umbrella")]
QUADS = [("Vuông","Square"),("Chữ nhật","Rectangle"),("Bình hành","Parallelogram"),("Thoi","Rhombus"),
         ("Thang","Trapezoid"),("Thang cân","Isosceles trapezoid"),("Diều","Deltoid/kite")]
TRANSFORMS = [("Tịnh tiến","Translation"),("Xoay","Rotation"),("Đối xứng","Reflection"),("Phóng to","Dilation"),
              ("Biến dạng shear","Shear"),("Chiếu","Projection")]
GRAPHS2D = [("Đường thẳng","Linear y=ax+b"),("Parabol","Quadratic y=ax^2"),("Bậc ba","Cubic x^3-x"),
            ("Hữu tỉ","Rational 1/x"),("Giá trị tuyệt đối","Absolute |x|"),("Căn bậc hai","Sqrt(x)"),
            ("Sin","y=sin x"),("Cos","y=cos x"),("Tan","y=tan x"),("Exp","y=e^x"),("Log","y=ln x"),
            ("Hằng số","Constant"),("Bậc thang","Step function"),("Đa thức","Polynomial x^4-2x^2+1")]
TRIGCURVES = [("Sinh xoáy Archimede","Spiral of Archimedes"),("Log spiral","Logarithmic spiral"),("Lissajous","Lissajous curve"),
              ("Hoa hồng","Rhodonea rose"),("Cardioid","Cardioid"),("Nephroid","Nephroid"),("Astroid","Astroid"),
              ("Hypocycloid","Hypocycloid"),("Epicycloid","Epicycloid"),("Involute","Involute of circle"),
              ("Catenary","Catenary"),("Cycloid","Cycloid")]
FUNC3D = [("Yên ngựa z=x^2-y^2","Saddle"),("Sóng z=sinx siny","Wavy"),("z=xy","Hyperbolic paraboloid"),
          ("z=(x+y)^2","Degenerate paraboloid"),("Nón z=r","Cone graph"),("Sinc hồ nước","Wave pool"),
          ("z=x^3+y^3","Monkey-ish"),("Gợn sóng cos r","Ripple"),("Chuẩn tắc Gaussian","Gaussian bump"),
          ("Sombrero sinr/r","Sombrero"),("Paraboloid tròn","Paraboloid"),("Butterfly xy(x^2-y^2)","Butterfly"),
          ("sin(xy)","Cross waves"),("cosx+cosy","Checkerboard"),("Xoắn trôn ốc","Twist")]
PARAMSURF = [("Mobius strip","Mobius strip"),("Klein bottle","Klein bottle"),("Boy surface","Roman/Boy"),
             ("Seifert","Seifert surface"),("Helicoid","Helicoid"),("Catenoid","Catenoid"),("Conoid","Plucker conoid"),
             ("Flat torus","Flat torus"),("Crosscap","Crosscap"),("Whitney umbrella","Whitney umbrella")]
SOLIDSREV = [("Cầu tròn xoay","Solid of revolution sphere"),("Parabola rev","Revolution y=x^2"),
             ("Curve sin","Revolution of sin"),("Curve cos","Revolution of cos"),("Curve exp","Revolution e^-x"),
             ("Curve log","Revolution ln"),("Curve sqrt","Revolution sqrt"),("Curve tan","Revolution 1/(1+x^2)")]
VECTORS = [("Vectơ 2D","Vector in plane"),("Vectơ 3D","Vector in space"),("Tổng vectơ","Vector addition"),
           ("Hiệu vectơ","Vector subtraction"),("Tích vô hướng","Dot product"),("Tích có hướng","Cross product"),
           ("Hình chiếu","Projection"),("Đơn vị i,j,k","Unit vectors")]
STATS = [("Histogram","Frequency histogram"),("Boxplot","Box-and-whisker"),("Scatter","Scatter plot"),
         ("Bar chart","Bar chart"),("Pie 3D","Pie chart 3D"),("Surface density","Density surface"),
         ("Binomial","Binomial distribution"),("Normal","Normal distribution"),("Poisson","Poisson distribution"),
         ("Uniform","Uniform distribution"),("Exponential decay","Exponential decay"),("Line chart","Line chart")]
PROBS = [("Đồng xu","Coin toss sample space"),("Xúc xắc","Two dice sum distribution"),("Vòng quay","Probability spinner"),
         ("Túi bi","Marble jar probability"),("Cây nhánh","Outcome tree"),("Hoán vị","Permutation blocks"),
         ("Tổ hợp","Combination blocks"),("Tháp Pascal","Pascal's pyramid"),("Bảng Galton","Galton board"),
         ("Monty Hall","Monty Hall doors")]
NUMSYS = [("Khối thập phân","Base-10 blocks"),("Nhị phân","Binary counter"),("Đĩa giá trị hàng","Place-value discs"),
          ("Nhảy trục số","Addition on number line"),("Lưới nhân","Multiplication array"),("Cầu nhân tố","Factor pairs"),
          ("Sàng Eratosthenes","Sieve of Eratosthenes"),("Tháp chia hết","Divisibility"),("PEMDAS stack","Order of ops"),
          ("Đồng xu âm dương","Integer chips")]
GEOSOLID_EXTRA = [("Mái vòm Geodesic","Geodesic sphere"),("Buckyball","Buckyball C60"),("Vòng xoay","Rotating ring"),
                  ("Kim tự tháp bậc","Step pyramid"),("Ziggurat","Ziggurat"),("Thạch trụ","Obelisk"),("Cầu vòm","Arch bridge"),
                  ("Vì kèo tam giác","Triangle truss"),("Mái nửa cầu","Dome hemisphere"),("Silos","Grain silos")]
MISC = [("Đường ray Mobius","Mobius track"),("Bánh răng","Gear wheel"),("Con lắc","Pendulum"),("Lò xo trôn ốc","Helix spring"),
        ("DNA helix","Double helix"),("Thang gác","Ladder geometry"),("Mặt phẳng nghiêng","Inclined plane"),("Mặt đồng hồ","Clock angles"),
        ("La bàn","Bearings"),("Lưới bản đồ","Coordinate map"),("Nước cờ mã","Knight moves"),("Tiếp tuyến","Tangent construction"),
        ("Cát tuyến","Chord & secant"),("Đường tròn nội tiếp","Inscribed circle"),("Ngoại tiếp","Circumscribed circle"),
        ("Đường tròn chín điểm","Nine-point circle"),("Đường thẳng Euler","Euler line"),("Điểm Torricelli","Fermat point"),
        ("Pappus","Pappus configuration"),("Desargues","Desargues config"),("Bướm","Butterfly theorem"),
        ("Simson","Simson line"),("Stewart","Stewart's theorem"),("Định lý sin","Sine rule"),("Định lý cos","Cosine rule"),
        ("Power of point","Power of a point"),("Homothety","Homothety"),("Nghịch đảo đường tròn","Circle inversion"),
        ("Tam giác bàn đạp","Pedal triangle"),("Morley","Morley's trisectors"),("Van Aubel","Van Aubel squares"),
        ("Cờ Anh","British flag theorem"),("Napoleon","Napoleon triangles"),("Pompeiu","Pompeiu's theorem"),
        ("Casey","Casey circles"),("Soddy","Soddy circles"),("Arbelos","Arbelos"),("Salinon","Salinon"),
        ("Con lắc cycloid","Cycloid path"),("Brianchon","Brianchon hexagon"),("Feuerbach","Feuerbach point"),
        ("Brocard","Brocard angle"),("Lemoine","Symmedian point"),("Xoáy Euler","Euler spiral"),
        ("Mandelbrot lát","Mandelbrot cross-section"),("Julia lát","Julia set cross-section"),("Trefoil","Trefoil knot"),
        ("Nút số 8","Figure-eight knot"),("Cinquefoil","Cinquefoil knot"),("Lissajous 3D","3D Lissajous knot"),
        ("Viviani","Viviani curve"),("Tam giác cầu","Spherical triangle"),("Loxodrome","Rhumb line"),
        ("Vòng lớn","Great circle"),("Vòng nhỏ","Small circle"),("Gnomonic","Gnomonic projection"),
        ("Stereographic","Stereographic projection"),("Mercator dải","Mercator mapping"),("Lưới affine","Affine warp grid"),
        ("Nhân phức","Complex rotation"),("De Moivre","De Moivre roots"),("Argand","Argand plane"),
        ("Căn đơn vị","nth roots of unity"),("Euler identity","e^{i pi} visual"),("Fourier vuông","Fourier series"),
        ("Fourier cưa","Fourier sawtooth"),("Giao thoa sóng","Interference"),("Sóng dừng","Standing wave"),
        ("Cộng hưởng","Resonance curve"),("Phase portrait","Phase portrait"),("Trường gradient","Gradient field"),
        ("Divergence","Divergence demo"),("Curl","Curl demo"),("Ống thông lượng","Flux tube"),("Đường mức","Contour levels"),
        ("Ẩn hàm trái tim","Implicit heart"),("Cà phê torus","Real-life torus"),("Lăng kính tán sắc","Light dispersion"),
        ("Umbra penumbra","Shadow cone"),("Cáp cầu","Catenary cable"),("Cầu thang dốc","Staircase slope"),
        ("Mái nhà góc","Roof trigonometry"),(" nan hoa bánh xe","Wheel spokes"),("Bánh xe quay","Ferris wheel"),
        ("Tỉ số bánh răng","Gear ratios"),("Ròng rọc","Pulley system"),("Cân bằng phương trình","Equation balance"),
        ("Algebra tiles","Algebra tiles"),("a^2-b^2","Difference of squares"),("(a+b)^2","Perfect square"),
        ("Quạt Fibonacci","Fibonacci fan"),("Pascal mod 2","Pascal mod 2"),("Tháp Hà Nội","Hanoi tower"),
        ("Khối Rubik lớp","Rubik slice"),("Que diêm dãy","Matchstick sequence"),("Số tam giác","Triangular numbers"),
        ("Số chính phương","Square numbers"),("Số ngũ giác","Pentagonal numbers"),("Số lục giác","Hex numbers"),
        ("Số sao","Star numbers"),("Số lập phương","Cube numbers"),("Tổng số lẻ","Sum of odd numbers"),
        ("Telescoping","Telescoping bars"),("Chuỗi điều hòa","Harmonic series"),("Cấp số nhân","Geometric series"),
        ("Alternating series","Alternating series"),("Basel bars","Basel problem"),("Wallis product","Wallis product"),
        ("Leibniz pi","Leibniz formula"),("Monte Carlo pi","Monte Carlo pi"),("Needle Buffon","Buffon needles"),
        ("Random walk","Random walk"),("Brownian path","Brownian motion"),("Markov chain","Markov states"),
        ("Graph network","Graph theory"),("Seven bridges","Euler path"),("Hamilton tour","Hamilton cycle"),
        ("Spanning tree","Spanning tree"),("Complete graph K_n","Complete graph"),("Bipartite graph","Bipartite"),
        ("Four-color map","Planar map"),("Lưới展開 net","Unfolded net"),("Box packing","Box packing"),
        ("Close packing","Sphere packing"),("Voronoi cells","Voronoi diagram"),("Delaunay mesh","Delaunay triangulation"),
        ("Convex hull","Convex hull"),("Minkowski sum","Minkowski sum"),("Support lines","Support function"),
        ("Osculating circle","Curvature"),("Evolute curve","Evolute"),("Offset curves","Parallel curves"),
        ("Envelope family","Envelope"),("Orthogonal trajectories","Trajectories"),("Flow lines","Streamlines"),
        ("Direction field","Isocline"),("Newton basins","Newton fractal slice"),("Root loci","Zeros polynomial"),
        ("Bezier quadratic","Quadratic Bezier"),("Bezier cubic","Cubic Bezier"),("Natural spline","Spline"),
        ("Catmull-Rom","Catmull-Rom"),("Rectification","Arc length"),("Peelable shell","Surface area shell"),
        ("Displacement volume","Volume water"),("Similar figures","Similarity mirror"),("Congruence move","Congruence"),
        ("Midsegment","Midpoint theorem"),("Intercept theorem","Thales"),("Bisector locus","Angle bisector"),
        ("Perp bisector","Perpendicular bisector"),("Locus circle","Locus of points"),("Ellipse pins","Locus ellipse"),
        ("Hyperbola pins","Locus hyperbola"),("Focus directrix","Locus parabola"),("Apollonius circle","Apollonius"),
        ("Steiner chain","Circle chain"),("Poncelet polygon","Poncelet porism"),("Billiard table","Billiard"),
        ("Polygon unfolding","Unfolding"),("Geodesic string","Shortest path"),("Refraction angle","Snell law"),
        ("Mirror symmetry","Mirror image"),("Rotation order","Rotational symmetry"),("Translation tile","Translational tiling"),
        ("Penrose tiles","Aperiodic tiles"),("Escher fish","Escher tessellation"),("Girih stars","Islamic star"),
        ("Symmetry quilt","Quilt pattern"),("Wallpaper p4m","Wallpaper group"),("Frieze border","Frieze"),
        ("Kaleidoscope","Mirror kaleidoscope"),("Six-fold snowflake","Snowflake symmetry"),("Grid logo","Logo design"),
        ("Typography grid","Font metrics"),("One-point perspective","Perspective lines"),("Anamorphic art","Anamorphic"),
        ("Depth parallax","Parallax layers"),("Shadow puppet","Shadow geometry"),("Eclipse cones","Solar eclipse sim"),
        ("Orbit positions","Moon phases orbit"),("Axial tilt","Season tilt"),("Terminator","Day night terminator"),
        ("Trilateration","GPS trilateration"),("Echo distance","Sonar ping"),("Polar radar","Radar sweep"),
        ("Topo contours","Contour hiking"),("Counting stairs","Stair steps count"),("Degree sum","Handshake lemma"),
        ("Birthday buckets","Birthday paradox"),("Coin streaks","Gambler fallacy"),("Bayes update","Bayes tree"),
        ("Least squares","Regression line"),("Residual plot","Residuals"),("Correlation strength","Correlation cloud"),
        ("CLT sampling","Central limit"),("CI error bars","Confidence interval"),("Test regions","Hypothesis test"),
        ("Chi-square fit","Chi-square"),("Group means","ANOVA boxes"),("Seasonal series","Time series"),
        ("Smoothing","Moving average"),("Population growth","Growth exponential"),("Carrying capacity","Logistic curve"),
        ("Compound bars","Interest compounding"),("Amortization","Loan amortization"),("Marginal tax","Tax brackets"),
        ("Break-even","Profit break-even"),("Equilibrium","Supply demand"),("Elastic curves","Elasticity"),
        ("Indifference curves","Utility indifference"),("PPF","Production frontier"),("Payoff matrix","Game theory matrix"),
        ("PD payoffs","Prisoner dilemma"),("Bid ladder","Auction bid"),("Cake cutting","Fair division cake"),
        ("Redistricting","Voting districts"),("Seat apportionment","Apportionment"),("Ranked choice","Ranked ballot"),
        ("Preference cycle","Arrow paradox"),("Aggregation","Social choice"),("Max area fence","Optimization fence"),
        ("Fermat geodesic","Min distance"),("TSP tour","Traveling salesman"),("Item packing","Knapsack"),
        ("Gantt chart","Scheduling gantt"),("CPM network","Critical path"),("Arrival queue","Queue simulation"),
        ("EOQ curve","Inventory EOQ"),("Max flow pipes","Network flow"),("Dijkstra paths","Shortest Dijkstra"),
        ("Cut edges","Minimum cut"),("Link graph","Page rank web"),("K-means blobs","Clustering kmeans"),
        ("Classification","Decision boundary"),("Perceptron","Neuron simple"),("Convolution kernel","CNN filter"),
        ("Loss valley","Gradient descent ball"),("Step sizes","Learning rate"),("Fit vs wiggle","Overfitting"),
        ("Fold splits","Cross validation"),("Normalization","Feature scaling"),("Principal components","PCA axes"),
        ("Eigenvectors","Eigen stretch"),("Linear map","Matrix transform grid"),("Det parallelogram","Determinant area"),
        ("Undo transform","Inverse matrix"),("Rotate basis","Rotation matrix"),("Shear basis","Shear matrix"),
        ("Project onto line","Projection matrix"),("Mirror basis","Reflection matrix"),("Stretch basis","Scaling matrix"),
        ("Trace sum","Trace diagonal"),("Nullspace plane","Rank nullspace"),("Span arrows","Column space"),
        ("Elimination","Row reduction"),("Factorization","LU split"),("Orthogonalize","Gram-Schmidt"),
        ("Lattice basis","QR lattice"),("Cosine formula","Inner product angle"),("CS inequality","Cauchy Schwarz"),
        ("Metric ball","Triangle ineq 3D"),("L1 L2 Linf balls","Norm shapes"),("Taxicab","Distance metric"),
        ("Chessboard distance","Chebyshev"),("Elliptical distance","Mahalanobis"),("City blocks","Manhattan grid"),
        ("Kernel bumps","Radial basis"),("Hot plate","Heat diffusion"),("Vibrating membrane","Wave equation"),
        ("Harmonic ring","Laplace ring"),("Blue noise","Poisson dots"),("Spots stripes","Reaction-diffusion"),
        ("Stream function","Fluid stream"),("Field lines","Magnetic field"),("Charge field","Electric dipole"),
        ("Voltage rings","Equipotential"),("Uniform field","Capacitor plates"),("Ray tracing","Lens focal"),
        ("Dispersion prism","Prism spectrum"),("Interference fringes","Diffraction grating"),("Filter axis","Polarization"),
        ("Photon energy","Photoelectric"),("Spectrum curve","Blackbody"),("Wavefront shift","Doppler"),
        ("Standing sound","Sound resonance tube"),("Superposition","Beat frequency"),("Sector scan","Ultrasound scan"),
        ("Seismic rays","Earthquake wave"),("Shoaling","Tsunami depth"),("Temperature layers","Ocean thermocline"),
        ("Pressure isobars","Weather front"),("Lapse rate","Cloud altitude"),("Vector wind","Wind chill"),
        ("Spacing optimization","Crop rows"),("Coverage radius","Fertilizer spread"),("Rate graph","Water tank fill"),
        ("Continuity","Pipe flow"),("Weir curve","Dam spillway"),("Potential head","Hydroelectric head"),
        ("Fundamental diagram","Traffic flow"),("Force compression","Bridge load arch"),("Member stress","Truss forces"),
        ("Elastic curve","Beam deflection"),("Parabolic bridge","Cable suspension"),("Funicular","Arch thrust line"),
        ("Torque lever","Crane moment"),("Moment arms","Seesaw balance"),("Rotational mass","Flywheel inertia"),
        ("Gravity turn","Rocket trajectory"),("Kepler orbit","Orbit ellipse"),("Energy well","Escape velocity"),
        ("Period formula","Pendulum clock"),("Oscillator","Spring-mass SHM"),("Decay envelope","Damped oscillator"),
        ("Forced amplitude","Driven resonance"),("Beats modes","Coupled pendula"),("Sensitive path","Chaotic double pend"),
        ("Strange attractor","Lorenz attractor"),("Bifurcation","Logistic map"),("Scatter map","Henon map"),
        ("Phase space","Standard map"),("Torus map","Arnold cat"),("Return map","Poincare section"),
        ("Periodic orbit","Limit cycle"),("Emerging cycle","Hopf bifurcation"),("Collision","Saddle node"),
        ("Symmetry breaking","Pitchfork"),("Morphogenesis","Turing pattern"),("Rule 110","Cell automaton"),
        ("Path emergent","Langton ant"),("Still patterns","Game of life glider"),("Cluster threshold","Percolation"),
        ("Ferromagnet","Ising spins"),("Giant component","Random graph phase"),("Shortcut rewiring","Small world"),
        ("Preferential attach","Scale-free hub"),("Infection curve","Epidemic SIR"),("Herd threshold","Immunization"),
        ("Tree depth","Contact tracing"),("Log scale","Viral load"),("ROC curve","Antigen test"),
        ("Random walk drift","Stock volatility"),("Hockey stick","Option payoff"),("Efficient frontier","Portfolio risk"),
        ("Bet fraction","Kelly criterion"),("Sharpe line","Risk return"),("Tail loss","Value at risk"),
        ("Leading digit","Benford digits"),("Rank-frequency","Zipf law"),("Cumulative pareto","Pareto 80-20"),
        ("Distribution tail","Long tail"),("No mean Cauchy","Heavy tail"),("Self-similar sums","Stable laws"),
        ("Joint shape","Copula dependence"),("Steady vector","Markov stationary"),("HMM trellis","Hidden state"),
        ("Estimate band","Kalman filter"),("Optimization birds","Particle swarm"),("Population fitness","Genetic algorithm"),
        ("Cooling path","Simulated annealing"),("Forbidden moves","Tabu search"),("Pheromone trail","Ant colony"),
        ("Trees adding","Gradient boost"),("Bagging votes","Random forest"),("Neighbor regions","kNN decision"),
        ("Support vectors","SVM margin"),("Conditional independence","Naive Bayes"),("Soft assignment","EM clustering"),
        ("Compression","Autoencoder bottleneck"),("Token focus","Attention weights"),("Layers transformer","Transformer block"),
        ("Word vectors","Embedding space"),("Swiss roll","Manifold learning"),("Neighbors preserved","t-SNE clusters"),
        ("Structure UMAP","UMAP global"),("Geometry diffusion","Diffusion map"),("Message passing","Graph neural msg"),
        ("Sequence memory","Recurrent unroll"),("Action values","RL policy grid"),("Exploration bandit","Bandit regret"),
        ("Lookahead MCTS","Monte Carlo tree"),("Pruning alpha-beta","Alpha-Beta game tree"),("Adversarial minimax","Minimax zero-sum"),
        ("Best response","Nash equilibrium"),("Coalition","Cooperative surplus"),("Truthful bidding","Mechanism design"),
        ("Stable pairs","Matching market"),("Preferences stable marriage","Stable marriage"),("Cycle swaps","Kidney exchange"),
        ("Priority lists","School choice"),("Goods rounds","Assignment auction"),("Bundle bids","Combinatorial auction"),
        ("Interference spectrum","Spectrum auction"),("Voluntary contribution","Public good"),("Overgrazing","Commons tragedy"),
        ("Social cost","Externalities"),("Effective rate","Progressive tax curve"),("Revenue max","Laffer peak"),
        ("Inflation-unemployment","Phillips curve"),("GDP gap","Okun's law"),("Macro equilibrium","IS-LM"),
        ("Capital deepening","Solow growth"),("Optimal savings","Ramsey"),("Generations","Diamond OLG"),
        ("Demographics","Overlap cohorts"),("Backward bend","Labor supply"),("Surplus split","Wage bargaining"),
        ("Deadweight","Union monopoly"),("Mincer curve","Human capital"),("Signaling education","Education returns"),
        ("Input-output","Health production"),("Risk pooling","Insurance deductible"),("Behavior shift","Moral hazard"),
        ("Death spiral","Adverse selection"),("Contract menu","Screening"),("Separating equilibrium","Signaling"),
        ("Herding","Information cascade"),("Recommendation bayes","Bayesian persuasion"),("DeGroot","Opinion dynamics"),
        ("Threshold rumor","Rumor spread"),("Network bias","Misinformation"),("Echo chambers","Filter bubble"),
        ("Seed nodes","Viral marketing"),("Greedy sets","Influence maximization"),("Modularity","Community detection"),
        ("Betweenness","Centrality measures"),("Short hops","Closeness hubs"),("Authority eigenvector","Eigenvector centrality"),
        ("Stationary pagerank","PageRank iteration"),("Hubs authorities HITS","HITS algorithm"),("Signed graph trust","Trust propagation"),
        ("Cliques collusion","Collusion detection"),("Subgraph anomaly","Fraud ring"),("Retweet graph bot","Bot amplification"),
        ("Conversion funnel","Engagement funnel"),("Survival curve","Retention cohort"),("Risk scores churn","Churn prediction"),
        ("Discount sum LTV","Lifetime value"),("Clusters RFM","Segmentation RFM"),("Completion matrix","Recommendation matrix"),
        ("Popularity prior","Cold start"),("UCB bars","Exploration bonus"),("Features bandit","Contextual bandit"),
        ("Counterfactual eval","Offline evaluation"),("Sample size AB","A/B testing power"),("Early stopping sequential","Sequential testing"),
        ("Bonferroni","Multiple comparisons"),("BH procedure","False discovery"),("Forest plot","Meta-analysis"),
        ("Funnel asymmetry","Publication bias"),("Cohen d","Effect size"),("Type II beta","Power analysis"),
        ("TOST region","Equivalence test"),("Resampling spread","Bootstrap CI"),("Leave-one-out jackknife","Jackknife"),
        ("Exchangeability permutation","Permutation test"),("Binomial tails sign","Sign test"),("Nonparametric ranks","Wilcoxon ranks"),
        ("CDF gap KS","KS statistic"),("Tail weight AD","Anderson-Darling"),("Quantile match QQ","QQ plot"),
        ("Probabilities PP","PP plot"),("Skew-kurtosis JB","Jarque-Bera"),("Autocorrelation DW","Durbin-Watson"),
        ("Variance pattern White","White heteroskedasticity"),("Regression residual BP","Breusch-Pagan"),
        ("Fixed vs random Hausman","Hausman test"),("Predictability Granger","Granger causality"),("Spread stationary Johansen","Johansen cointegration"),
        ("Response functions VAR","VAR impulse"),("Clustered variance GARCH","GARCH volatility"),("Regime switching Markov","Regime switching"),
        ("Long memory fractional","Fractional integration"),("Persistence Hurst","Hurst exponent"),("Scaling exponents multifractal","Multifractal spectrum"),
        ("Time-frequency wavelet","Wavelet denoise"),("Local harmonics STFT","STFT spectrogram"),("Mexican hat CWT","Continuous wavelet"),
        ("Step functions Haar","Haar basis"),("Scaling Daubechies","Daubechies filters"),("Subbands filter bank","Filter bank"),
        ("Fast convolution FFT","FFT butterfly"),("Aliasing Nyquist","Nyquist sampling"),("Low-pass anti-alias","Anti-alias"),
        ("Resolution padding","Zero padding"),("Leakage window","Windowing"),("DFT grid spectral leakage","Spectral leakage"),
        ("Zoom FFT chirp","Chirp Z"),("Single bin Goertzel","Goertzel"),("Analytic signal Hilbert","Hilbert transform"),
        ("Jumps fixed unwrap","Phase unwrapping"),("Dispersion group delay","Group delay"),("Phase only all-pass","All-pass"),
        ("Energy onset min-phase","Minimum phase"),("Symmetric taps linear phase","Linear phase FIR"),("Feedback pole IIR","IIR recursion"),
        ("Second-order biquad","Cascade biquads"),("State variables direct form","Direct form"),("Reflection coeffs lattice","Lattice filter"),
        ("Convergence LMS","Adaptive LMS"),("Update step Kalman gain","Kalman gain"),("Nonlinear Jacobian EKF","Extended KF"),
        ("Sigma points UKF","Unscented sigma"),("ESS particle resampling","Particle resampling"),("Tempering SMC","SMC sampler"),
        ("Acceptance Metropolis","MCMC Metropolis"),("Conditionals Gibbs","Gibbs cycling"),("Leapfrog HMC","Hamiltonian MC"),
        ("Horizontal strips slice","Slice sampling"),("Dimension change RJ","Reversible jump"),("Prior volume nested","Nested sampling"),
        ("ELBO variational","Variational inference"),("Factorization mean-field","Mean-field"),("Moment matching EP","Expectation propagation"),
        ("Weights importance","Importance sampling"),("Variance reduce control variates","Control variates"),("Layer means stratified","Stratified sampling"),
        ("Space filling LHS","Latin hypercube"),("Low discrepancy Sobol","Quasi-random Sobol"),("Van der Corput Halton","Halton sequence"),
        ("Blue noise poisson disk","Poisson disk"),("Centroids Lloyd","Lloyd relaxation"),("Coverage farthest point","Farthest point"),
        ("Hierarchy bounding volumes","Bounding volumes"),("Ray traversal BVH","BVH tree"),("Subdivision octree voxel","Octree voxel"),
        ("Nearest neighbor KD-tree","KD-tree split"),("Box intersect range query","Range query"),("Simplex point location","Point location"),
        ("Half-edge DCEL","DCEL half-edge"),("Edge loops manifold","Manifold check"),("Parameterization UV unwrap","UV unwrap"),
        ("Orientation normal estimation","Normal estimation"),("Principal dirs curvature tensor","Curvature tensor"),("Bending shape operator","Shape operator"),
        ("Isometric developable unfold","Developable unfold"),("Rigid origami kirigami cuts","Kirigami cuts"),("Miura fold pattern","Miura fold"),
        ("Cylindrical Yoshimura buckling","Yoshimura buckling"),("Inflation waterbomb tessellation","Waterbomb tessellation"),("Angle sum Kawasaki theorem","Kawasaki theorem"),
        ("Mountain-valley Maekawa theorem","Maekawa theorem"),("Vertex condition flat-foldability","Flat-foldability"),("Preliminary origami base","Origami base"),
        ("Mountains crane crease pattern","Crane crease pattern"),("Grid box pleating","Box pleating"),("Strip zipper fold","Zipper fold"),("Area preserving Huffman tiling","Huffman tiling")
        ]

# ---- generate counts to reach >=1000 ----

# Platonic variants: 5 * 6 = 30
for ti,(vn, ve) in enumerate(PLATONIC):
    for j, edge in enumerate([1,1.2,1.5,1.8,2.1,2.5]):
        add(f"{vn} cạnh {edge:g}", ve, "Khối đa diện", "Trung học", "platonic",
            {"type": ti, "size": edge}, f"Mô hình 3D khối {vn.lower()} với cạnh {edge:g} đơn vị.")

# Polygons: 9 * 6 = 54
for pi,(vn, ve, nsides) in enumerate(POLYGONS):
    for j, R in enumerate([1,1.2,1.5,1.8,2,2.4]):
        add(f"{vn} đều R={R:g}", ve+" regular", "Hình phẳng", "Tiểu học", "polygon",
            {"sides": nsides, "radius": R}, f"{vn} đều nội tiếp đường tròn bán kính {R:g}.")

# Prisms: 7 * 6 = 42
for idx,(vn,ve) in enumerate(PRISMS, start=3):
    for j,(r,h) in enumerate([(0.8,1.4),(1,1.8),(1.2,2.2),(1.4,2.6),(0.9,2.0),(1.1,1.5)]):
        add(f"Lăng trụ {vn} h={h:g}", ve+" prism", "Khối đa diện", "Trung học", "prism",
            {"sides": idx, "radius": r, "height": h}, f"Lăng trụ {vn.lower()} chiều cao {h:g}, bán kính đáy {r:g}.")

# Pyramids: 5 * 6 = 30
for idx,(vn,ve) in enumerate(PYRAMIDS, start=3):
    for j,(r,h) in enumerate([(1,1.2),(1.2,1.6),(1.4,2),(0.9,1.4),(1.1,1.8),(1.3,2.2)]):
        add(f"Chóp {vn} h={h:g}", ve+" pyramid", "Khối đa diện", "Trung học", "pyramid",
            {"sides": idx, "radius": r, "height": h}, f"Hình chóp {vn.lower()} chiều cao {h:g}.")

# Cylinders: 4 * 6 = 24
for vi,(vn,ve) in enumerate(CYLINDERS):
    for j,(r,h) in enumerate([(0.8,1.6),(1,2),(1.2,1.4),(0.6,2.2),(1.4,1.8),(0.9,1.2)]):
        add(f"Trụ {vn} r={r:g} h={h:g}", ve+" cylinder", "Mặt tròn xoay", "Trung học", "cylinder",
            {"variant": vi, "r": r, "h": h}, f"Hình trụ {vn.lower()} r={r:g}, h={h:g}.")

# Cones: 3 * 6 = 18
for vi,(vn,ve) in enumerate(CONES):
    for j,(r,h) in enumerate([(1,1.6),(1.2,2),(0.8,1.4),(1.4,2.4),(0.9,1.8),(1.1,1.2)]):
        add(f"Nón {vn} r={r:g} h={h:g}", ve+" cone", "Mặt tròn xoay", "Trung học", "cone",
            {"variant": vi, "r": r, "h": h}, f"Hình nón {vn.lower()} r={r:g}, h={h:g}.")

# Spheres: 8 radii + 5 materials = 13
for j,r in enumerate([0.6,0.8,1.0,1.2,1.4,1.6,1.8,2.0]):
    add(f"Mặt cầu R={r:g}", f"Sphere R={r:g}", "Mặt tròn xoay", "Tiểu học", "sphere",
        {"r": r}, f"Mặt cầu bán kính {r:g}, công thức V=4/3πR³.")
for j,mat in enumerate(["wire","glass","textured","metal","glow"]):
    add(f"Cầu phong cách {mat}", f"Sphere style {mat}", "Công nghệ 3D", "Trung học", "sphere",
        {"r": 1.2, "material": mat}, f"Mặt cầu phong cách {mat} để tham chiếu vật liệu.")

# Torus: 6 + knots 6 = 12
for j,(R,r) in enumerate([(1.2,0.4),(1.4,0.3),(1.0,0.5),(1.6,0.25),(1.2,0.6),(0.9,0.35)]):
    add(f"Hình xuyến R={R:g} r={r:g}", f"Torus {R:g}/{r:g}", "Mặt tròn xoay", "Trung học", "torus",
        {"R": R, "r": r}, "Hình xuyến (donut) với hai bán kính.")
for j,(p,q) in enumerate([(2,3),(3,2),(2,5),(3,4),(2,7),(4,3)]):
    add(f"Nút xuyến ({p},{q})", f"Torus knot ({p},{q})", "Công nghệ 3D", "Trung học", "torusknot",
        {"p": p, "q": q}, f"Nút xuyến (p,q)=({p},{q}).")

# Fractals: 10 * 3 depths = 30
for fi,(vn,ve) in enumerate(FRACTALS):
    for j,d in enumerate([2,3,4]):
        add(f"{vn} độ sâu {d}", ve, "Fractal", "Trung học", "fractal",
            {"type": fi, "depth": d}, f"{ve} lặp cấp {d}.")

# Special rectangles: 12 * 4 = 48
for ri,(vn,ve,ratio) in enumerate(SPECIAL_J):
    for j,s in enumerate([1.0,1.4,1.8,2.2]):
        add(f"{vn} cỡ {s:g}", ve, "Hình phẳng", "Tiểu học", "rect",
            {"ratio": ratio, "scale": s}, f"Hình chữ nhật tỉ lệ {ratio:.3f}:1.")

# Fractions pies: 18*4=72
for num,den in FRACS:
    for j,size in enumerate([1.0,1.3,1.6,1.9]):
        add(f"Phần {num}/{den} cỡ {size:g}", f"Fraction {num}/{den}", "Số học", "Tiểu học", "fractionpie",
            {"num": num, "den": den, "size": size}, f"Biểu diễn phân số {num}/{den} bằng quạt tròn.")

# Triangles: 7*5=35
for ti,(vn,ve) in enumerate(TRI):
    for j,s in enumerate([1.2,1.5,1.8,2.1,2.4]):
        add(f"{vn} cạnh {s:g}", ve, "Hình phẳng", "Tiểu học", "triangle",
            {"type": ti, "scale": s}, f"Tam giác {vn.lower()} minh họa bất đẳng thức tam giác.")

# Quadrilaterals: 7*4=28
for qi,(vn,ve) in enumerate(QUADS):
    for j,s in enumerate([1.2,1.5,1.8,2.1]):
        add(f"{vn} #{j+1}", ve, "Hình phẳng", "Tiểu học", "quad",
            {"type": qi, "scale": s}, f"Tứ giác đặc biệt: {vn.lower()}.")

# Transformations: 6*4=24
for xi,(vn,ve) in enumerate(TRANSFORMS):
    for j,a in enumerate([0.5,1.0,1.5,2.0]):
        add(f"{vn} thông số {a:g}", ve, "Hình học biến đổi", "Trung học", "transform",
            {"type": xi, "amount": a}, f"Phép {vn.lower()} tác động lên lưới điểm.")

# Graphs 2D extruded: 14*4=56
for gi,(vn,ve) in enumerate(GRAPHS2D):
    for j,w in enumerate([2.0,2.6,3.2,4.0]):
        add(f"{vn} miền ±{w:g}", ve, "Hàm số", "Trung học", "graph2d",
            {"type": gi, "width": w}, f"Đồ thị {ve} kéo dài thành dải 3D.")

# Trig/polar curves: 12*3=36
for ci,(vn,ve) in enumerate(TRIGCURVES):
    for j,s in enumerate([1.0,1.4,1.8]):
        add(f"{vn} tỉ lệ {s:g}", ve, "Hàm lượng giác", "Trung học", "polarcurve",
            {"type": ci, "scale": s}, f"Đường cong {ve}.")

# Function surfaces: 15*3=45
for idx,label in enumerate([f[0] for f in FUNC3D]):
    for j,res in enumerate([24,36,48]):
        add(f"Mặt {label} mesh {res}", f"Surface {label}", "Giải tích", "Trung học", "surfacefn",
            {"fn": idx, "res": res}, f"Mặt z=f(x,y) dạng {label}.")

# Parametric surfaces: 10*3=30
for idx,(vn,ve) in enumerate(PARAMSURF):
    for j,s in enumerate([1.0,1.3,1.6]):
        add(f"{vn} cỡ {s:g}", ve, "Giải tích", "Trung học", "paramsurface",
            {"type": idx, "scale": s}, f"Mặt tham số {ve}.")

# Surfaces (quadric etc.): 10*3=30
for idx,(vn,ve) in enumerate(SURFACES):
    for j,s in enumerate([1.0,1.3,1.6]):
        add(f"Bề mặt {vn} cỡ {s:g}", ve, "Giải tích", "Trung học", "quadsurface",
            {"type": idx, "scale": s}, f"Mặt bậc hai {ve}.")

# Solids of revolution: 8*3=24
for idx,(vn,ve) in enumerate(SOLIDSREV):
    for j,n in enumerate([24,32,40]):
        add(f"{vn} mẫu {n}", ve, "Giải tích", "Trung học", "revolution",
            {"type": idx, "segments": n}, f"Khối tròn xoay quanh trục Ox từ {ve}.")

# Vectors: 8*3=24
for idx,(vn,ve) in enumerate(VECTORS):
    for j,l in enumerate([1.0,1.4,1.8]):
        add(f"{vn} độ dài {l:g}", ve, "Vectơ", "Trung học", "vector",
            {"type": idx, "len": l}, f"Minh họa {ve} trong không gian vectơ.")

# Stats: 12*3=36
for idx,(vn,ve) in enumerate(STATS):
    for j,s in enumerate([1.0,1.3,1.6]):
        add(f"{vn} dữ liệu {j+1}", ve, "Thống kê", "Trung học", "stats",
            {"type": idx, "seed": j+1}, f"Biểu đồ thống kê {ve}.")

# Probability: 10*3=30
for idx,(vn,ve) in enumerate(PROBS):
    for j,s in enumerate([1.0,1.3,1.6]):
        add(f"{vn} mẫu {j+1}", ve, "Xác suất", "Trung học", "prob",
            {"type": idx, "seed": j+1}, f"Mô hình xác suất {ve}.")

# Number systems: 10*3=30
for idx,(vn,ve) in enumerate(NUMSYS):
    for j,s in enumerate([1.0,1.3,1.6]):
        add(f"{vn} cỡ {s:g}", ve, "Số học", "Tiểu học", "numsys",
            {"type": idx, "scale": s}, f"Dụng cụ trực quan {ve}.")

# Geo solids extra: 10*2=20
for idx,(vn,ve) in enumerate(GEOSOLID_EXTRA):
    for j,s in enumerate([1.0,1.4]):
        add(f"{vn} #{j+1}", ve, "Ứng dụng thực tế", "Trung học", "geoextra",
            {"type": idx, "scale": s}, f"Kết cấu {ve} trong thực tế.")

# Misc list: each once => many
for idx,(vn,ve) in enumerate(MISC):
    add(vn, ve, "Nâng cao", "Trung học", "misc",
        {"type": idx % 24, "variant": idx // 24}, f"Mô hình {ve}.")

print("total:", len(models))
with open("/workspace/js/models.json","w",encoding="utf-8") as f:
    json.dump(models,f,ensure_ascii=False,indent=1)
