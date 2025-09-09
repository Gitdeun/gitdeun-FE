import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import App from './App.tsx';
import './index.css';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <MantineProvider defaultColorScheme="light" theme={{}}>
        <App />
      </MantineProvider>
    </BrowserRouter>
  </StrictMode>
);
