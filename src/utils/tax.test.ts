import { calculateYearEndBonusTax } from './tax.js';

declare var process: any;

function strictEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(message + ' | 期望: ' + expected + ', 实际: ' + actual);
  }
}

function ok(value: any, message: string) {
  if (!value) {
    throw new Error(message);
  }
}

interface TestCase {
  name: string;
  bonus: number;
  expectedRate: number;
  expectedTax: number;
  expectedNet: number;
}

const testCases: TestCase[] = [
  {
    name: '年终奖0元',
    bonus: 0,
    expectedRate: 0,
    expectedTax: 0,
    expectedNet: 0,
  },
  {
    name: '年终奖36000元（第一档税率3%）',
    bonus: 36000,
    expectedRate: 0.03,
    expectedTax: 1080,
    expectedNet: 34920,
  },
  {
    name: '年终奖36001元（第二档税率10%）',
    bonus: 36001,
    expectedRate: 0.10,
    expectedTax: 3600.1,
    expectedNet: 32400.9,
  },
  {
    name: '年终奖144000元（第二档税率10%）',
    bonus: 144000,
    expectedRate: 0.10,
    expectedTax: 14400,
    expectedNet: 129600,
  },
  {
    name: '年终奖144001元（第三档税率20%）',
    bonus: 144001,
    expectedRate: 0.20,
    expectedTax: 28800.2,
    expectedNet: 115200.8,
  },
  {
    name: '年终奖300000元（第三档税率20%）',
    bonus: 300000,
    expectedRate: 0.20,
    expectedTax: 60000,
    expectedNet: 240000,
  },
  {
    name: '年终奖300001元（第四档税率25%）',
    bonus: 300001,
    expectedRate: 0.25,
    expectedTax: 75000.25,
    expectedNet: 225000.75,
  },
  {
    name: '年终奖420000元（第四档税率25%）',
    bonus: 420000,
    expectedRate: 0.25,
    expectedTax: 105000,
    expectedNet: 315000,
  },
  {
    name: '年终奖660000元（第五档税率30%）',
    bonus: 660000,
    expectedRate: 0.30,
    expectedTax: 198000,
    expectedNet: 462000,
  },
  {
    name: '年终奖960000元（第六档税率35%）',
    bonus: 960000,
    expectedRate: 0.35,
    expectedTax: 336000,
    expectedNet: 624000,
  },
  {
    name: '年终奖960001元（第七档税率45%）',
    bonus: 960001,
    expectedRate: 0.45,
    expectedTax: 432000.45,
    expectedNet: 528000.55,
  },
];

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

let passed = 0;
let failed = 0;

console.log('========================================');
console.log('年终奖个税计算测试');
console.log('========================================');
console.log();

for (const tc of testCases) {
  try {
    const result = calculateYearEndBonusTax(tc.bonus);

    strictEqual(result.bonusAmount, tc.bonus, tc.name + ': 奖金金额不匹配');

    strictEqual(
      result.applicableRate,
      tc.expectedRate,
      tc.name + ': 适用税率不匹配'
    );

    strictEqual(
      result.taxAmount,
      tc.expectedTax,
      tc.name + ': 税额不匹配'
    );

    strictEqual(
      result.netBonus,
      tc.expectedNet,
      tc.name + ': 税后奖金不匹配'
    );

    const monthlyBonus = round2(tc.bonus / 12);
    strictEqual(
      result.monthlyBonus,
      monthlyBonus,
      tc.name + ': 月均奖金不匹配'
    );

    ok(
      result.bracketRange.length > 0,
      tc.name + ': 税率区间不能为空'
    );

    console.log('✓ ' + tc.name);
    passed++;
  } catch (e) {
    console.log('✗ ' + tc.name);
    console.log('  ' + (e as Error).message);
    failed++;
  }
}

console.log();
console.log('========================================');
console.log('测试完成：通过 ' + passed + ' 项，失败 ' + failed + ' 项');
console.log('========================================');

if (failed > 0) {
  process.exit(1);
}
