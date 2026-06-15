import { useLocation, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { type TaxResult, type DeductionInput, type YearEndBonusResult, getOptimizationTips, MONTHLY_THRESHOLD, calculateYearEndBonusTax } from '../utils/tax'

interface LocationState {
  result: TaxResult | null;
  deductions: DeductionInput;
  monthlyIncome: number;
  incomeType: 'monthly' | 'yearly';
  city: string;
  yearEndBonus: number;
  bonusResult: YearEndBonusResult | null;
}

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;
  const [view, setView] = useState<'monthly' | 'yearly'>('monthly');
  const [showOptimization, setShowOptimization] = useState(false);

  if (!state || (!state.result && !(state.yearEndBonus > 0))) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
          </svg>
          <p>没有计算数据，请先进行计算</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>去计算</button>
        </div>
      </div>
    );
  }

  const { result, deductions, monthlyIncome, city, yearEndBonus } = state;

  const bonusResult = useMemo(
    () => (yearEndBonus > 0 ? calculateYearEndBonusTax(yearEndBonus) : null),
    [yearEndBonus]
  );

  const tips = useMemo(() => {
    if (!result) return [];
    return getOptimizationTips(monthlyIncome, deductions, result);
  }, [monthlyIncome, deductions, result]);
  const totalPotentialSaving = tips.reduce((s, t) => s + t.potentialSaving, 0);
  const mult = view === 'yearly' ? 12 : 1;
  const fmt = (n: number) => (n * mult).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtM = (n: number) => n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const siBase = deductions.socialInsuranceBase || monthlyIncome;

  const totalTax = (result ? result.taxYearly : 0) + (bonusResult ? bonusResult.taxAmount : 0);
  const totalNet = (result ? result.netYearly : 0) + (bonusResult ? bonusResult.netBonus : 0);
  const totalGross = (result ? result.grossYearly : 0) + (bonusResult ? bonusResult.bonusAmount : 0);
  const fmtYear = (n: number) => n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="page-container fade-in">
      {/* Hero */}
      <div className="result-hero">
        <div className="result-hero-label">
          {result && bonusResult ? '全年到手总收入' : (result ? (view === 'monthly' ? '每月到手收入' : '每年到手收入') : '年终奖税后收入')}
        </div>
        <div className="result-hero-amount">
          {result && bonusResult ? fmtYear(totalNet) : (result ? fmt(result.netMonthly) : fmtYear(bonusResult?.netBonus || 0))} 元
        </div>
        <div className="result-hero-sub">
          {result && bonusResult
            ? `税前年收入 ${fmtYear(totalGross)} 元，缴纳个税 ${fmtYear(totalTax)} 元`
            : result
              ? `税前${view === 'monthly' ? '月' : '年'}收入 ${fmt(result.grossMonthly)} 元，缴纳个税 ${fmt(result.taxMonthly)} 元`
              : `年终奖 ${fmtYear(bonusResult?.bonusAmount || 0)} 元，缴纳个税 ${fmtYear(bonusResult?.taxAmount || 0)} 元`
          }
        </div>
      </div>

      {/* 视图切换 */}
      {result && (
        <div className="view-toggle">
          <button className={view === 'monthly' ? 'active' : ''} onClick={() => setView('monthly')}>月度</button>
          <button className={view === 'yearly' ? 'active' : ''} onClick={() => setView('yearly')}>年度</button>
        </div>
      )}

      {/* 统计卡片 */}
      {result && (
        <div className="result-grid">
          <div className="result-stat">
            <div className="result-stat-label">税前收入</div>
            <div className="result-stat-value primary">{fmt(result.grossMonthly)} 元</div>
          </div>
          <div className="result-stat">
            <div className="result-stat-label">应纳税所得额</div>
            <div className="result-stat-value">{fmt(result.taxableIncomeMonthly)} 元</div>
          </div>
          <div className="result-stat">
            <div className="result-stat-label">应缴个税</div>
            <div className="result-stat-value danger">{fmt(result.taxMonthly)} 元</div>
          </div>
          <div className="result-stat">
            <div className="result-stat-label">五险一金扣除</div>
            <div className="result-stat-value">{fmt(result.totalSocialFundMonthly)} 元</div>
          </div>
        </div>
      )}

      {/* 年终奖统计 */}
      {bonusResult && (
        <div className="result-grid" style={{gridTemplateColumns: 'repeat(2, 1fr)'}}>
          <div className="result-stat">
            <div className="result-stat-label">年终奖金额</div>
            <div className="result-stat-value primary">{fmtYear(bonusResult.bonusAmount)} 元</div>
          </div>
          <div className="result-stat">
            <div className="result-stat-label">年终奖个税</div>
            <div className="result-stat-value danger">{fmtYear(bonusResult.taxAmount)} 元</div>
          </div>
        </div>
      )}

      {/* 详细计算过程 */}
      {result && (
        <div className="card">
          <div className="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            详细计算过程（{view === 'monthly' ? '月度' : '年度'}）
          </div>
          <table className="breakdown-table">
            <thead>
              <tr>
                <th>项目</th>
                <th style={{textAlign:'right'}}>金额（元）</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>税前收入</td>
                <td className="amount">{fmtM(result.grossMonthly * mult)}</td>
              </tr>
              <tr>
                <td style={{paddingLeft:28}}>- 起征点（免征额）</td>
                <td className="amount" style={{color:'var(--gray-500)'}}>- {fmtM(MONTHLY_THRESHOLD * mult)}</td>
              </tr>
              <tr>
                <td style={{paddingLeft:28}}>- 社保个人缴纳（{deductions.socialInsuranceRate}%）</td>
                <td className="amount" style={{color:'var(--gray-500)'}}>- {fmtM(siBase * deductions.socialInsuranceRate / 100 * 1 * mult)}</td>
              </tr>
              <tr>
                <td style={{paddingLeft:28}}>- 公积金（个人 {deductions.housingFundRate}%）</td>
                <td className="amount" style={{color:'var(--gray-500)'}}>- {fmtM(siBase * deductions.housingFundRate / 100 * 1 * mult)}</td>
              </tr>
              {result.specialDeductionsDetail.map((d, i) => (
                <tr key={i}>
                  <td style={{paddingLeft:28}}>- {d.name}</td>
                  <td className="amount" style={{color:'var(--gray-500)'}}>- {fmtM(d.amount * mult)}</td>
                </tr>
              ))}
              <tr className="highlight">
                <td>应纳税所得额</td>
                <td className="amount">{fmtM(result.taxableIncomeMonthly * mult)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 税率逐级计算 */}
      {result && (
        <div className="card">
          <div className="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            累进税率逐级计算
          </div>
          {result.bracketDetails.length === 0 ? (
            <p style={{color:'var(--gray-500)', fontSize:14}}>应纳税所得额为0，无需缴税</p>
          ) : (
            <>
              <div className="tax-bracket-row" style={{fontWeight:600, color:'var(--gray-500)', fontSize:12}}>
                <span className="bracket-range">税率区间</span>
                <span className="bracket-rate">税率</span>
                <span className="bracket-amount">应税金额</span>
                <span className="bracket-tax">税额</span>
              </div>
              {result.bracketDetails.map((b, i) => (
                <div className="tax-bracket-row" key={i}>
                  <span className="bracket-range">{b.range}</span>
                  <span className="bracket-rate">{(b.rate * 100).toFixed(0)}%</span>
                  <span className="bracket-amount">{fmtM(b.taxableAmount * mult)} 元</span>
                  <span className="bracket-tax">{fmtM(b.taxAmount * mult)} 元</span>
                </div>
              ))}
              <div className="tax-bracket-row" style={{borderTop:'2px solid var(--gray-300)', fontWeight:700, marginTop:8, paddingTop:12}}>
                <span className="bracket-range">合计</span>
                <span className="bracket-rate"></span>
                <span className="bracket-amount">{fmtM(result.taxableIncomeMonthly * mult)} 元</span>
                <span className="bracket-tax">{fmtM(result.taxMonthly * mult)} 元</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* 年终奖个税明细 */}
      {bonusResult && (
        <div className="card">
          <div className="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            年终奖个税明细
          </div>
          <table className="breakdown-table">
            <thead>
              <tr>
                <th>项目</th>
                <th style={{textAlign:'right'}}>金额（元）</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>年终奖金额</td>
                <td className="amount">{fmtYear(bonusResult.bonusAmount)}</td>
              </tr>
              <tr>
                <td style={{paddingLeft:28}}>÷ 12（月均）</td>
                <td className="amount" style={{color:'var(--gray-500)'}}>{fmtYear(bonusResult.monthlyBonus)}</td>
              </tr>
              <tr>
                <td style={{paddingLeft:28}}>适用税率</td>
                <td className="amount" style={{color:'var(--gray-500)'}}>{(bonusResult.applicableRate * 100).toFixed(0)}%</td>
              </tr>
              <tr>
                <td style={{paddingLeft:28}}>税率区间</td>
                <td className="amount" style={{color:'var(--gray-500)'}}>{bonusResult.bracketRange}</td>
              </tr>
              <tr className="highlight">
                <td>应缴个税</td>
                <td className="amount">{fmtYear(bonusResult.taxAmount)}</td>
              </tr>
              <tr>
                <td>税后年终奖</td>
                <td className="amount" style={{color:'var(--success)', fontWeight:600}}>{fmtYear(bonusResult.netBonus)}</td>
              </tr>
            </tbody>
          </table>
          <p className="form-hint" style={{marginTop:12, marginBottom:0}}>
            计算公式：应纳税额 = 年终奖 × 适用税率
          </p>
        </div>
      )}

      {/* 优化建议 */}
      {result && (
        <div className="card">
          <div className="card-title" style={{justifyContent:'space-between'}}>
            <span style={{display:'flex', alignItems:'center', gap:8}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              优化建议
            </span>
            {totalPotentialSaving > 0 && (
              <span className="tag tag-green">最多可省 {totalPotentialSaving.toLocaleString()} 元/年</span>
            )}
          </div>
          {tips.length === 0 ? (
            <p style={{color:'var(--gray-500)', fontSize:14}}>您已充分利用所有扣除项</p>
          ) : (
            tips.map((tip, i) => (
              <div className={`optimization-card ${tip.type === 'saving' ? 'saving' : ''}`} key={i}>
                <div className="optimization-title">{tip.title}</div>
                <div className="optimization-desc">{tip.description}</div>
                {tip.potentialSaving > 0 && (
                  <div className="optimization-amount">每年可省约 {tip.potentialSaving.toLocaleString()} 元</div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 底部操作 */}
      <div style={{display:'flex', gap:12, marginTop:8}}>
        <button className="btn btn-outline" onClick={() => navigate('/')} style={{flex:1}}>重新计算</button>
        <button className="btn btn-outline" onClick={() => navigate('/history')} style={{flex:1}}>查看历史</button>
      </div>
    </div>
  );
}
