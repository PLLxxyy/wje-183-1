import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { type TaxResult, type DeductionInput, type YearEndBonusResult, calculateTax, calculateYearEndBonusTax } from '../utils/tax'

interface HistoryRecord {
  id: string;
  date: string;
  incomeType: 'monthly' | 'yearly';
  income: number;
  city: string;
  deductions: DeductionInput;
  result: TaxResult | null;
  yearEndBonus: number;
  bonusResult: YearEndBonusResult | null;
}

function loadHistory(): HistoryRecord[] {
  try {
    return JSON.parse(localStorage.getItem('tax_history') || '[]');
  } catch { return []; }
}

function saveHistory(records: HistoryRecord[]) {
  localStorage.setItem('tax_history', JSON.stringify(records));
}

export default function History() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<HistoryRecord[]>(() => loadHistory());
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const processedRecords = useMemo(() => {
    return records.map(r => ({
      ...r,
      bonusResult: r.yearEndBonus > 0 ? calculateYearEndBonusTax(r.yearEndBonus) : null,
    }));
  }, [records]);

  const fmt = (n: number) => n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const compareRecords = useMemo(() => {
    return processedRecords.filter(r => compareIds.includes(r.id));
  }, [processedRecords, compareIds]);

  const deleteRecord = (id: string) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    saveHistory(updated);
    setCompareIds(prev => prev.filter(x => x !== id));
  };

  const clearAll = () => {
    if (confirm('确定要清空所有历史记录吗？')) {
      setRecords([]);
      saveHistory([]);
      setCompareIds([]);
    }
  };

  const viewRecord = (record: HistoryRecord) => {
    const monthlyIncome = record.incomeType === 'yearly' ? record.income / 12 : record.income;
    navigate('/result', {
      state: {
        result: record.result,
        deductions: record.deductions,
        monthlyIncome,
        incomeType: record.incomeType,
        city: record.city,
        yearEndBonus: record.yearEndBonus,
        bonusResult: record.bonusResult,
      }
    });
  };

  const reCalculate = (record: HistoryRecord) => {
    const monthlyIncome = record.incomeType === 'yearly' ? record.income / 12 : record.income;
    navigate('/', {
      state: {
        incomeType: record.incomeType,
        income: record.income,
        city: record.city,
        deductions: record.deductions,
        yearEndBonus: record.yearEndBonus,
      }
    });
  };

  return (
    <div className="page-container fade-in">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
        <h1 className="page-title" style={{marginBottom:0}}>历史记录</h1>
        {records.length > 0 && (
          <button className="btn btn-outline btn-sm" onClick={clearAll}>清空全部</button>
        )}
      </div>

      {/* 对比区域 */}
      {compareRecords.length >= 2 && (
        <div className="card fade-in" style={{marginBottom:20}}>
          <div className="card-title">方案对比（{compareRecords.length}项）</div>
          <div style={{overflowX:'auto'}}>
            <table className="compare-table">
              <thead>
                <tr>
                  <th>项目</th>
                  {compareRecords.map((r, i) => (
                    <th key={r.id}>方案 {i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareRecords.some(r => r.result) && (
                  <>
                    <tr>
                      <td>税前月收入</td>
                      {compareRecords.map(r => (
                        <td key={r.id}>{r.result ? fmt(r.incomeType === 'yearly' ? r.income / 12 : r.income) : '-'} 元</td>
                      ))}
                    </tr>
                    <tr>
                      <td>城市</td>
                      {compareRecords.map(r => <td key={r.id}>{r.city}</td>)}
                    </tr>
                    <tr>
                      <td>五险一金/月</td>
                      {compareRecords.map(r => (
                        <td key={r.id}>{r.result ? fmt(r.result.totalSocialFundMonthly) : '-'} 元</td>
                      ))}
                    </tr>
                    <tr>
                      <td>专项扣除/月</td>
                      {compareRecords.map(r => (
                        <td key={r.id}>{r.result ? fmt(r.result.specialDeductionsMonthly) : '-'} 元</td>
                      ))}
                    </tr>
                    <tr>
                      <td>应纳税所得额/月</td>
                      {compareRecords.map(r => (
                        <td key={r.id}>{r.result ? fmt(r.result.taxableIncomeMonthly) : '-'} 元</td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{fontWeight:700, color:'var(--danger)'}}>每月个税</td>
                      {compareRecords.map(r => (
                        <td key={r.id} style={{fontWeight:700, color:'var(--danger)'}}>{r.result ? fmt(r.result.taxMonthly) : '-'} 元</td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{fontWeight:700, color:'var(--success)'}}>每月到手</td>
                      {compareRecords.map(r => (
                        <td key={r.id} style={{fontWeight:700, color:'var(--success)'}}>{r.result ? fmt(r.result.netMonthly) : '-'} 元</td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{fontWeight:700, color:'var(--success)'}}>每年到手（工资）</td>
                      {compareRecords.map(r => (
                        <td key={r.id} style={{fontWeight:700, color:'var(--success)'}}>{r.result ? fmt(r.result.netYearly) : '-'} 元</td>
                      ))}
                    </tr>
                  </>
                )}
                {compareRecords.some(r => r.bonusResult) && (
                  <>
                    <tr>
                      <td>年终奖</td>
                      {compareRecords.map(r => (
                        <td key={r.id}>{r.bonusResult ? fmt(r.bonusResult.bonusAmount) : '-'} 元</td>
                      ))}
                    </tr>
                    <tr>
                      <td>年终奖个税</td>
                      {compareRecords.map(r => (
                        <td key={r.id} style={{color:'var(--danger)'}}>{r.bonusResult ? fmt(r.bonusResult.taxAmount) : '-'} 元</td>
                      ))}
                    </tr>
                    <tr>
                      <td style={{fontWeight:700, color:'var(--success)'}}>年终奖税后</td>
                      {compareRecords.map(r => (
                        <td key={r.id} style={{fontWeight:700, color:'var(--success)'}}>{r.bonusResult ? fmt(r.bonusResult.netBonus) : '-'} 元</td>
                      ))}
                    </tr>
                  </>
                )}
                {compareRecords.some(r => r.result && r.bonusResult) && (
                  <tr>
                    <td style={{fontWeight:700, color:'var(--primary)'}}>全年到手总收入</td>
                    {compareRecords.map(r => (
                      <td key={r.id} style={{fontWeight:700, color:'var(--primary)'}}>
                        {r.result && r.bonusResult ? fmt(r.result.netYearly + r.bonusResult.netBonus) : '-'} 元
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {compareRecords.length > 0 && compareRecords.length < 2 && (
        <div style={{
          padding:'10px 16px', background:'var(--warning-light)', borderRadius:'var(--radius-sm)',
          fontSize:13, color:'#92400e', marginBottom:16
        }}>
          请选择至少2条记录进行对比（最多3条）
        </div>
      )}

      {/* 记录列表 */}
      {processedRecords.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p>暂无历史记录</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>去计算</button>
        </div>
      ) : (
        processedRecords.map(record => {
          const isComparing = compareIds.includes(record.id);
          const monthlyIncome = record.incomeType === 'yearly' ? record.income / 12 : record.income;
          return (
            <div className="history-item" key={record.id} style={isComparing ? {outline: '2px solid var(--primary)', outlineOffset: -2} : {}}>
              <div className="history-header">
                <span className="history-date">{record.date}</span>
                <div className="history-tags">
                  <span className="tag tag-blue">{record.city}</span>
                  {record.result && <span className="tag tag-amber">{record.incomeType === 'monthly' ? '月收入' : '年收入'}</span>}
                  {record.bonusResult && <span className="tag tag-purple">年终奖</span>}
                  {record.deductions.childrenEducation && <span className="tag tag-green">子女教育</span>}
                  {record.deductions.housingLoan && <span className="tag tag-green">房贷</span>}
                  {record.deductions.rent && <span className="tag tag-green">房租</span>}
                  {record.deductions.elderlySupport && <span className="tag tag-green">赡养老人</span>}
                  {record.deductions.continuingEducation && <span className="tag tag-green">继续教育</span>}
                </div>
              </div>
              <div className="history-metrics">
                {record.result && (
                  <>
                    <div>
                      <div className="history-metric-label">税前月收入</div>
                      <div className="history-metric-value">{fmt(monthlyIncome)} 元</div>
                    </div>
                    <div>
                      <div className="history-metric-label">每月个税</div>
                      <div className="history-metric-value" style={{color:'var(--danger)'}}>{fmt(record.result.taxMonthly)} 元</div>
                    </div>
                    <div>
                      <div className="history-metric-label">每月到手</div>
                      <div className="history-metric-value" style={{color:'var(--success)'}}>{fmt(record.result.netMonthly)} 元</div>
                    </div>
                  </>
                )}
                {record.bonusResult && (
                  <>
                    <div>
                      <div className="history-metric-label">年终奖</div>
                      <div className="history-metric-value">{fmt(record.bonusResult.bonusAmount)} 元</div>
                    </div>
                    <div>
                      <div className="history-metric-label">年终奖个税</div>
                      <div className="history-metric-value" style={{color:'var(--danger)'}}>{fmt(record.bonusResult.taxAmount)} 元</div>
                    </div>
                    <div>
                      <div className="history-metric-label">年终奖税后</div>
                      <div className="history-metric-value" style={{color:'var(--success)'}}>{fmt(record.bonusResult.netBonus)} 元</div>
                    </div>
                  </>
                )}
              </div>
              <div className="history-actions">
                <button className="btn btn-outline btn-sm" onClick={() => viewRecord(record)}>查看详情</button>
                <button className="btn btn-outline btn-sm" onClick={() => toggleCompare(record.id)}>
                  {isComparing ? '取消对比' : '加入对比'}
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => deleteRecord(record.id)} style={{marginLeft:'auto', color:'var(--danger)', borderColor:'var(--danger)'}}>删除</button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
