import React from "react";
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { router } from './routes';
import { CustomizerContextProvider } from "./context/customizerContext";
import { ThemeSettings } from "./utils/theme/Theme";

// Inner component that uses the theme
const ThemedApp = () => {
  const theme = ThemeSettings();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
};

const App = () => {
  return (
    <CustomizerContextProvider>
      <ThemedApp />
    </CustomizerContextProvider>
  );
};

export default App;
