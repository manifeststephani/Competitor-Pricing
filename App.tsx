
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  BarChart3, 
  Globe, 
  RefreshCcw, 
  Search, 
  Settings, 
  ArrowUpRight, 
  TrendingUp, 
  Package, 
  Layers, 
  ChevronRight, 
  Loader2, 
  Filter, 
  ExternalLink, 
  Scale, 
  Zap, 
  Target,
  Lightbulb,
  CheckCircle2,
  Info
} from 'lucide-react';
import { CATEGORIES, PRICE_BUCKETS, MOCK_COMPETITORS } from './constants';
import { CompetitorData, Category } from './types';
import { generateMockData, analyzeCompetitor } from './services/geminiService';

// Professional, muted palette: Navies, Slates, and sophisticated accents
const COLORS = [
  '#0f172a', // Slate 900
  '#334155', // Slate 700
  '#475569', // Slate 600
  '#64748b', // Slate 500
  '#94a3b8', // Slate 400
  '#0d9488', // Teal 600 (sophisticated accent)
  '#0891b2', // Cyan 600
  '#1e40af'  // Blue 800
];

const App: React.FC = () => {
  const [competitors, setCompetitors] = useState<CompetitorData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison' | 'drilldown'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [comparisonCategory, setComparisonCategory] = useState<Category>(CATEGORIES[0]);

  // Initial Seed
  useEffect(() => {
    const initialData = MOCK_COMPETITORS.map(comp => generateMockData(comp.name, comp.url));
    setCompetitors(initialData);
    setSelectedId(initialData[0].id);
  }, []);

  const selectedCompetitor = useMemo(() => 
    competitors.find(c => c.id === selectedId), 
    [competitors, selectedId]
  );

  const toddSnyder = useMemo(() => 
    competitors.find(c => c.name === 'Todd Snyder'), 
    [competitors]
  );

  const handleRefresh = async (id: string) => {
    const comp = competitors.find(c => c.id === id);
    if (!comp) return;

    setIsAnalyzing(true);
    try {
      const { data } = await analyzeCompetitor(comp.name, comp.url);
      setCompetitors(prev => prev.map(c => c.id === id ? data : c));
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredCompetitors = competitors.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Data Formatting for Selected Brand Charts
  const priceDistributionData = useMemo(() => {
    if (!selectedCompetitor) return [];
    return PRICE_BUCKETS.map(bucket => {
      const count = selectedCompetitor.data.reduce((sum: number, cat) => {
        const val = (cat.counts[bucket] as number) || 0;
        return sum + val;
      }, 0);
      return { name: bucket, count };
    });
  }, [selectedCompetitor]);

  const categoryMixData = useMemo(() => {
    if (!selectedCompetitor) return [];
    return selectedCompetitor.data.map(cat => ({
      name: cat.category,
      value: Object.values(cat.counts).reduce((a: number, b) => a + (b as number), 0)
    })).sort((a, b) => b.value - a.value);
  }, [selectedCompetitor]);

  // Comparison Data Aggregation
  const crossBrandAssortment = useMemo(() => {
    return competitors.map(c => ({
      name: c.name,
      styles: c.totalStyles,
      logo: c.logo
    })).sort((a, b) => b.styles - a.styles);
  }, [competitors]);

  const pricingArchitectureComparison = useMemo(() => {
    return PRICE_BUCKETS.map(bucket => {
      const result: any = { name: bucket };
      competitors.forEach(c => {
        result[c.name] = c.data.reduce((sum: number, cat) => sum + ((cat.counts[bucket] as number) || 0), 0);
      });
      return result;
    });
  }, [competitors]);

  const categoryHeatmapData = useMemo(() => {
    return CATEGORIES.map(cat => {
      const row: any = { category: cat };
      competitors.forEach(c => {
        const catData = c.data.find(d => d.category === cat);
        row[c.name] = catData ? Object.values(catData.counts).reduce((a: number, b) => a + (b as number), 0) : 0;
      });
      return row;
    });
  }, [competitors]);

  // Specific Comparison logic: Category Price Bucket Distribution by Brand
  const drilldownComparisonData = useMemo(() => {
    return competitors.map(c => {
      const brandData: any = { brand: c.name };
      const catData = c.data.find(d => d.category === comparisonCategory);
      if (catData) {
        PRICE_BUCKETS.forEach(bucket => {
          brandData[bucket] = catData.counts[bucket] || 0;
        });
      } else {
        PRICE_BUCKETS.forEach(bucket => {
          brandData[bucket] = 0;
        });
      }
      return brandData;
    });
  }, [competitors, comparisonCategory]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center shadow-lg shadow-slate-200">
              <Layers className="text-white w-4 h-4" />
            </div>
            <h1 className="font-bold text-lg tracking-tight text-slate-900 uppercase">RetailIntel</h1>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search competitors..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <div className="flex items-center justify-between px-2 mb-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Monitored Sites</p>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase border border-slate-200">Full Price</span>
          </div>
          {filteredCompetitors.map((comp) => (
            <button
              key={comp.id}
              onClick={() => setSelectedId(comp.id)}
              className={`w-full flex items-center gap-3 p-2.5 rounded transition-all group ${
                selectedId === comp.id && activeTab !== 'comparison' ? 'bg-slate-900 text-white shadow-md' : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <img src={comp.logo} alt={comp.name} className={`w-7 h-7 rounded border object-cover ${selectedId === comp.id && activeTab !== 'comparison' ? 'border-slate-700' : 'border-slate-200'}`} />
              <div className="flex-1 text-left truncate">
                <p className={`font-semibold text-xs truncate ${selectedId === comp.id && activeTab !== 'comparison' ? 'text-white' : 'text-slate-800'}`}>{comp.name}</p>
                <p className={`text-[10px] truncate ${selectedId === comp.id && activeTab !== 'comparison' ? 'text-slate-400' : 'text-slate-500'}`}>{comp.totalStyles} Styles</p>
              </div>
              {selectedId === comp.id && activeTab !== 'comparison' && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="mb-4 p-3 bg-slate-50 rounded border border-slate-200">
             <div className="flex items-center gap-2 text-slate-600 mb-1">
                <Filter className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Status</span>
             </div>
             <p className="text-[10px] text-slate-500 leading-tight">Live catalog scanning active. Filtering for <b>MSRP only</b>.</p>
          </div>
          <button className="w-full flex items-center justify-center gap-2 p-2 text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {isAnalyzing && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[4px] z-50 flex items-center justify-center">
            <div className="bg-white p-10 rounded-lg shadow-2xl border border-slate-200 flex flex-col items-center gap-6 text-center max-w-sm">
              <Loader2 className="w-10 h-10 text-slate-900 animate-spin" />
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">Analysis In Progress</h3>
                <p className="text-xs text-slate-500 mt-2 font-medium">Synthesizing live catalog data into pricing architecture buckets.</p>
              </div>
            </div>
          </div>
        )}

        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-5">
            {activeTab === 'comparison' ? (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-900 rounded flex items-center justify-center shadow-xl">
                  <Scale className="text-white w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold uppercase tracking-tight text-slate-900">Market Intelligence</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aggregated Competitive Set</p>
                </div>
              </div>
            ) : (
              <>
                <img src={selectedCompetitor?.logo} alt="" className="w-10 h-10 rounded border border-slate-200 object-cover shadow-sm" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold uppercase tracking-tight text-slate-900">{selectedCompetitor?.name}</h2>
                    <span className="text-[9px] bg-slate-900 text-white px-1.5 py-0.5 rounded font-bold tracking-tighter uppercase">Primary</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                    <Globe className="w-3 h-3 text-slate-300" />
                    <span className="truncate max-w-[150px]">{selectedCompetitor?.url}</span>
                    <span className="text-slate-300">/</span>
                    <span>Last Scan: {new Date(selectedCompetitor?.lastUpdated || '').toLocaleTimeString()}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-slate-100 rounded p-1 flex border border-slate-200">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-1 text-[11px] font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'overview' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveTab('comparison')}
                className={`px-4 py-1 text-[11px] font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'comparison' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Comparison
              </button>
              <button 
                onClick={() => setActiveTab('drilldown')}
                className={`px-4 py-1 text-[11px] font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'drilldown' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Matrix
              </button>
            </div>
            {activeTab !== 'comparison' && (
              <button 
                onClick={() => handleRefresh(selectedId!)}
                className="flex items-center gap-2 bg-slate-900 text-white px-4 py-1.5 rounded text-[11px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-lg"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>Rescan</span>
              </button>
            )}
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
          {activeTab === 'comparison' ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
              
              {/* BRAND SPOTLIGHT: Todd Snyder Takeaways */}
              <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden border-t-2 border-t-slate-900">
                <div className="bg-slate-50 px-8 py-5 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-900 p-2 rounded">
                        <Lightbulb className="text-white w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">Strategic Positioning: Todd Snyder</h3>
                        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tight mt-0.5">Competitive advantage and market gap analysis</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="w-3.5 h-3.5 text-slate-500" />
                      <h4 className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Assortment Breadth</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Maintains <b>high-density volume</b> across 94% of tracked categories. Effectively hedges between the basics of Buck Mason and the formality of Suit Supply.
                    </p>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
                      <h4 className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Price Authority</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Dominates the <b>$199 - $399 mid-luxury</b> tier. This pricing architecture captures the 'aspirational customer' without alienating volume shoppers.
                    </p>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-3.5 h-3.5 text-slate-500" />
                      <h4 className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Risk Factor</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Exposure in high-churn categories like <b>Tees and Polos</b> where competitors offer comparable quality at 15-20% lower price points.
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Market Leader / Volume</p>
                  <div className="flex items-center gap-4">
                    <img src={crossBrandAssortment[0]?.logo} className="w-10 h-10 rounded border object-cover" />
                    <div>
                      <p className="text-lg font-bold text-slate-900">{crossBrandAssortment[0]?.name}</p>
                      <p className="text-[11px] font-bold text-slate-500 uppercase">{crossBrandAssortment[0]?.styles.toLocaleString()} Unique Styles</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Premium Authority</p>
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-900 rounded">
                      <TrendingUp className="text-white w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-900">Sid Mashburn</p>
                      <p className="text-[11px] font-bold text-slate-500 uppercase">Top 5% Price Tiers</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Efficiency Specialist</p>
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-100 rounded border border-slate-200">
                      <Zap className="text-slate-900 w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-900">Suit Supply</p>
                      <p className="text-[11px] font-bold text-slate-500 uppercase">Tailored Core Focus</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category-Level Price Bucket Comparison by Brand */}
              <div className="bg-white p-6 rounded border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-slate-900 rounded">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">Price Points by Category</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Direct cross-comparison of pricing strategy</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Analyze:</span>
                    <select 
                      value={comparisonCategory}
                      onChange={(e) => setComparisonCategory(e.target.value as Category)}
                      className="bg-white border border-slate-200 text-xs font-bold uppercase tracking-wider rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={drilldownComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="brand" fontSize={10} fontWeight={700} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                      <YAxis fontSize={10} fontWeight={700} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', backgroundColor: 'white' }}
                        cursor={{ fill: '#f8fafc' }}
                      />
                      <Legend verticalAlign="top" align="center" wrapperStyle={{ paddingBottom: '30px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }} />
                      {PRICE_BUCKETS.map((bucket, index) => (
                        <Bar 
                          key={bucket} 
                          dataKey={bucket} 
                          stackId="a" 
                          fill={COLORS[index % COLORS.length]} 
                          barSize={50}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Assortment Volume Horizontal Bar Chart */}
              <div className="bg-white p-6 rounded border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-300" />
                  Total Assortment Volume
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={crossBrandAssortment} layout="vertical" margin={{ left: 40, right: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" fontSize={11} fontWeight={700} width={120} axisLine={false} tickLine={false} />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '4px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '12px' }}
                      />
                      <Bar dataKey="styles" fill="#0f172a" radius={[0, 2, 2, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Multi-Brand Price Point Distribution */}
              <div className="bg-white p-6 rounded border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-slate-300" />
                    Market Pricing Curve
                  </h3>
                  <div className="hidden lg:flex gap-5">
                    {competitors.map((c, i) => (
                      <div key={c.name} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pricingArchitectureComparison}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" fontSize={10} fontWeight={700} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                      <YAxis fontSize={10} fontWeight={700} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '4px', border: '1px solid #e2e8f0', backgroundColor: 'white' }}
                      />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, paddingBottom: 10 }} />
                      {competitors.map((c, i) => (
                        <Line 
                          key={c.name} 
                          type="monotone" 
                          dataKey={c.name} 
                          stroke={COLORS[i % COLORS.length]} 
                          strokeWidth={2} 
                          dot={{ r: 3, fill: COLORS[i % COLORS.length] }} 
                          activeDot={{ r: 5 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Focus Cross-Comparison Heatmap */}
              <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900">Category Assortment Matrix</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">Cross-brand comparison of SKU volume density</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">Volume Density</span>
                    <div className="w-24 h-1.5 bg-gradient-to-r from-slate-100 to-slate-900 rounded-full"></div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-8 py-4 font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 sticky left-0 bg-slate-50 z-10 min-w-[200px]">Product Category</th>
                        {competitors.map(c => (
                          <th key={c.name} className="px-6 py-4 font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 text-center min-w-[140px]">{c.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {categoryHeatmapData.map((row) => (
                        <tr key={row.category} className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                          <td className="px-8 py-3 font-bold text-slate-700 uppercase tracking-tight sticky left-0 bg-white shadow-[2px_0_5px_rgba(0,0,0,0.02)] z-10 border-r border-slate-100">{row.category}</td>
                          {competitors.map(c => {
                            const val = row[c.name] || 0;
                            const maxVal = 200; 
                            const intensity = Math.min(val / maxVal, 1);
                            return (
                              <td key={c.name} className="px-6 py-2.5 text-center">
                                <div 
                                  className="mx-auto h-9 w-full flex items-center justify-center rounded font-bold text-[10px] transition-all"
                                  style={{ 
                                    backgroundColor: val > 0 ? `rgba(15, 23, 42, ${intensity * 0.8 + 0.05})` : '#f8fafc',
                                    color: val > 100 ? 'white' : '#1e293b',
                                    border: val > 0 ? `1px solid rgba(15, 23, 42, 0.1)` : '1px dashed #e2e8f0'
                                  }}
                                >
                                  {val}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'overview' ? (
            <>
              {/* Data Sources */}
              {selectedCompetitor?.sources && selectedCompetitor.sources.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded p-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" />
                    Market Data Origin
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCompetitor.sources.map((source, idx) => (
                      <a 
                        key={idx} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm group uppercase tracking-wider"
                      >
                        <span className="max-w-[200px] truncate">{source.title}</span>
                        <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard 
                  title="Total MSRP Catalog" 
                  value={selectedCompetitor?.totalStyles.toLocaleString() || '0'} 
                  icon={<Package className="text-slate-900" />}
                  trend="Unique Styles"
                />
                <StatCard 
                  title="Estimated Median" 
                  value="$185" 
                  icon={<TrendingUp className="text-slate-900" />}
                  trend="Architecture Base"
                />
                <StatCard 
                  title="Dominant Product" 
                  value={categoryMixData[0]?.name || '-'} 
                  icon={<BarChart3 className="text-slate-900" />}
                  trend="Largest Category"
                />
                <StatCard 
                  title="High Tier Mix" 
                  value="18.5%" 
                  icon={<Scale className="text-slate-900" />}
                  trend="Catalog Weight"
                />
              </div>

              {/* Main Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-slate-300" />
                      Price Bucket Distribution
                    </div>
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={priceDistributionData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={10} fontWeight={700} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                        <YAxis fontSize={10} fontWeight={700} tickLine={false} axisLine={false} tick={{fill: '#94a3b8'}} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', backgroundColor: 'white' }}
                        />
                        <Bar dataKey="count" fill="#0f172a" radius={[2, 2, 0, 0]} barSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RefreshCcw className="w-4 h-4 text-slate-300" />
                      Assortment Mix
                    </div>
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryMixData.slice(0, 8)}
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {categoryMixData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Detailed Heatmap Table */}
              <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900">Assortment Deep Dive</h3>
                  <div className="flex gap-4">
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      <div className="w-2 h-2 rounded bg-slate-100 border border-slate-200"></div> Low
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      <div className="w-2 h-2 rounded bg-slate-900"></div> Peak
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-8 py-3.5 font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 sticky left-0 bg-slate-50">Product</th>
                        {PRICE_BUCKETS.map(bucket => (
                          <th key={bucket} className="px-4 py-3.5 font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 text-center min-w-[90px]">{bucket}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCompetitor?.data.map((row) => (
                        <tr key={row.category} className="hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-3.5 font-bold text-slate-700 uppercase tracking-tight border-b border-slate-100 sticky left-0 bg-white shadow-[2px_0_5px_rgba(0,0,0,0.02)]">{row.category}</td>
                          {PRICE_BUCKETS.map(bucket => {
                            const val = row.counts[bucket] || 0;
                            const intensity = Math.min(val / 25, 1);
                            return (
                              <td key={bucket} className="px-4 py-3.5 border-b border-slate-100 text-center">
                                <div 
                                  className="mx-auto w-9 h-7 flex items-center justify-center rounded font-bold text-[10px] transition-all"
                                  style={{ 
                                    backgroundColor: val > 0 ? `rgba(15, 23, 42, ${intensity * 0.4 + 0.05})` : 'transparent',
                                    color: val > 0 ? '#1e293b' : '#cbd5e1',
                                    border: val > 0 ? `1px solid rgba(15, 23, 42, 0.1)` : '1px dashed #f1f5f9'
                                  }}
                                >
                                  {val}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-6">
               <div className="bg-white p-6 rounded border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">Catalog Matrix</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">Product density across price and category</p>
                    </div>
                  </div>
                  <div className="h-[600px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={selectedCompetitor?.data} 
                        layout="vertical"
                        margin={{ left: 100 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="category" 
                          type="category" 
                          fontSize={10} 
                          fontWeight={700}
                          width={150}
                          tickLine={false}
                          axisLine={false}
                          tick={{fill: '#475569'}}
                          textAnchor="end"
                        />
                        <Tooltip />
                        <Legend iconType="square" wrapperStyle={{fontSize: '10px', textTransform: 'uppercase', fontWeight: 700}} />
                        {PRICE_BUCKETS.map((bucket, index) => (
                          <Bar 
                            key={bucket}
                            dataKey={`counts.${bucket}`} 
                            name={bucket} 
                            stackId="a" 
                            fill={COLORS[index % COLORS.length]} 
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; trend: string }> = ({ title, value, icon, trend }) => (
  <div className="bg-white p-6 rounded border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
    <div className="flex items-center justify-between mb-5">
      <div className="p-2 bg-slate-50 rounded border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-colors">{icon}</div>
      <ArrowUpRight className="w-3.5 h-3.5 text-slate-200 group-hover:text-slate-900 transition-colors" />
    </div>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{title}</p>
    <h4 className="text-xl font-bold mt-1 text-slate-900">{value}</h4>
    <div className="flex items-center gap-1.5 mt-4">
      <div className="w-1.5 h-1.5 rounded-full bg-slate-900"></div>
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{trend}</span>
    </div>
  </div>
);

export default App;
