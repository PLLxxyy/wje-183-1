/**
 * 中国个人所得税计算工具
 * 使用累进税率表（7级）
 */
// 7级超额累进税率表（月度）
export const TAX_BRACKETS = [
    { min: 0, max: 3000, rate: 0.03, deduction: 0 },
    { min: 3000, max: 12000, rate: 0.10, deduction: 210 },
    { min: 12000, max: 25000, rate: 0.20, deduction: 1410 },
    { min: 25000, max: 35000, rate: 0.25, deduction: 2660 },
    { min: 35000, max: 55000, rate: 0.30, deduction: 4410 },
    { min: 55000, max: 80000, rate: 0.35, deduction: 7160 },
    { min: 80000, max: Infinity, rate: 0.45, deduction: 15160 },
];
export const TAX_BRACKET_DISPLAY = TAX_BRACKETS.map(b => ({
    min: b.min,
    max: b.max === Infinity ? null : b.max,
    rate: b.rate,
}));
// 月起征点
export const MONTHLY_THRESHOLD = 5000;
export const YEARLY_THRESHOLD = 60000;
export function calculateTax(monthlyIncome, deductions) {
    const grossMonthly = monthlyIncome;
    const grossYearly = monthlyIncome * 12;
    // 五险一金
    const base = Math.min(deductions.socialInsuranceBase, monthlyIncome);
    const socialInsuranceMonthly = round2(base * deductions.socialInsuranceRate / 100);
    const housingFundMonthly = round2(base * deductions.housingFundRate / 100);
    const totalSocialFundMonthly = round2(socialInsuranceMonthly + housingFundMonthly);
    // 专项附加扣除
    const specialDeductionsDetail = [];
    if (deductions.childrenEducation) {
        specialDeductionsDetail.push({ name: '子女教育', amount: 1000 });
    }
    if (deductions.housingLoan) {
        specialDeductionsDetail.push({ name: '房贷利息', amount: 1000 });
    }
    if (deductions.rent) {
        specialDeductionsDetail.push({ name: '住房租金', amount: deductions.rentAmount });
    }
    if (deductions.elderlySupport) {
        specialDeductionsDetail.push({ name: '赡养老人', amount: 2000 });
    }
    if (deductions.continuingEducation) {
        specialDeductionsDetail.push({ name: '继续教育', amount: 400 });
    }
    const specialDeductionsMonthly = specialDeductionsDetail.reduce((s, d) => s + d.amount, 0);
    // 应纳税所得额（月度）
    const taxableIncomeMonthly = Math.max(0, grossMonthly - MONTHLY_THRESHOLD - totalSocialFundMonthly - specialDeductionsMonthly);
    const taxableIncomeYearly = taxableIncomeMonthly * 12;
    // 累进税计算
    const bracketDetails = [];
    let remainingTaxable = taxableIncomeMonthly;
    let totalTax = 0;
    for (const bracket of TAX_BRACKETS) {
        if (remainingTaxable <= 0)
            break;
        const bracketWidth = bracket.max === Infinity ? remainingTaxable : bracket.max - bracket.min;
        const amountInBracket = Math.min(remainingTaxable, bracketWidth);
        const taxForBracket = round2(amountInBracket * bracket.rate);
        const maxStr = bracket.max === Infinity ? '以上' : formatNum(bracket.max);
        bracketDetails.push({
            range: `${formatNum(bracket.min)} - ${maxStr}`,
            rate: bracket.rate,
            taxableAmount: amountInBracket,
            taxAmount: taxForBracket,
        });
        totalTax += taxForBracket;
        remainingTaxable -= amountInBracket;
    }
    // 也可用速算扣除法验证
    // const quickTax = round2(taxableIncomeMonthly * bracket.rate - bracket.deduction);
    const taxMonthly = round2(totalTax);
    const taxYearly = round2(taxMonthly * 12);
    const netMonthly = round2(grossMonthly - totalSocialFundMonthly - taxMonthly);
    const netYearly = round2(netMonthly * 12);
    return {
        grossMonthly,
        grossYearly,
        thresholdMonthly: MONTHLY_THRESHOLD,
        socialInsuranceMonthly,
        housingFundMonthly,
        totalSocialFundMonthly,
        specialDeductionsMonthly,
        specialDeductionsDetail,
        taxableIncomeMonthly,
        taxableIncomeYearly,
        taxMonthly,
        taxYearly,
        netMonthly,
        netYearly,
        bracketDetails,
    };
}
function round2(n) {
    return Math.round(n * 100) / 100;
}
function formatNum(n) {
    return n.toLocaleString('zh-CN');
}
export function getOptimizationTips(monthlyIncome, deductions, result) {
    const tips = [];
    if (!deductions.childrenEducation) {
        tips.push({
            title: '开启子女教育扣除',
            description: '如果有子女处于学前教育或学历教育阶段，每月可扣除1000元。',
            potentialSaving: estimateTaxSaving(monthlyIncome, deductions, 1000, result),
            type: 'saving',
        });
    }
    if (!deductions.housingLoan) {
        tips.push({
            title: '开启房贷利息扣除',
            description: '如果本人或配偶有首套住房贷款，每月可扣除1000元。',
            potentialSaving: estimateTaxSaving(monthlyIncome, deductions, 1000, result),
            type: 'saving',
        });
    }
    if (!deductions.rent) {
        tips.push({
            title: '开启住房租金扣除',
            description: '如果在主要工作城市没有自有住房，每月可扣除800-1500元（视城市而定）。',
            potentialSaving: estimateTaxSaving(monthlyIncome, deductions, 1500, result),
            type: 'saving',
        });
    }
    if (!deductions.elderlySupport) {
        tips.push({
            title: '开启赡养老人扣除',
            description: '如果父母年满60岁，独生子女每月可扣除2000元。',
            potentialSaving: estimateTaxSaving(monthlyIncome, deductions, 2000, result),
            type: 'saving',
        });
    }
    if (!deductions.continuingEducation) {
        tips.push({
            title: '开启继续教育扣除',
            description: '如果正在接受学历继续教育或取得职业资格证书，每月可扣除400元。',
            potentialSaving: estimateTaxSaving(monthlyIncome, deductions, 400, result),
            type: 'saving',
        });
    }
    if (deductions.rent && deductions.housingLoan) {
        tips.push({
            title: '房贷和房租不能同时扣除',
            description: '住房贷款利息和住房租金不能同时享受扣除，请选择金额较高的一项。',
            potentialSaving: 0,
            type: 'info',
        });
    }
    // 检查社保基数
    if (deductions.socialInsuranceBase < monthlyIncome * 0.6) {
        tips.push({
            title: '社保基数可能偏低',
            description: '社保缴纳基数通常不低于月收入的60%，请确认基数填写是否正确。',
            potentialSaving: 0,
            type: 'info',
        });
    }
    if (result.taxMonthly === 0) {
        tips.push({
            title: '当前无需缴纳个税',
            description: '扣除五险一金和专项附加扣除后，您的应纳税所得额为0，无需缴纳个人所得税。',
            potentialSaving: 0,
            type: 'info',
        });
    }
    return tips;
}
function estimateTaxSaving(monthlyIncome, deductions, extraDeduction, currentResult) {
    // 简化估算：用当前边际税率
    if (currentResult.taxableIncomeMonthly <= 0)
        return 0;
    let marginalRate = 0.03;
    const taxable = currentResult.taxableIncomeMonthly;
    if (taxable > 80000)
        marginalRate = 0.45;
    else if (taxable > 55000)
        marginalRate = 0.35;
    else if (taxable > 35000)
        marginalRate = 0.30;
    else if (taxable > 25000)
        marginalRate = 0.25;
    else if (taxable > 12000)
        marginalRate = 0.20;
    else if (taxable > 3000)
        marginalRate = 0.10;
    return round2(Math.min(extraDeduction, taxable) * marginalRate * 12);
}
export function calculateYearEndBonusTax(bonusAmount) {
    if (bonusAmount <= 0) {
        return {
            bonusAmount: 0,
            monthlyBonus: 0,
            applicableRate: 0,
            taxAmount: 0,
            netBonus: 0,
            bracketRange: '-',
        };
    }
    const monthlyBonus = round2(bonusAmount / 12);
    let bracket = TAX_BRACKETS[0];
    for (const b of TAX_BRACKETS) {
        if (monthlyBonus > b.min) {
            bracket = b;
        }
        else {
            break;
        }
    }
    const taxAmount = round2(bonusAmount * bracket.rate);
    const netBonus = round2(bonusAmount - taxAmount);
    const maxStr = bracket.max === Infinity ? '以上' : formatNum(bracket.max);
    const bracketRange = `${formatNum(bracket.min)} - ${maxStr}`;
    return {
        bonusAmount,
        monthlyBonus,
        applicableRate: bracket.rate,
        taxAmount,
        netBonus,
        bracketRange,
    };
}
