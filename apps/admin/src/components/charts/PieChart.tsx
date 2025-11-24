import React from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { useTheme } from '@mui/material/styles';
import { Box, Card, CardContent, Typography } from '@mui/material';

interface PieChartProps {
  title?: string;
  data: { label: string; value: number }[];
  height?: number;
  donut?: boolean;
  colors?: string[];
}

export const PieChart: React.FC<PieChartProps> = ({
  title,
  data,
  height = 300,
  donut = true,
  colors,
}) => {
  const theme = useTheme();

  const series = data.map((d) => d.value);
  const labels = data.map((d) => d.label);

  const defaultColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
  ];

  const options: ApexOptions = {
    chart: {
      type: donut ? 'donut' : 'pie',
      fontFamily: theme.typography.fontFamily,
    },
    labels,
    colors: colors || defaultColors,
    legend: {
      position: 'bottom',
      fontSize: '12px',
      labels: {
        colors: theme.palette.text.primary,
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '12px',
      },
    },
    tooltip: {
      theme: theme.palette.mode,
      y: {
        formatter: (val) => `${val.toLocaleString()} (${((val / series.reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%)`,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: donut ? '65%' : '0%',
          labels: {
            show: donut,
            total: {
              show: true,
              label: 'Total',
              fontSize: '14px',
              fontWeight: 600,
              color: theme.palette.text.primary,
            },
          },
        },
      },
    },
  };

  return (
    <Card>
      <CardContent>
        {title && (
          <Typography variant="h6" fontWeight={600} mb={2}>
            {title}
          </Typography>
        )}
        <Box>
          <Chart options={options} series={series} type={donut ? 'donut' : 'pie'} height={height} />
        </Box>
      </CardContent>
    </Card>
  );
};
