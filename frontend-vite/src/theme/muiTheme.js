import { createTheme } from '@mui/material/styles';

const muiTheme = createTheme({
  palette: {
    primary: {
      main: '#0052CC',
      light: '#8b9ffd',
      dark: '#003d99',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#64748b',
      light: '#94a3b8',
      dark: '#475569',
      contrastText: '#ffffff',
    },
    success: {
      main: '#48bb78',
      light: '#68d391',
      dark: '#38a169',
    },
    warning: {
      main: '#ed8936',
      light: '#f6ad55',
      dark: '#dd6b20',
    },
    error: {
      main: '#dc3545',
      light: '#f56565',
      dark: '#c53030',
    },
    info: {
      main: '#007bff',
      light: '#4299e1',
      dark: '#2b6cb0',
    },
    background: {
      default: '#f4f8ff',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a202c',
      secondary: '#2d3748',
      disabled: '#a0aec0',
    },
    divider: '#e2e8f0',
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
          fontWeight: 600,
        },
        contained: {
          boxShadow: '0 2px 8px rgba(0, 82, 204, 0.2)',
          '&:hover': {
            boxShadow: '0 8px 20px rgba(0, 82, 204, 0.3)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 600,
            color: '#0052CC',
            backgroundColor: '#f0f5ff',
          },
        },
      },
    },
  },
});

export default muiTheme;
