import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency, formatNumber } from '../utils/formatters';

// Custom tooltip styles
const CustomTooltip = ({ active, payload, label, formatter, labelFormatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        {label && (
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {labelFormatter ? labelFormatter(label) : label}
          </p>
        )}
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {entry.name}: {formatter ? formatter(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Asset category pie chart
export const AssetCategoryChart = ({ data = [] }) => {
  const { resolvedTheme } = useTheme();
  
  const colors = resolvedTheme === 'dark' 
    ? ['#60A5FA', '#4ADE80', '#FBBF24', '#F87171', '#A78BFA']
    : ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6'];

  const formatTooltip = (value) => formatNumber(value);

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={120}
            paddingAngle={5}
            dataKey="count"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            content={<CustomTooltip formatter={formatTooltip} />}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry) => (
              <span style={{ color: entry.color }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// Monthly operations bar chart
export const MonthlyOperationsChart = ({ data = [] }) => {
  const { resolvedTheme } = useTheme();
  
  const colors = {
    receipt: resolvedTheme === 'dark' ? '#4ADE80' : '#22C55E',
    transfer: resolvedTheme === 'dark' ? '#60A5FA' : '#3B82F6',
    disposal: resolvedTheme === 'dark' ? '#F87171' : '#EF4444',
    adjustment: resolvedTheme === 'dark' ? '#FBBF24' : '#F59E0B'
  };

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={resolvedTheme === 'dark' ? '#374151' : '#E5E7EB'} />
          <XAxis 
            dataKey="month" 
            stroke={resolvedTheme === 'dark' ? '#9CA3AF' : '#6B7280'}
          />
          <YAxis 
            stroke={resolvedTheme === 'dark' ? '#9CA3AF' : '#6B7280'}
          />
          <Tooltip
            content={<CustomTooltip formatter={formatNumber} />}
          />
          <Legend />
          <Bar dataKey="receipt" fill={colors.receipt} name="Поступления" />
          <Bar dataKey="transfer" fill={colors.transfer} name="Перемещения" />
          <Bar dataKey="disposal" fill={colors.disposal} name="Списания" />
          <Bar dataKey="adjustment" fill={colors.adjustment} name="Корректировки" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Asset value trend line chart
export const AssetValueTrendChart = ({ data = [] }) => {
  const { resolvedTheme } = useTheme();
  
  const lineColor = resolvedTheme === 'dark' ? '#60A5FA' : '#3B82F6';
  const areaColor = resolvedTheme === 'dark' ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)';

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={lineColor} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={lineColor} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={resolvedTheme === 'dark' ? '#374151' : '#E5E7EB'} />
          <XAxis 
            dataKey="month" 
            stroke={resolvedTheme === 'dark' ? '#9CA3AF' : '#6B7280'}
          />
          <YAxis 
            stroke={resolvedTheme === 'dark' ? '#9CA3AF' : '#6B7280'}
          />
          <Tooltip
            content={<CustomTooltip formatter={formatCurrency} />}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            fillOpacity={1}
            fill="url(#colorValue)"
            name="Стоимость активов"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Warehouse comparison chart
export const WarehouseComparisonChart = ({ data = [] }) => {
  const { resolvedTheme } = useTheme();
  
  const barColor = resolvedTheme === 'dark' ? '#A78BFA' : '#8B5CF6';

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="horizontal" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={resolvedTheme === 'dark' ? '#374151' : '#E5E7EB'} />
          <XAxis 
            type="number"
            stroke={resolvedTheme === 'dark' ? '#9CA3AF' : '#6B7280'}
          />
          <YAxis 
            type="category"
            dataKey="name"
            stroke={resolvedTheme === 'dark' ? '#9CA3AF' : '#6B7280'}
            width={100}
          />
          <Tooltip
            content={<CustomTooltip formatter={formatCurrency} />}
          />
          <Bar dataKey="value" fill={barColor} name="Стоимость активов" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Simple donut chart for single metric
export const DonutChart = ({ 
  data = [], 
  dataKey = "value", 
  nameKey = "name",
  centerText = "",
  centerValue = ""
}) => {
  const { resolvedTheme } = useTheme();
  
  const colors = resolvedTheme === 'dark' 
    ? ['#60A5FA', '#4ADE80', '#FBBF24', '#F87171', '#A78BFA']
    : ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="chart-container relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={2}
            dataKey={dataKey}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            content={<CustomTooltip />}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center text */}
      {(centerText || centerValue) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            {centerValue && (
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {centerValue}
              </div>
            )}
            {centerText && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {centerText}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Mini sparkline chart
export const SparklineChart = ({ data = [], color = '#3B82F6' }) => {
  return (
    <div className="w-full h-16">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, stroke: color, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Chart loading skeleton
export const ChartSkeleton = () => {
  return (
    <div className="chart-container">
      <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse flex items-center justify-center">
        <div className="text-gray-400 dark:text-gray-600">
          Загрузка графика...
        </div>
      </div>
    </div>
  );
};

export default {
  AssetCategoryChart,
  MonthlyOperationsChart,
  AssetValueTrendChart,
  WarehouseComparisonChart,
  DonutChart,
  SparklineChart,
  ChartSkeleton
};