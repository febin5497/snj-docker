import { useState, useEffect, useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import api from "../../api/api"
import { useToast } from "../../components/Toast"
import "../../styles/Dashboard.css"

const BLUE = "#3B82F6"
const ORANGE = "#F59E0B"
const COLORS = [BLUE, "#10B981", ORANGE, "#EF4444", "#8B5CF6", "#06B6D4", "#EC4899"]

function n(v) { return v ?? 0 }

function fmt(n) {
  if (!n) return "₹0"
  const a = Math.abs(n)
  if (a >= 1e7) return `₹${(a / 1e7).toFixed(1)}Cr`
  if (a >= 1e5) return `₹${(a / 1e5).toFixed(1)}L`
  if (a >= 1e3) return `₹${(a / 1e3).toFixed(1)}K`
  return `₹${Math.round(a).toLocaleString('en-IN')}`
}

function ago(ts) {
  if (!ts) return ""
  try {
    const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
    if (s < 60) return "Just now"
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`
    if (s < 604800) return `${Math.floor(s / 86400)}d ago`
    return new Date(ts).toLocaleDateString()
  } catch { return "" }
}

function Gauge({ pct, color = BLUE, size = 104 }) {
  const s = 6, r = (size - s) / 2, c = Math.PI * r, off = c * (1 - Math.min(Math.max(pct, 0), 100) / 100)
  const cx = size / 2, cy = size / 2
  return (
    <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
      <path d={`M ${s / 2} ${cy} A ${r} ${r} 0 0 1 ${size - s / 2} ${cy}`} fill="none" stroke="#E8EDF2" strokeWidth={s} strokeLinecap="round" />
      <path d={`M ${s / 2} ${cy} A ${r} ${r} 0 0 1 ${size - s / 2} ${cy}`} fill="none" stroke={color} strokeWidth={s} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={20} fontWeight={700} fill="#1E293B" fontFamily="Inter,system-ui,sans-serif">
        {Math.round(pct)}<tspan fontSize={11} fill="#94A3B8">%</tspan>
      </text>
    </svg>
  )
}

function Avatar({ name, color }) {
  const init = (name || "?").split(" ").map(s => s[0]).join("").toUpperCase().slice(0, 2)
  return <div className="av" style={{ background: color || BLUE }}>{init}</div>
}

function HeroCard({ project, totalIncome, totalExpense, balance, margin }) {
  const p = project || { name: "No projects yet", progress: 0, status: "pending" }
  const statusColor = p.status === 'active' || p.status === 'in_progress' ? "#10B981" : p.status === 'pending' ? ORANGE : "#94A3B8"
  const sl = (p.status || "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
  return (
    <div className="hero-crd">
      <div className="hero-bg" />
      <div className="hero-inner">
        <div className="hero-top">
          <div>
            <span className="hero-tag">Current Project</span>
            <h2 className="hero-title">{p.name}</h2>
            <p className="hero-desc">Commercial construction · Downtown development · Phase 2</p>
          </div>
          <span className="hero-badge" style={{ color: statusColor, background: `${statusColor}12` }}>{sl}</span>
        </div>
        <div className="hero-mid">
          <div className="hero-prog">
            <div className="hero-prog-top">
              <span className="hero-prog-l">Overall Progress</span>
              <span className="hero-prog-v">{p.progress}%</span>
            </div>
            <div className="hero-bar"><div className="hero-bar-f" style={{ width: `${p.progress}%` }} /></div>
          </div>
          <div className="hero-stats">
            <div className="hero-stat"><span className="hero-stat-v">{fmt(totalIncome)}</span><span className="hero-stat-l">Revenue</span></div>
            <div className="hero-stat"><span className="hero-stat-v">{fmt(totalExpense)}</span><span className="hero-stat-l">Expenses</span></div>
            <div className="hero-stat"><span className="hero-stat-v" style={{ color: balance >= 0 ? "#10B981" : "#EF4444" }}>{fmt(balance)}</span><span className="hero-stat-l">{margin}% margin</span></div>
          </div>
        </div>
        <div className="hero-btm">
          <div className="hero-team">
            <Avatar name="John D" color="#3B82F6" />
            <Avatar name="Sarah M" color="#10B981" />
            <Avatar name="Raj K" color="#F59E0B" />
            <div className="av av-more">+2</div>
          </div>
          <div className="hero-meta">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            <span>Deadline: Dec 2026</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function GaugeCard({ pct, label, sub, color = BLUE }) {
  return (
    <div className="gcrd">
      <Gauge pct={pct} color={color} size={100} />
      <div className="gcrd-l">{label}</div>
      <div className="gcrd-s">{sub}</div>
    </div>
  )
}

export default function Dashboard() {
  const { showError } = useToast()
  const [loading, setLoading] = useState(true)
  const [raw, setRaw] = useState({})

  useEffect(() => {
    async function load() {
      setLoading(true)
      const ok = r => r?.data?.success && r?.data?.data
      const ar = r => ok(r) ? (Array.isArray(r.data.data) ? r.data.data : []) : []
      const w = p => p.then(r => r).catch(() => ({ data: { success: false, data: null } }))
      try {
        const [pr, sr, vr, fr, br, er, lr, tr] = await Promise.all([
          w(api.get('/api/projects?per_page=100')), w(api.get('/api/staff?per_page=100')),
          w(api.get('/api/vehicles?per_page=100')), w(api.get('/api/finance/summary')),
          w(api.get('/api/finance/budgets?per_page=50')), w(api.get('/api/equipment/stats')),
          w(api.get('/api/admin/activity-logs?per_page=10')), w(api.get('/api/finance/transactions?per_page=10')),
        ])
        const projects = ar(pr), staff = ar(sr), vehicles = ar(vr), budgets = ar(br)
        const txs = ar(tr).slice(0, 6), logs = ar(lr).slice(0, 6)

        let ti = 0, te = 0
        if (ok(fr)) { ti = n(fr.data.data.total_income); te = n(fr.data.data.total_expense) }

        let mr = 0
        try { const dr = await api.get('/api/dashboard'); if (ok(dr)) mr = n(dr.data.data.monthlyRevenue) } catch {}

        let bu = 0, bt = 0
        budgets.forEach(b => { bt += n(b.allocated_amount || b.budget_amount); bu += n(b.used_amount) })

        let ea = 0, et = 0
        if (ok(er)) { et = n(er.data.data.total); ea = n(er.data.data.active || er.data.data.available) }

        let cats = []
        try {
          const all = await api.get('/api/finance/transactions?per_page=500')
          const a = ar(all); const m = {}
          a.forEach(x => { const c = x.category || 'Other'; m[c] = (m[c] || 0) + Math.abs(n(x.amount)) })
          cats = Object.entries(m).map(([n, v]) => ({ name: n, value: v })).sort((a, b) => b.value - a.value).slice(0, 6)
        } catch {}

        setRaw({ projects, staff, vehicles, ti, te, mr, bu, bt, ea, et, txs, logs, cats })
      } catch { showError('Failed to load') }
      setLoading(false)
    }
    load()
  }, [])

  const metrics = useMemo(() => {
    const { projects, staff, vehicles, ti, te, mr, bu, bt, ea, et, txs, logs, cats } = raw
    const count = n(projects?.length)
    const activeStaff = staff?.filter(s => s.status !== 'inactive').length || 0
    const balance = ti - te
    const margin = ti > 0 ? ((balance / ti) * 100).toFixed(1) : "0.0"
    const bpct = bt > 0 ? Math.round((bu / bt) * 100) : 0
    const avgProgress = projects?.length > 0 ? Math.round(projects.reduce((s, p) => s + n(p.progress), 0) / projects.length) : 0
    const staffUtil = activeStaff > 0 ? Math.round((activeStaff / Math.max(activeStaff + 3, 1)) * 100) : 0
    const equipUtil = et > 0 ? Math.round((ea / et) * 100) : 0
    const resourcePct = Math.round((staffUtil + equipUtil) / 2)
    const monthlyTarget = ti > 0 && ti / 12 > 0 ? Math.round((mr / (ti / 12)) * 100) : 0
    const revPct = Math.min(monthlyTarget, 100)
    const featured = projects?.[0] || null
    return { count, activeStaff, ti, te, mr, balance, margin, bpct, avgProgress, resourcePct, revPct, featured, projects: projects?.slice(0, 4) || [], txs, logs, cats, bu, bt }
  }, [raw])

  if (loading) return (
    <div className="db" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <span style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#94A3B8', fontSize: 14 }}>Loading dashboard…</span>
    </div>
  )

  const { count, ti, te, mr, balance, margin, bpct, avgProgress, resourcePct, revPct, featured, projects, txs, logs, cats, bu, bt } = metrics

  return (
    <div className="db">
      <div className="db-inner">
        <div className="db-g">
          <div className="col-8">
            <HeroCard project={featured} totalIncome={ti} totalExpense={te} balance={balance} margin={margin} />
          </div>
          <div className="col-4">
            <div className="alert-crd">
              <div className="alert-h">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2"><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg>
                <span>Activity Feed</span>
              </div>
              <div className="alert-l">
                {logs.length > 0 ? logs.map((a, i) => (
                  <div key={i} className="alert-i">
                    <div className="alert-d" />
                    <div>
                      <p className="alert-msg">{a.action} {a.entity_type || ''}</p>
                      <p className="alert-t">{ago(a.created_at || a.timestamp)}</p>
                    </div>
                  </div>
                )) : <p style={{ color: '#94A3B8', fontSize: 13, padding: 16, textAlign: 'center' }}>No recent activity</p>}
              </div>
              <button className="alert-btn">View All Activity →</button>
            </div>
          </div>
        </div>

        <div className="db-g">
          <div className="col-3">
            <GaugeCard pct={bpct} label="Budget Utilization" sub={`${fmt(bu)} / ${fmt(bt)}`} color={bpct > 80 ? "#EF4444" : BLUE} />
          </div>
          <div className="col-3">
            <GaugeCard pct={avgProgress} label="Project Progress" sub={`${count} projects`} color="#10B981" />
          </div>
          <div className="col-3">
            <GaugeCard pct={resourcePct} label="Resource Allocation" sub="Staff & Equipment" color={ORANGE} />
          </div>
          <div className="col-3">
            <GaugeCard pct={revPct} label="Revenue Target" sub={`${fmt(mr)} this month`} color="#8B5CF6" />
          </div>
        </div>

        <div className="db-g">
          <div className="col-6">
            <div className="acrd">
              <div className="acrd-h">
                <span>Income vs Expenses</span>
                <span className="acrd-badge" style={{ color: '#10B981', background: '#10B98112' }}>Net {fmt(balance)}</span>
              </div>
              <div className="acrd-body">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[{ n: 'Income', v: ti }, { n: 'Expenses', v: te }]} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="n" tick={{ fontSize: 12, fill: '#94A3B8', fontFamily: 'Inter,system-ui,sans-serif' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'Inter,system-ui,sans-serif' }} tickFormatter={v => `₹${(v / 1e5).toFixed(0)}L`} width={45} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontFamily: 'Inter,system-ui,sans-serif', fontSize: 12 }} formatter={v => [fmt(v), 'Amount']} />
                    <Bar dataKey="v" radius={[6, 6, 0, 0]} barSize={50}>
                      <Cell fill={BLUE} /><Cell fill={ORANGE} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="acrd-f">
                <span><span style={{ color: BLUE }}>●</span> Income: {fmt(ti)}</span>
                <span><span style={{ color: ORANGE }}>●</span> Expenses: {fmt(te)}</span>
                <span><span style={{ color: balance >= 0 ? '#10B981' : '#EF4444' }}>●</span> Profit: {fmt(balance)}</span>
              </div>
            </div>
          </div>
          <div className="col-6">
            <div className="acrd">
              <div className="acrd-h">
                <span>Spending by Category</span>
              </div>
              <div className="acrd-body" style={{ display: 'flex', alignItems: 'center' }}>
                {logs.length > 0 || cats.length > 0 ? (
                  <>
                    <ResponsiveContainer width="55%" height={200}>
                      <PieChart>
                        <Pie data={cats.length > 0 ? cats : [{ name: 'No Data', value: 1 }]} cx="50%" cy="50%" outerRadius={72} innerRadius={48} paddingAngle={3} dataKey="value">
                          {cats.length > 0 ? cats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />) : <Cell fill="#E8EDF2" />}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontFamily: 'Inter,system-ui,sans-serif', fontSize: 12 }} formatter={v => [fmt(v), 'Amount']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pie-legend">
                      {(cats.length > 0 ? cats : []).map((c, i) => (
                        <div key={i} className="pl-i"><span style={{ background: COLORS[i % COLORS.length] }} />{c.name}</div>
                      ))}
                    </div>
                  </>
                ) : <div style={{ flex: 1, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No transaction data</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="db-g" style={{ marginBottom: 0 }}>
          <div className="col-6">
            <div className="acrd">
              <div className="acrd-h">
                <span>Recent Transactions</span>
              </div>
              {txs.length > 0 ? (
                <div className="tx-tbl">
                  <div className="tx-th"><span>Date</span><span>Category</span><span style={{ textAlign: 'right' }}>Amount</span></div>
                  {txs.map((t, i) => (
                    <div key={i} className="tx-tr">
                      <span className="tx-td">{t.date || '—'}</span>
                      <span className="tx-tc"><span className={`tx-dot ${t.type}`} />{t.category || '—'}</span>
                      <span className={`tx-ta ${t.type}`}>{t.type === 'income' ? '+' : '-'}{fmt(t.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : <div className="acrd-empty">No transactions</div>}
            </div>
          </div>
          <div className="col-6">
            <div className="acrd">
              <div className="acrd-h">
                <span>Active Projects</span>
              </div>
              {projects.length > 0 ? (
                <div className="proj-tbl">
                  {projects.map((p, i) => (
                    <div key={i} className="proj-tr">
                      <div className="proj-tl">
                        <span className="proj-tn">{p.name}</span>
                        <span className="proj-ts" style={{
                          color: p.status === 'active' || p.status === 'in_progress' ? '#10B981' : p.status === 'pending' ? ORANGE : '#94A3B8',
                          background: (p.status === 'active' || p.status === 'in_progress' ? '#10B981' : p.status === 'pending' ? ORANGE : '#94A3B8') + '15'
                        }}>{(p.status || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                      </div>
                      <div className="proj-tbar"><div className="proj-tbf" style={{ width: `${p.progress}%` }} /></div>
                      <span className="proj-tp">{p.progress}%</span>
                    </div>
                  ))}
                </div>
              ) : <div className="acrd-empty">No projects</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
