import React from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { useTheme } from '@mui/material/styles';
import { Box, Card, CardContent, Typography } from '@mui/material';

interface BarChartProps {
  title?: string;
  data: { label: string; value: number }[];
  height?: number;
  horizontal?: boolean;
  color?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  title,
  data,
  height = 300,
  horizontal = false,
  color,
}) => {
  const theme = useTheme();

  const series = [
    {
      name: 'Value',
      data: data.map((d) => d.value),
    },
  ];

  const options: ApexOptions = {
    chart: {
      type: 'bar',
      fontFamily: theme.typography.fontFamily,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal,
        borderRadius: 4,
        dataLabels: {
          position: 'top',
        },
      },
    },
    colors: [color || theme.palette.primary.main],
    xaxis: {
      categories: data.map((d) => d.label),
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
          <Chart options={options} series={series} type="bar" height={height} />
        </Box>
      </CardContent>
    </Card>
  );
};
