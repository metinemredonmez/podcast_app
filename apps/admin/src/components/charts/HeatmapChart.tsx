import React from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { useTheme } from '@mui/material/styles';
import { Box, Card, CardContent, Typography } from '@mui/material';

interface HeatmapChartProps {
  title?: string;
  data: { hour: number; count: number }[];
  height?: number;
}

export const HeatmapChart: React.FC<HeatmapChartProps> = ({ title, data, height = 300 }) => {
  const theme = useTheme();

  // Group by day of week and hour
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // For simplicity, we'll just show hours. In a real app, you'd have day-of-week data
  const series = [
    {
      name: 'Listening Hours',
      data: data.map((d) => ({
        x: `${d.hour}:00`,
        y: d.count,
      })),
    },
  ];

  const options: ApexOptions = {
    chart: {
      type: 'heatmap',
      fontFamily: theme.typography.fontFamily,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.5,
        radius: 4,
        colorScale: {
          ranges: [
            {
              from: 0,
              to: 25,
              color: theme.palette.grey[200],
              name: 'Low',
            },
            {
              from: 26,
              to: 50,
              color: theme.palette.info.light,
              name: 'Medium',
            },
            {
              from: 51,
              to: 75,
              color: theme.palette.primary.main,
              name: 'High',
            },
            {
              from: 76,
              to: 100,
              color: theme.palette.error.main,
              name: 'Peak',
            },
          ],
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
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
      },
    },
    tooltip: {
      theme: theme.palette.mode,
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
          <Chart options={options} series={series} type="heatmap" height={height} />
        </Box>
      </CardContent>
    </Card>
  );
};
