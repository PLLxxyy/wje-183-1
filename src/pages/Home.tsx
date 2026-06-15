import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { CITIES, getCityByName } from '../utils/cities'
import { calculateTax, calculateYearEndBonusTax, type DeductionInput, type YearEndBonusResult } from '../utils/tax'

interface HistoryRecord {
  id: string;
  date: string;
  incomeType: 'monthly' | 'yearly';
  income: number;
  city: string;
  deductions: DeductionInput;
  result: ReturnType<typeof calculateTax> | null;
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

export default function Home() {
  const navigate = useNavigate();
  const [incomeType, setIncomeType] = useState<'monthly' | 'yearly'>('monthly');
  const [incomeStr, setIncomeStr] = useState('');
  const [city, setCity] = useState('北京');
  const [siRate, setSiRate] = useState('10.5');
  const [hfRate, setHfRate] = useState('12');
  const [siBase, setSiBase] = useState('');
  const [childrenEd, setChildrenEd] = useState(false);
  const [housingLoan, setHousingLoan] = useState(false);
  const [rent, setRent] = useState(false);
  const [rentAmount, setRentAmount] = useState('1000');
  const [elderly, setElderly] = useState(false);
  const [contEd, setContEd] = useState(false);
  const [yearEndBonusStr, setYearEndBonusStr] = useState('');

  const income = parseFloat(incomeStr) || 0;
  const yearEndBonus = parseFloat(yearEndBonusStr) || 0;
  const monthlyIncome = incomeType === 'yearly' ? income / 12 : income;

  const handleCityChange = useCallback((newCity: string) => {
    setCity(newCity);
    const rates = getCityByName(newCity);
    if (rates) {
      setSiRate(String(rates.socialInsuranceRate));
      setHfRate(String(rates.housingFundRate));
    }
  }, []);

  const deductions: DeductionInput = useMemo(() => ({
    socialInsuranceRate: parseFloat(siRate) || 0,
    housingFundRate: parseFloat(hfRate) || 0,
    socialInsuranceBase: parseFloat(siBase) || monthlyIncome,
    childrenEducation: childrenEd,
    housingLoan: housingLoan,
    rent: rent,
    rentAmount: parseFloat(rentAmount) || 0,
    elderlySupport: elderly,
    continuingEducation: contEd,
  }), [siRate, hfRate, siBase, monthlyIncome, childrenEd, housingLoan, rent, rentAmount, elderly, contEd]);

  const result = useMemo(() => {
    if (monthlyIncome <= 0) return null;
    return calculateTax(monthlyIncome, deductions);
  }, [monthlyIncome, deductions]);

  const bonusResult = useMemo(() => {
    if (yearEndBonus <= 0) return null;
    return calculateYearEndBonusTax(yearEndBonus);
  }, [yearEndBonus]);

  const handleCalculate = () => {
    if (!result && !bonusResult) return;
    const freshBonusResult = yearEndBonus > 0 ? calculateYearEndBonusTax(yearEndBonus) : null;
    const record: HistoryRecord = {
      id: Date.now().toString(),
      date: new Date().toLocaleString('zh-CN'),
      incomeType,
      income,
      city,
      deductions,
      result,
      yearEndBonus,
      bonusResult: freshBonusResult,
    };
    const history = loadHistory();
    history.unshift(record);
    if (history.length > 50) history.pop();
    saveHistory(history);
    navigate('/result', { state: { result, deductions, monthlyIncome, incomeType, city, yearEndBonus, bonusResult: freshBonusResult } });
  };

  const fmt = (n: number) => n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="page-container fade-in">
      <h1 className="page-title">个人所得税计算</h1>

      {/* 收入输入 */}
      <div className="card">
        <div className="card-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
          税前收入
        </div>
        <div className="income-type-switch">
          <button className={incomeType === 'monthly' ? 'active' : ''} onClick={() => setIncomeType('monthly')}>月收入</button>
          <button className={incomeType === 'yearly' ? 'active' : ''} onClick={() => setIncomeType('yearly')}>年收入</button>
        </div>
        <div className="salary-input-group">
          <input
            type="number"
            className="form-input"
            placeholder={incomeType === 'monthly' ? '请输入月薪' : '请输入年薪'}
            value={incomeStr}
            onChange={e => setIncomeStr(e.target.value)}
          />
          <div className="input-suffix">元/{incomeType === 'monthly' ? '月' : '年'}</div>
        </div>
        {income > 0 && (
          <p className="form-hint" style={{marginTop:8}}>
            折算：月收入 {fmt(monthlyIncome)} 元 / 年收入 {fmt(monthlyIncome * 12)} 元
          </p>
        )}
      </div>

      {/* 五险一金 */}
      <div className="card">
        <div className="card-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          五险一金
        </div>
        <div className="form-group">
          <label className="form-label">选择城市</label>
          <select className="form-select" value={city} onChange={e => handleCityChange(e.target.value)}>
            {CITIES.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">社保个人比例 (%)</label>
            <input type="number" className="form-input" value={siRate} onChange={e => setSiRate(e.target.value)} step="0.1" />
          </div>
          <div className="form-group">
            <label className="form-label">公积金个人比例 (%)</label>
            <input type="number" className="form-input" value={hfRate} onChange={e => setHfRate(e.target.value)} step="0.1" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">缴纳基数（留空则按实际收入）</label>
          <input type="number" className="form-input" placeholder="默认为月收入" value={siBase} onChange={e => setSiBase(e.target.value)} />
          <p className="form-hint">通常缴纳基数在月收入的60%-300%之间</p>
        </div>
      </div>

      {/* 专项附加扣除 */}
      <div className="card">
        <div className="card-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
          专项附加扣除
        </div>

        <div className={`toggle-row ${childrenEd ? 'enabled' : ''}`} onClick={() => setChildrenEd(!childrenEd)}>
          <div className="toggle-info">
            <div className="toggle-name">子女教育</div>
            <div className="toggle-desc">每个子女每月1000元，学前教育到博士</div>
          </div>
          <span className="toggle-amount">1,000元/月</span>
          <div className={`toggle-switch ${childrenEd ? 'on' : ''}`} />
        </div>

        <div className={`toggle-row ${housingLoan ? 'enabled' : ''}`} onClick={() => setHousingLoan(!housingLoan)}>
          <div className="toggle-info">
            <div className="toggle-name">住房贷款利息</div>
            <div className="toggle-desc">首套住房贷款每月1000元，最长240个月</div>
          </div>
          <span className="toggle-amount">1,000元/月</span>
          <div className={`toggle-switch ${housingLoan ? 'on' : ''}`} />
        </div>

        <div className={`toggle-row ${rent ? 'enabled' : ''}`} onClick={() => setRent(!rent)}>
          <div className="toggle-info">
            <div className="toggle-name">住房租金</div>
            <div className="toggle-desc">根据城市每月800-1500元</div>
          </div>
          <span className="toggle-amount">{parseFloat(rentAmount).toLocaleString()}元/月</span>
          <div className={`toggle-switch ${rent ? 'on' : ''}`} />
        </div>
        {rent && (
          <div className="amount-input-row">
            <label>每月租金扣除额：</label>
            <select className="form-select" style={{width:'auto', minWidth:200, flex:1}} value={rentAmount} onChange={e => setRentAmount(e.target.value)}>
              <option value="1500">1500元（直辖市/省会/计划单列市）</option>
              <option value="1100">1100元（市辖区户籍人口&gt;100万）</option>
              <option value="800">800元（其他城市）</option>
            </select>
          </div>
        )}

        <div className={`toggle-row ${elderly ? 'enabled' : ''}`} onClick={() => setElderly(!elderly)}>
          <div className="toggle-info">
            <div className="toggle-name">赡养老人</div>
            <div className="toggle-desc">父母年满60岁，独生子女每月2000元</div>
          </div>
          <span className="toggle-amount">2,000元/月</span>
          <div className={`toggle-switch ${elderly ? 'on' : ''}`} />
        </div>

        <div className={`toggle-row ${contEd ? 'enabled' : ''}`} onClick={() => setContEd(!contEd)}>
          <div className="toggle-info">
            <div className="toggle-name">继续教育</div>
            <div className="toggle-desc">学历继续教育每月400元</div>
          </div>
          <span className="toggle-amount">400元/月</span>
          <div className={`toggle-switch ${contEd ? 'on' : ''}`} />
        </div>
      </div>

      {/* 年终奖 */}
      <div className="card">
        <div className="card-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          年终奖（单独计税）
        </div>
        <div className="salary-input-group">
          <input
            type="number"
            className="form-input"
            placeholder="请输入年终奖金额"
            value={yearEndBonusStr}
            onChange={e => setYearEndBonusStr(e.target.value)}
          />
          <div className="input-suffix">元</div>
        </div>
        {bonusResult && (
          <div style={{marginTop:12, padding:12, background:'var(--gray-100)', borderRadius:'var(--radius-sm)', fontSize:14}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:6}}>
              <span style={{color:'var(--gray-500)'}}>月均奖金</span>
              <span>{fmt(bonusResult.monthlyBonus)} 元</span>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:6}}>
              <span style={{color:'var(--gray-500)'}}>适用税率</span>
              <span>{(bonusResult.applicableRate * 100).toFixed(0)}%</span>
            </div>
            <div style={{display:'flex', justifyContent:'space-between'}}>
              <span style={{color:'var(--gray-500)'}}>应缴个税</span>
              <span style={{color:'var(--danger)', fontWeight:600}}>{fmt(bonusResult.taxAmount)} 元</span>
            </div>
          </div>
        )}
        <p className="form-hint" style={{marginTop:8}}>
          计算方式：奖金÷12确定税率档，再全额×税率计税
        </p>
      </div>

      {/* 实时预览 */}
      {(result || bonusResult) && (
        <div className="summary-bar fade-in">
          {result && (
            <>
              <div className="summary-item">
                <div className="summary-item-label">预计每月到手</div>
                <div className="summary-item-value" style={{color:'var(--success)'}}>
                  {fmt(result.netMonthly)} 元
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-item-label">预计每月个税</div>
                <div className="summary-item-value" style={{color:'var(--danger)'}}>
                  {fmt(result.taxMonthly)} 元
                </div>
              </div>
            </>
          )}
          {bonusResult && (
            <div className="summary-item">
              <div className="summary-item-label">年终奖个税</div>
              <div className="summary-item-value" style={{color:'var(--danger)'}}>
                {fmt(bonusResult.taxAmount)} 元
              </div>
            </div>
          )}
          {bonusResult && (
            <div className="summary-item">
              <div className="summary-item-label">年终奖税后</div>
              <div className="summary-item-value" style={{color:'var(--success)'}}>
                {fmt(bonusResult.netBonus)} 元
              </div>
            </div>
          )}
        </div>
      )}

      {/* 计算按钮 */}
      <button
        className="btn btn-primary btn-block"
        style={{marginTop:8, padding:'14px 24px', fontSize:16}}
        onClick={handleCalculate}
        disabled={!income && !yearEndBonus}
      >
        查看详细计算结果
      </button>
    </div>
  );
}
