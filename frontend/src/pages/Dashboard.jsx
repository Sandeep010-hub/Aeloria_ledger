import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api.js';
import { AuthContext } from '../context/AuthContext.jsx';
import { ToastContext } from '../context/ToastContext.jsx';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch statistics on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get('/dashboard/stats');
        if (res.data.success) {
          setStats(res.data.data);
        } else {
          showToast('Failed to load dashboard metrics', 'error');
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        showToast('Error connecting to backend API', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const getCurrencySymbol = () => {
    const currency = user?.companyDetails?.currency || 'USD';
    if (currency === 'EUR') return '€';
    if (currency === 'GBP') return '£';
    if (currency === 'INR') return '₹';
    return '$';
  };

  const formatCurrency = (val) => {
    const symbol = getCurrencySymbol();
    return `${symbol}${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '12px' }}>
        {/* Metric Cards Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-panel" style={{ height: '110px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ width: '40%', height: '14px', backgroundColor: 'var(--surface-variant)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
              <div style={{ width: '70%', height: '28px', backgroundColor: 'var(--surface-variant)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
            </div>
          ))}
        </div>
        {/* Chart Skeleton */}
        <div className="glass-panel" style={{ height: '350px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '80%', height: '80%', backgroundColor: 'var(--surface-variant)', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
        </div>
        <style>{`
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 0.3; }
            100% { opacity: 0.6; }
          }
        `}</style>
      </div>
    );
  }

  const { summary, chartData, recentTransactions } = stats || {
    summary: { totalRevenue: 0, totalExpenses: 0, netProfit: 0, pendingPayments: 0, activeClients: 0 },
    chartData: [],
    recentTransactions: []
  };

  // SVG Chart Calculation Helpers
  const maxChartVal = Math.max(
    ...chartData.map(d => Math.max(d.revenue, d.expense, 1000)),
    5000
  );
  
  const chartHeight = 180;
  const chartWidth = 500;
  const paddingX = 40;
  const paddingY = 20;
  
  const pointsRevenue = chartData.map((d, i) => {
    const x = paddingX + (i * (chartWidth - paddingX * 2) / Math.max(chartData.length - 1, 1));
    const y = chartHeight - paddingY - (d.revenue / maxChartVal * (chartHeight - paddingY * 2));
    return { x, y, val: d.revenue, label: d.month };
  });

  const pointsExpense = chartData.map((d, i) => {
    const x = paddingX + (i * (chartWidth - paddingX * 2) / Math.max(chartData.length - 1, 1));
    const y = chartHeight - paddingY - (d.expense / maxChartVal * (chartHeight - paddingY * 2));
    return { x, y, val: d.expense, label: d.month };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Quick Action Top bar Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--on-surface)' }}>
            Welcome back, {user?.name}
          </h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', marginTop: '2px' }}>
            Enterprise overview for {user?.companyDetails?.companyName || 'Aeloria Workspace'}.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/invoices" className="btn btn-primary" style={{ padding: '10px 18px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
            Issue Invoice
          </Link>
          <Link to="/clients" className="btn btn-secondary" style={{ padding: '10px 18px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
            Add Client
          </Link>
        </div>
      </div>

      {/* METRIC SUMMARIES */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '24px'
      }}>
        {/* Metric 1 */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Gross Revenue
            </span>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>payments</span>
          </div>
          <h3 className="lining-numbers" style={{ fontSize: '32px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '-0.02em', margin: '4px 0' }}>
            {formatCurrency(summary.totalRevenue)}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--on-surface-variant)' }}>
            <span className="badge badge-success" style={{ fontSize: '10px', padding: '1px 6px', whiteSpace: 'nowrap' }}>SOCIALLY CLEAR</span>
            <span>Settled Ledger balances</span>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', backgroundColor: 'var(--primary)' }} />
        </div>

        {/* Metric 2 */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Outstanding Receivables
            </span>
            <span className="material-symbols-outlined" style={{ color: 'var(--warning)', fontSize: '20px' }}>receipt_long</span>
          </div>
          <h3 className="lining-numbers" style={{ fontSize: '32px', fontWeight: '800', color: 'var(--warning)', letterSpacing: '-0.02em', margin: '4px 0' }}>
            {formatCurrency(summary.pendingPayments)}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--on-surface-variant)' }}>
            <span className="badge" style={{ backgroundColor: 'var(--warning-container)', color: 'var(--on-warning-container)', fontSize: '10px', padding: '1px 6px', whiteSpace: 'nowrap' }}>PENDING</span>
            <span>Unpaid Invoices</span>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', backgroundColor: 'var(--warning)' }} />
        </div>

        {/* Metric 3 */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Expenses
            </span>
            <span className="material-symbols-outlined" style={{ color: 'var(--error)', fontSize: '20px' }}>shopping_bag</span>
          </div>
          <h3 className="lining-numbers" style={{ fontSize: '32px', fontWeight: '800', color: 'var(--error)', letterSpacing: '-0.02em', margin: '4px 0' }}>
            {formatCurrency(summary.totalExpenses)}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--on-surface-variant)' }}>
            <span className="badge" style={{ backgroundColor: 'var(--error-container)', color: 'var(--on-error-container)', fontSize: '10px', padding: '1px 6px', whiteSpace: 'nowrap' }}>OUTFLOW</span>
            <span>Operating Expenditures</span>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', backgroundColor: 'var(--error)' }} />
        </div>

        {/* Metric 4 */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Net Operational Profit
            </span>
            <span className="material-symbols-outlined" style={{ color: summary.netProfit >= 0 ? 'var(--success)' : 'var(--error)', fontSize: '20px' }}>
              {summary.netProfit >= 0 ? 'trending_up' : 'trending_down'}
            </span>
          </div>
          <h3 className="lining-numbers" style={{ fontSize: '32px', fontWeight: '800', color: summary.netProfit >= 0 ? 'var(--success)' : 'var(--error)', letterSpacing: '-0.02em', margin: '4px 0' }}>
            {formatCurrency(summary.netProfit)}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--on-surface-variant)' }}>
            <span className="badge badge-success" style={{ fontSize: '10px', padding: '1px 6px', whiteSpace: 'nowrap' }}>
              {summary.netProfit >= 0 ? 'NET GAIN' : 'LOSS'}
            </span>
            <span>Taxable Operating Margin</span>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', backgroundColor: summary.netProfit >= 0 ? 'var(--success)' : 'var(--error)' }} />
        </div>
      </div>

      {/* GRAPH CHART & TRANSACTION ROWS SPLIT */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '7fr 5fr',
        gap: '24px',
        alignItems: 'start'
      }} className="dashboard-layout-split">
        
        {/* SVG FINANCIAL TIMELINE CHART */}
        <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.01em' }}>
                Operational Revenue vs Expenditures
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
                Chronological financial history for the past 6 months.
              </p>
            </div>
            
            {/* Chart Legend */}
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', fontWeight: '600' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '4px', backgroundColor: 'var(--primary)', borderRadius: '2px', display: 'inline-block' }} />
                <span style={{ color: 'var(--on-surface-variant)' }}>Revenue</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '4px', backgroundColor: 'var(--error)', borderRadius: '2px', display: 'inline-block' }} />
                <span style={{ color: 'var(--on-surface-variant)' }}>Expenses</span>
              </div>
            </div>
          </div>

          {/* SVG Canvas Area */}
          <div style={{ width: '100%', overflowX: 'auto' }} className="custom-scrollbar">
            <svg 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
              style={{ width: '100%', minWidth: '450px', height: 'auto', display: 'block' }}
            >
              {/* Grid Background Horizontal Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                const y = paddingY + ratio * (chartHeight - paddingY * 2);
                const val = maxChartVal * (1 - ratio);
                return (
                  <g key={index}>
                    <line 
                      x1={paddingX} 
                      y1={y} 
                      x2={chartWidth - paddingX} 
                      y2={y} 
                      stroke="var(--surface-variant)" 
                      strokeWidth="0.5" 
                      strokeDasharray="4 4" 
                    />
                    <text 
                      x={paddingX - 8} 
                      y={y + 3} 
                      fontSize="9" 
                      fill="var(--outline)" 
                      textAnchor="end"
                      className="lining-numbers"
                      fontWeight="500"
                    >
                      {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(0)}
                    </text>
                  </g>
                );
              })}

              {/* Month Labels under chart */}
              {chartData.map((d, i) => {
                const x = paddingX + (i * (chartWidth - paddingX * 2) / Math.max(chartData.length - 1, 1));
                return (
                  <text 
                    key={i} 
                    x={x} 
                    y={chartHeight - 4} 
                    fontSize="9" 
                    fill="var(--outline)" 
                    textAnchor="middle"
                    fontWeight="600"
                  >
                    {d.month}
                  </text>
                );
              })}

              {/* Area Under Lines (Gradients) */}
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--error)" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="var(--error)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Revenue Area */}
              {pointsRevenue.length > 0 && (
                <path 
                  d={`
                    M ${pointsRevenue[0].x} ${chartHeight - paddingY}
                    ${pointsRevenue.map(p => `L ${p.x} ${p.y}`).join(' ')}
                    L ${pointsRevenue[pointsRevenue.length - 1].x} ${chartHeight - paddingY}
                    Z
                  `} 
                  fill="url(#revenueGrad)"
                />
              )}

              {/* Expense Area */}
              {pointsExpense.length > 0 && (
                <path 
                  d={`
                    M ${pointsExpense[0].x} ${chartHeight - paddingY}
                    ${pointsExpense.map(p => `L ${p.x} ${p.y}`).join(' ')}
                    L ${pointsExpense[pointsExpense.length - 1].x} ${chartHeight - paddingY}
                    Z
                  `} 
                  fill="url(#expenseGrad)"
                />
              )}

              {/* Connecting Stroke Paths */}
              {pointsRevenue.length > 0 && (
                <path 
                  d={pointsRevenue.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')} 
                  fill="none" 
                  stroke="var(--primary)" 
                  strokeWidth="2" 
                />
              )}

              {pointsExpense.length > 0 && (
                <path 
                  d={pointsExpense.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')} 
                  fill="none" 
                  stroke="var(--error)" 
                  strokeWidth="1.5" 
                  strokeDasharray="2 1" 
                />
              )}

              {/* Circle Points */}
              {pointsRevenue.map((p, i) => (
                <circle 
                  key={i} 
                  cx={p.x} 
                  cy={p.y} 
                  r="3.5" 
                  fill="#ffffff" 
                  stroke="var(--primary)" 
                  strokeWidth="1.5" 
                  style={{ cursor: 'pointer' }}
                />
              ))}

              {pointsExpense.map((p, i) => (
                <circle 
                  key={i} 
                  cx={p.x} 
                  cy={p.y} 
                  r="3" 
                  fill="#ffffff" 
                  stroke="var(--error)" 
                  strokeWidth="1.5" 
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </svg>
          </div>
        </div>

        {/* RECENT TRANSACTIONS LEDGER ACTIVITY */}
        <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.01em' }}>
              Recent Ledger Streams
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
              Real-time activity logs.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentTransactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--on-surface-variant)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--outline-variant)', marginBottom: '8px' }}>
                  account_balance_wallet
                </span>
                <p style={{ fontSize: '13px', fontWeight: '500' }}>No recent ledger events posted.</p>
              </div>
            ) : (
              recentTransactions.map((tx) => (
                <div 
                  key={tx._id} 
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--surface-variant)',
                    backgroundColor: 'var(--surface-container-lowest)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: tx.type === 'Income' ? 'var(--success-container)' : 'var(--error-container)',
                      color: tx.type === 'Income' ? 'var(--success)' : 'var(--error)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                        {tx.type === 'Income' ? 'south_west' : 'north_east'}
                      </span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {tx.title}
                      </h4>
                      <p style={{ fontSize: '11px', color: 'var(--on-surface-variant)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>
                        {tx.details} • {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span 
                      className="lining-numbers" 
                      style={{ 
                        fontSize: '14px', 
                        fontWeight: '700', 
                        color: tx.type === 'Income' ? 'var(--primary)' : 'var(--error)' 
                      }}
                    >
                      {tx.type === 'Income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                    <div style={{ marginTop: '2px' }}>
                      <span className={`badge ${tx.type === 'Income' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '8px', padding: '0px 6px' }}>
                        {tx.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 992px) {
          .dashboard-layout-split {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
