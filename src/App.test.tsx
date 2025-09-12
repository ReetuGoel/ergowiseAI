import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login form when no user', () => {
  render(<App />);
  const heading = screen.getByText(/log in to ergowise/i);
  expect(heading).toBeInTheDocument();
});
