"use strict";
/**
 * 各城市五险一金比例预设
 * 个人缴纳部分（养老8% + 医疗2% + 失业0.5% + 公积金5%-12%）
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CITIES = void 0;
exports.getCityByName = getCityByName;
exports.CITIES = [
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
function getCityByName(name) {
    return exports.CITIES.find(c => c.name === name);
}
