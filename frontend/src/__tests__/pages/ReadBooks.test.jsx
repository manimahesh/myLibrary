import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

vi.mock('../../services/api', () => ({
  default: { get: vi.fn() },
}));
import api from '../../services/api';
import ReadBooks from '../../pages/ReadBooks';

function renderPage() {
  return render(
    <MemoryRouter>
      <ReadBooks />
    </MemoryRouter>
  );
}

describe('ReadBooks page', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows empty state when there are no read books', async () => {
    api.get.mockResolvedValue({ data: { readBooks: [] } });
    renderPage();
    await waitFor(() => expect(screen.getByText(/No books marked as read yet/i)).toBeInTheDocument());
  });

  it('renders a read book entry', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/read-books') {
        return Promise.resolve({ data: { readBooks: [{ id: 'r1', book_id: 'vol1', read_at: '2024-01-01T00:00:00Z' }] } });
      }
      return Promise.resolve({ data: { book: { title: 'My Book', author: 'Author', thumbnail: null } } });
    });
    renderPage();
    await waitFor(() => expect(screen.getByText('My Book')).toBeInTheDocument());
  });

  it('shows error message on fetch failure', async () => {
    api.get.mockRejectedValue(new Error('Network error'));
    renderPage();
    await waitFor(() => expect(screen.getByText(/Failed to load read books/i)).toBeInTheDocument());
  });
});
