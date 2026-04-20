import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

const mockItem = { id: 'r1', book_id: 'vol1', read_at: '2024-01-01T00:00:00Z', title: 'My Book', author: 'Author', thumbnail: null };

describe('ReadBooks page', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows empty state when there are no read books', async () => {
    api.get.mockResolvedValue({ data: { readBooks: [], total: 0 } });
    renderPage();
    await waitFor(() => expect(screen.getByText(/No books marked as read yet/i)).toBeInTheDocument());
  });

  it('renders a read book entry with title', async () => {
    api.get.mockResolvedValue({ data: { readBooks: [mockItem], total: 1 } });
    renderPage();
    await waitFor(() => expect(screen.getByText('My Book')).toBeInTheDocument());
  });

  it('shows total count in section description', async () => {
    api.get.mockResolvedValue({ data: { readBooks: [mockItem], total: 1 } });
    renderPage();
    await waitFor(() => expect(screen.getByText(/1 book/i)).toBeInTheDocument());
  });

  it('shows error message on fetch failure', async () => {
    api.get.mockRejectedValue(new Error('Network error'));
    renderPage();
    await waitFor(() => expect(screen.getByText(/Failed to load/i)).toBeInTheDocument());
  });

  it('shows pagination bar when results are present', async () => {
    api.get.mockResolvedValue({ data: { readBooks: [mockItem], total: 25 } });
    renderPage();
    await waitFor(() => expect(screen.getAllByText('1–10 of 25')).toHaveLength(2));
  });

  it('disables previous/first buttons on first page', async () => {
    api.get.mockResolvedValue({ data: { readBooks: [mockItem], total: 25 } });
    renderPage();
    await waitFor(() => screen.getAllByText('1–10 of 25'));
    const prevBtns = screen.getAllByRole('button', { name: /Previous page/i });
    prevBtns.forEach(btn => expect(btn).toBeDisabled());
  });

  it('changes per-page limit and reloads', async () => {
    api.get.mockResolvedValue({ data: { readBooks: [mockItem], total: 1 } });
    renderPage();
    await waitFor(() => screen.getByLabelText(/Per page/i));
    api.get.mockResolvedValue({ data: { readBooks: [mockItem], total: 1 } });
    fireEvent.change(screen.getByLabelText(/Per page/i), { target: { value: '25' } });
    await waitFor(() => expect(api.get).toHaveBeenCalledWith(expect.stringContaining('limit=25')));
  });
});
