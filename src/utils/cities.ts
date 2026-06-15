/**
 * 各城市五险一金比例预设
 * 个人缴纳部分（养老8% + 医疗2% + 失业0.5% + 公积金5%-12%）
 */

export interface CityRates {
  name: string;
  socialInsuranceRate: number;  // 五险个人缴纳合计比例 %
  housingFundRate: number;      // 公积金个人缴纳比例 %
}

export const CITIES: CityRates[] = [
  { name: '北京', socialInsuranceRate: 10.5, housingFundRate: 12 },
  { name: '上海', socialInsuranceRate: 10.5, housingFundRate: 7 },
  { name: '广州', socialInsuranceRate: 10.2, housingFundRate: 5 },
  { name: '深圳', socialInsuranceRate: 10.2, housingFundRate: 5 },
  { name: '杭州', socialInsuranceRate: 10.5, housingFundRate: 12 },
  { name: '南京', socialInsuranceRate: 10.5, housingFundRate: 8 },
  { name: '苏州', socialInsuranceRate: 10.5, housingFundRate: 8 },
  { name: '成都', socialInsuranceRate: 10.5, housingFundRate: 6 },
  { name: '武汉', socialInsuranceRate: 10.3, housingFundRate: 8 },
  { name: '西安', socialInsuranceRate: 10.5, housingFundRate: 8 },
  { name: '天津', socialInsuranceRate: 10.5, housingFundRate: 11 },
  { name: '重庆', socialInsuranceRate: 10.5, housingFundRate: 7 },
  { name: '长沙', socialInsuranceRate: 10.3, housingFundRate: 8 },
  { name: '郑州', socialInsuranceRate: 10.3, housingFundRate: 8 },
  { name: '青岛', socialInsuranceRate: 10.3, housingFundRate: 8 },
  { name: '大连', socialInsuranceRate: 10.5, housingFundRate: 10 },
  { name: '厦门', socialInsuranceRate: 10.5, housingFundRate: 12 },
  { name: '宁波', socialInsuranceRate: 10.5, housingFundRate: 8 },
  { name: '合肥', socialInsuranceRate: 10.5, housingFundRate: 8 },
  { name: '济南', socialInsuranceRate: 10.3, housingFundRate: 8 },
];

export function getCityByName(name: string): CityRates | undefined {
  return CITIES.find(c => c.name === name);
}
