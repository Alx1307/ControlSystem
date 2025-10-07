import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Container
} from '@mui/material';

const AuthForm = ({ title, children }) => {
  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h4" gutterBottom>
            ControlSystem
          </Typography>
          <Typography component="h2" variant="h5" gutterBottom>
            {title}
          </Typography>
          {children}
        </Paper>
      </Box>
    </Container>
  );
};

export default AuthForm;