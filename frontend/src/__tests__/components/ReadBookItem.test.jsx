import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ReadBookItem from '../../components/ReadBookItem';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));
import api from '../../services/api';

const item = {
  id: 'rec-1',
  book_id: 'vol1',
  read_at: '2024-03-15T00:00:00.000Z',
};

function renderItem(props = {}) {
  return render(
    <MemoryRouter>
      <ReadBookItem item={item} onUnmarked={vi.fn()} {...props} />
    </MemoryRouter>
  );
}

describe('ReadBookItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: { book: { title: 'Read Book', author: 'Some Author', thumbnail: null } } });
  });

  it('renders the formatted read date', async () => {
    renderItem();
    await waitFor(() => expect(screen.getByText(/Read on/i)).toBeInTheDocument());
  });

  it('renders the book title once loaded', async () => {
    renderItem();
    await waitFor(() => expect(screen.getByText('Read Book')).toBeInTheDocument());
  });

  it('renders "Unmark as Read" button', async () => {
    renderItem();
    await waitFor(() => expect(screen.getByRole('button', { name: /Unmark as Read/i })).toBeInTheDocument());
  });

  it('calls delete and onUnmarked after confirm', async () => {
    window.confirm = vi.fn().mockReturnValue(true);
    api.delete.mockResolvedValue({});
    const onUnmarked = vi.fn();
    renderItem({ onUnmarked });
    await waitFor(() => screen.getByRole('button', { name: /Unmark as Read/i }));
    fireEvent.click(screen.getByRole('button', { name: /Unmark as Read/i }));
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/read-books/rec-1'));
    expect(onUnmarked).toHaveBeenCalledWith('rec-1');
  });

  it('does not delete when confirm is cancelled', async () => {
    window.confirm = vi.fn().mockReturnValue(false);
    renderItem();
    await waitFor(() => screen.getByRole('button', { name: /Unmark as Read/i }));
    fireEvent.click(screen.getByRole('button', { name: /Unmark as Read/i }));
    expect(api.delete).not.toHaveBeenCalled();
  });

  it('normalises isbn: prefix in title', async () => {
    api.get.mockResolvedValue({ data: { book: { title: 'isbn:9780743273565', author: 'F. Scott Fitzgerald', thumbnail: null } } });
    renderItem();
    await waitFor(() => expect(screen.getByText('ISBN: 9780743273565')).toBeInTheDocument());
  });

  it('normalises nyt-rank: prefix in title', async () => {
    api.get.mockResolvedValue({ data: { book: { title: 'nyt-rank:3', author: 'Unknown', thumbnail: null } } });
    renderItem();
    await waitFor(() => expect(screen.getByText('NYT Rank: 3')).toBeInTheDocument());
  });

  it('converts ALL_CAPS title to title case', async () => {
    api.get.mockResolvedValue({ data: { book: { title: 'THE GREAT GATSBY', author: 'Fitzgerald', thumbnail: null } } });
    renderItem();
    await waitFor(() => expect(screen.getByText('The Great Gatsby')).toBeInTheDocument());
  });
});
