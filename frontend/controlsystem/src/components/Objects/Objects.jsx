import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Objects = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Объекты
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Страница объектов находится в разработке
        </Typography>
      </Paper>
    </Box>
  );
};

export default Objects;