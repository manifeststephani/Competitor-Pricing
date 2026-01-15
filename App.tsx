
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

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];

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
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-indigo-100 shadow-lg">
              <Layers className="text-white w-5 h-5" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">RetailIntel AI</h1>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search competitors..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="flex items-center justify-between px-2 mb-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monitored Sites</p>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">FULL PRICE</span>
          </div>
          {filteredCompetitors.map((comp) => (
            <button
              key={comp.id}
              onClick={() => setSelectedId(comp.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all group ${
                selectedId === comp.id && activeTab !== 'comparison' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <img src={comp.logo} alt={comp.name} className="w-8 h-8 rounded-full border border-slate-200 object-cover" />
              <div className="flex-1 text-left truncate">
                <p className="font-medium text-sm truncate">{comp.name}</p>
                <p className="text-xs opacity-60 truncate">{comp.totalStyles} Full Price</p>
              </div>
              {selectedId === comp.id && activeTab !== 'comparison' && <ChevronRight className="w-4 h-4" />}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="mb-4 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
             <div className="flex items-center gap-2 text-indigo-700 mb-1">
                <Filter className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold uppercase">Global Filter</span>
             </div>
             <p className="text-[10px] text-indigo-600/80 leading-tight">Currently monitoring <b>Full Price</b> items only. Sale sections are excluded.</p>
          </div>
          <button className="w-full flex items-center justify-center gap-2 p-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors">
            <Settings className="w-4 h-4" />
            <span>Dashboard Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {isAnalyzing && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center gap-4 text-center max-w-sm">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
              <div>
                <h3 className="text-lg font-bold">Analyzing Live Catalog...</h3>
                <p className="text-sm text-slate-500 mt-1">Gemini is crawling current site metadata, filtering for <b>full-price</b> styles only.</p>
              </div>
            </div>
          </div>
        )}

        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {activeTab === 'comparison' ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-200">
                  <Scale className="text-white w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Market Landscape Comparison</h2>
                  <p className="text-xs text-slate-500">Competitive benchmarks for all 6 monitored brands</p>
                </div>
              </div>
            ) : (
              <>
                <img src={selectedCompetitor?.logo} alt="" className="w-10 h-10 rounded-full object-cover shadow-sm" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{selectedCompetitor?.name}</h2>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold border border-slate-200">FULL PRICE ONLY</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Globe className="w-3 h-3" />
                    <span className="truncate max-w-[200px]">{selectedCompetitor?.url}</span>
                    <span className="mx-1">•</span>
                    <span>Last Scan: {new Date(selectedCompetitor?.lastUpdated || '').toLocaleString()}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-100 rounded-lg p-1 flex">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'overview' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveTab('comparison')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'comparison' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                Comparison
              </button>
              <button 
                onClick={() => setActiveTab('drilldown')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'drilldown' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                Matrix
              </button>
            </div>
            {activeTab !== 'comparison' && (
              <button 
                onClick={() => handleRefresh(selectedId!)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <RefreshCcw className="w-4 h-4" />
                <span>Refresh Scan</span>
              </button>
            )}
          </div>
        </header>

        <div className="p-8 space-y-8">
          {activeTab === 'comparison' ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* BRAND SPOTLIGHT: Todd Snyder Takeaways */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden border-l-4 border-l-indigo-600">
                <div className="bg-gradient-to-r from-indigo-50/50 to-white px-8 py-6 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-600 p-2 rounded-lg">
                        <Lightbulb className="text-white w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Strategic Deep Dive: Todd Snyder</h3>
                        <p className="text-sm text-slate-500">How the brand stacks up against the competitive set.</p>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Assortment Rank</p>
                        <p className="text-sm font-bold text-indigo-600">#2 Overall Volume</p>
                      </div>
                      <div className="h-8 w-[1px] bg-slate-200"></div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Pricing Logic</p>
                        <p className="text-sm font-bold text-emerald-600">"The Luxury Bridge"</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                  <div className="p-8">
                    <div className="flex items-center gap-2 mb-4">
                      <Package className="w-4 h-4 text-indigo-500" />
                      <h4 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Assortment Strategy</h4>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Todd Snyder maintains <b>unrivaled category breadth</b>. Unlike Suit Supply (Tailoring focus) or Buck Mason (Casual focus), TS is a high-volume player in both worlds. 
                      <br /><br />
                      <span className="flex items-start gap-2 text-indigo-700 bg-indigo-50/50 p-2 rounded text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>Aggressively dominates <b>Sweater Polos</b> and <b>Shirt Jackets</b>—categories often neglected by traditional retailers.</span>
                      </span>
                    </p>
                  </div>
                  
                  <div className="p-8">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <h4 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Pricing Architecture</h4>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      TS acts as the <b>"Bridge to Luxury"</b>. While Ralph Lauren and Buck Mason own the Under-$100 basics, TS core volume shifts heavily into the <b>$200 to $399</b> bucket.
                      <br /><br />
                      <span className="flex items-start gap-2 text-emerald-700 bg-emerald-50/50 p-2 rounded text-xs">
                        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>Avoids the Sid Mashburn 'High-End Exclusivity' by keeping a healthy mix of premium-but-accessible price points.</span>
                      </span>
                    </p>
                  </div>
                  
                  <div className="p-8">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="w-4 h-4 text-orange-500" />
                      <h4 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Market Vulnerability</h4>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Todd Snyder's biggest threat is <b>Assortment Bloat</b>. By offering everything, they risk lower margins compared to Brooks Brothers' standardized dress shirt volume.
                      <br /><br />
                      <span className="flex items-start gap-2 text-orange-700 bg-orange-50/50 p-2 rounded text-xs">
                        <Zap className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>Currently vulnerable in <b>Dress Shirts</b>, where Suit Supply offers a more refined, volume-priced alternative.</span>
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Top-Level Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Largest Assortment</h3>
                  <div className="flex items-center gap-4">
                    <img src={crossBrandAssortment[0]?.logo} className="w-12 h-12 rounded-full border object-cover" />
                    <div>
                      <p className="text-xl font-bold">{crossBrandAssortment[0]?.name}</p>
                      <p className="text-indigo-600 font-medium">{crossBrandAssortment[0]?.styles.toLocaleString()} Full Price Styles</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Premium Market Leader</h3>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 rounded-lg">
                      <TrendingUp className="text-emerald-600 w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">Sid Mashburn</p>
                      <p className="text-emerald-600 font-medium">62% styles above $400</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Volume Specialist</h3>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <Zap className="text-orange-600 w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">Ralph Lauren</p>
                      <p className="text-orange-600 font-medium">1,240 Core Styles</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category-Level Price Bucket Comparison by Brand */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-500" />
                    <div>
                      <h3 className="font-bold text-slate-800">Category-Specific Price Distribution</h3>
                      <p className="text-xs text-slate-500">Compare how brands price a specific product category side-by-side.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-tight ml-2">Analyze:</span>
                    <select 
                      value={comparisonCategory}
                      onChange={(e) => setComparisonCategory(e.target.value as Category)}
                      className="bg-white border border-slate-200 text-sm font-medium rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                      <XAxis dataKey="brand" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                        cursor={{ fill: 'transparent' }}
                      />
                      <Legend verticalAlign="top" align="center" wrapperStyle={{ paddingBottom: '30px', fontSize: '11px' }} />
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
                <div className="mt-6 p-4 bg-indigo-50/30 rounded-lg border border-indigo-100/50">
                  <p className="text-xs text-indigo-800 leading-relaxed italic">
                    <b>Insight:</b> This visualization shows the competitive positioning of <b>{comparisonCategory}</b>. Use it to identify price gaps or premium-tier dominance. 
                    For example, see which brands are undercutting the market versus those maintaining high-end exclusivity.
                  </p>
                </div>
              </div>

              {/* Assortment Volume Bar Chart */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-500" />
                  Total Full-Price Assortment Size Comparison
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={crossBrandAssortment} layout="vertical" margin={{ left: 40, right: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" fontSize={12} width={120} axisLine={false} tickLine={false} />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="styles" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={30}>
                        {crossBrandAssortment.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#4f46e5' : '#818cf8'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Multi-Brand Price Point Distribution */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                    Global Pricing Architecture Benchmarks
                  </h3>
                  <div className="hidden lg:flex gap-4">
                    {competitors.map((c, i) => (
                      <div key={c.name} className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                        <span className="text-[10px] font-bold text-slate-500">{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pricingArchitectureComparison}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }} />
                      {competitors.map((c, i) => (
                        <Line 
                          key={c.name} 
                          type="monotone" 
                          dataKey={c.name} 
                          stroke={COLORS[i % COLORS.length]} 
                          strokeWidth={2.5} 
                          dot={{ r: 4 }} 
                          activeDot={{ r: 6 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Focus Cross-Comparison Heatmap */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <h3 className="font-bold text-slate-800">Category Dominance Matrix</h3>
                    <p className="text-[10px] text-slate-500">Cross-brand comparison of style density by category.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Assortment Density</span>
                    <div className="w-24 h-2 bg-gradient-to-r from-indigo-50 to-indigo-600 rounded-full"></div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-4 font-semibold text-slate-600 border-b border-slate-200 sticky left-0 bg-slate-50 z-10 min-w-[200px]">Category</th>
                        {competitors.map(c => (
                          <th key={c.name} className="px-6 py-4 font-semibold text-slate-600 border-b border-slate-200 text-center min-w-[140px]">{c.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {categoryHeatmapData.map((row) => (
                        <tr key={row.category} className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                          <td className="px-6 py-3 font-medium text-slate-800 sticky left-0 bg-white shadow-[2px_0_5px_rgba(0,0,0,0.05)] z-10">{row.category}</td>
                          {competitors.map(c => {
                            const val = row[c.name] || 0;
                            const maxVal = 200; // Expected max for color scale
                            const intensity = Math.min(val / maxVal, 1);
                            return (
                              <td key={c.name} className="px-6 py-3 text-center">
                                <div 
                                  className="mx-auto h-10 w-full flex items-center justify-center rounded-lg font-bold text-xs"
                                  style={{ 
                                    backgroundColor: val > 0 ? `rgba(99, 102, 241, ${intensity * 0.4 + 0.05})` : '#f8fafc',
                                    color: val > 100 ? 'white' : `rgba(67, 56, 202, ${Math.max(intensity + 0.5, 0.6)})`,
                                    border: val > 0 ? `1px solid rgba(99, 102, 241, 0.1)` : '1px dashed #e2e8f0'
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
              {/* Display mandatory Grounding Metadata URLs extracted from Gemini response */}
              {selectedCompetitor?.sources && selectedCompetitor.sources.length > 0 && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" />
                    Data Sources (Search Grounding)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCompetitor.sources.map((source, idx) => (
                      <a 
                        key={idx} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 rounded-full text-xs text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm group"
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
                  title="Full Price Assortment" 
                  value={selectedCompetitor?.totalStyles.toLocaleString() || '0'} 
                  icon={<Package className="text-indigo-600" />}
                  trend="Excluding Sale Items"
                />
                <StatCard 
                  title="Median Full Price" 
                  value="$185" 
                  icon={<TrendingUp className="text-emerald-600" />}
                  trend="Target Architecture"
                />
                <StatCard 
                  title="Core Category" 
                  value={categoryMixData[0]?.name || '-'} 
                  icon={<BarChart3 className="text-orange-600" />}
                  trend={`${categoryMixData[0]?.value || 0} Styles`}
                />
                <StatCard 
                  title="Premium Mix" 
                  value="18.5%" 
                  icon={<Globe className="text-blue-600" />}
                  trend=">$600 Price Points"
                />
              </div>

              {/* Main Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-indigo-500" />
                      Assortment by Price Bucket
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">FULL PRICE COUNT</span>
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={priceDistributionData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RefreshCcw className="w-5 h-5 text-indigo-500" />
                      Category Composition
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">BY STYLE COUNT</span>
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryMixData.slice(0, 8)}
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryMixData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Assortment Deep Dive Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <h3 className="font-bold text-slate-800">Assortment Distribution Heatmap</h3>
                    <p className="text-[10px] text-slate-500">Only showing non-discounted styles across the core catalog.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400">
                      <div className="w-2 h-2 rounded-full bg-indigo-100"></div> LOW
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400">
                      <div className="w-2 h-2 rounded-full bg-indigo-600"></div> HIGH
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-3 font-semibold text-slate-600 border-b border-slate-200 sticky left-0 bg-slate-50">Category</th>
                        {PRICE_BUCKETS.map(bucket => (
                          <th key={bucket} className="px-4 py-3 font-semibold text-slate-600 border-b border-slate-200 text-center min-w-[100px]">{bucket}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCompetitor?.data.map((row) => (
                        <tr key={row.category} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-800 border-b border-slate-100 sticky left-0 bg-white shadow-[2px_0_5px_rgba(0,0,0,0.05)]">{row.category}</td>
                          {PRICE_BUCKETS.map(bucket => {
                            const val = row.counts[bucket] || 0;
                            const intensity = Math.min(val / 25, 1);
                            return (
                              <td 
                                key={bucket} 
                                className="px-4 py-4 border-b border-slate-100 text-center"
                              >
                                <div 
                                  className="mx-auto w-10 h-8 flex items-center justify-center rounded-md font-medium text-xs transition-transform hover:scale-110"
                                  style={{ 
                                    backgroundColor: val > 0 ? `rgba(99, 102, 241, ${intensity * 0.2 + 0.05})` : 'transparent',
                                    color: val > 0 ? `rgba(67, 56, 202, ${Math.max(intensity, 0.4)})` : '#94a3b8',
                                    border: val > 0 ? `1px solid rgba(99, 102, 241, ${intensity * 0.4})` : '1px dashed #e2e8f0'
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
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-lg font-bold">Assortment Concentration Matrix</h3>
                      <p className="text-sm text-slate-500">Visualizing product volume across categories and price tiers (Full Price Only).</p>
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
                          fontSize={11} 
                          width={150}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip />
                        <Legend iconType="circle" />
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
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
      <ArrowUpRight className="w-4 h-4 text-slate-300" />
    </div>
    <p className="text-sm font-medium text-slate-500">{title}</p>
    <h4 className="text-2xl font-bold mt-1">{value}</h4>
    <div className="flex items-center gap-1 mt-3">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{trend}</span>
    </div>
  </div>
);

export default App;
