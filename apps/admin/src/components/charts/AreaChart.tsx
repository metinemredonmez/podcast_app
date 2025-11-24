import React from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { useTheme } from '@mui/material/styles';
import { Box, Card, CardContent, Typography } from '@mui/material';

interface AreaChartProps {
  title?: string;
  data: { timestamp: string; value: number }[];
  height?: number;
  color?: string;
}

export const AreaChart: React.FC<AreaChartProps> = ({ title, data, height = 300, color }) => {
  const theme = useTheme();

  const series = [
    {
      name: 'Value',
      data: data.map((d) => d.value),
    },
  ];

  const options: ApexOptions = {
    chart: {
      type: 'area',
      fontFamily: theme.typography.fontFamily,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 100],
      },
    },
    colors: [color || theme.palette.primary.main],
    xaxis: {
      categories: data.map((d) => d.timestamp),
      labels: {
        style: {
          colors: theme.palette.text.secondary,
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: theme.palette.text.secondary,
        },
        formatter: (val) => Math.round(val).toLocaleString(),
      },
    },
    grid: {
      borderColor: theme.palette.divider,
      strokeDashArray: 3,
    },
    tooltip: {
      theme: theme.palette.mode,
      x: {
        show: true,
      },
      y: {
        formatter: (val) => val.toLocaleString(),
      },
    },
    dataLabels: {
      enabled: false,
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
          <Chart options={options} series={series} type="area" height={height} />
        </Box>
      </CardContent>
    </Card>
  );
};
