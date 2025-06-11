import { test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CodeChat } from '../code-chat';

test('renders code chat component', () => {
    render(<CodeChat />);
    const linkElement = screen.getByText(/code chat/i);
    expect(linkElement).toBeInTheDocument();
});