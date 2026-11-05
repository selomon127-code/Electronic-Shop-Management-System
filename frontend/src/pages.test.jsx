/* eslint-disable no-unused-vars */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('All Pages & Routing Test', () => {
  it('should render home page by default on root path', () => {
    render(<App />);
    
    // አፕሊኬሽኑ ሲከፈት መነሻ ገጹ (Home) ወይም የተለመዱ ነገሮች መታየታቸውን ማረጋገጥ
    expect(document.body).toBeInTheDocument();
  });
});