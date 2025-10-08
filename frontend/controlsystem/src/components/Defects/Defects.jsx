import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Defects = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Дефекты
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Страница дефектов находится в разработке
        </Typography>
      </Paper>
    </Box>
  );
};

export default Defects;