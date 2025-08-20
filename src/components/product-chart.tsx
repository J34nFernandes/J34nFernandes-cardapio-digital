"use client";

import { useMemo } from "react";
import dynamic from 'next/dynamic';
import { type Product } from "@/types";

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

type ProductChartProps = {
  products: Product[];
};

const CHART_COLORS = ["#22c55e", "#3b82f6", "#f97316", "#8b5cf6", "#ef4444", "#f59e0b"];

export function ProductChart({ products }: ProductChartProps) {

  const chartData = useMemo(() => {
    const categoryCounts = products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryCounts).map(([category, count]) => ({
      x: category,
      y: count,
    }));
  }, [products]);
  
  if (chartData.length === 0) {
    return (
      <div className="flex h-64 min-h-[200px] w-full items-center justify-center rounded-md bg-muted/50">
        <p className="text-muted-foreground">Adicione produtos para ver o gráfico.</p>
      </div>
    );
  }

  const series = [{
    name: 'Produtos',
    data: chartData,
  }];

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
        distributed: true,
      }
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      categories: chartData.map(d => d.x),
    },
    yaxis: {
        labels: {
            formatter: (value) => String(parseInt(value))
        }
    },
    colors: CHART_COLORS,
    legend: {
      show: false,
    },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 5,
    },
    tooltip: {
      y: {
        formatter: (val) => `${val} produtos`
      }
    }
  };


  return (
    <div className="h-64 min-h-[200px] w-full">
        <Chart options={options} series={series} type="bar" height="100%" width="100%" />
    </div>
  );
}
