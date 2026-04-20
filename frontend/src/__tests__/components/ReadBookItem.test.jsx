import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ReadBookItem from '../../components/ReadBookItem';

vi.mock('../../services/api', () => ({
  default: {
    delete: vi.fn(),
  },
}));
import api from '../../services/api';

const baseItem = {
  id: 'rec-1',
  book_id: 'vol1',
  read_at: '2024-03-15T00:00:00.000Z',
  title: 'Read Book',
  author: 'Some Author',
  thumbnail: null,
};

function renderItem(itemOverrides = {}, props = {}) {
  return render(
    <MemoryRouter>
      <ReadBookItem item={{ ...baseItem, ...itemOverrides }} onUnmarked={vi.fn()} {...props} />
    </MemoryRouter>
  );
}

describe('ReadBookItem', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the formatted read date', () => {
    renderItem();
    expect(screen.getByText(/Read on/i)).toBeInTheDocument();
  });

  it('renders the book title from item prop', () => {
    renderItem();
    expect(screen.getByText('Read Book')).toBeInTheDocument();
  });

  it('renders the author when present', () => {
    renderItem();
    expect(screen.getByText('Some Author')).toBeInTheDocument();
  });

  it('renders "Unmark as Read" button', () => {
    renderItem();
    expect(screen.getByRole('button', { name: /Unmark as Read/i })).toBeInTheDocument();
  });

  it('calls delete and onUnmarked after confirm', async () => {
    window.confirm = vi.fn().mockReturnValue(true);
    api.delete.mockResolvedValue({});
    const onUnmarked = vi.fn();
    renderItem({}, { onUnmarked });
    fireEvent.click(screen.getByRole('button', { name: /Unmark as Read/i }));
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/read-books/rec-1'));
    expect(onUnmarked).toHaveBeenCalledWith('rec-1');
  });

  it('does not delete when confirm is cancelled', () => {
    window.confirm = vi.fn().mockReturnValue(false);
    renderItem();
    fireEvent.click(screen.getByRole('button', { name: /Unmark as Read/i }));
    expect(api.delete).not.toHaveBeenCalled();
  });

  it('normalises isbn: prefix in title', () => {
    renderItem({ title: 'isbn:9780743273565' });
    expect(screen.getByText('ISBN: 9780743273565')).toBeInTheDocument();
  });

  it('normalises nyt-rank: prefix in title', () => {
    renderItem({ title: 'nyt-rank:3' });
    expect(screen.getByText('NYT Rank: 3')).toBeInTheDocument();
  });

  it('converts ALL_CAPS title to title case', () => {
    renderItem({ title: 'THE GREAT GATSBY' });
    expect(screen.getByText('The Great Gatsby')).toBeInTheDocument();
  });

  it('falls back to book_id when title is absent', () => {
    renderItem({ title: undefined });
    expect(screen.getByText('vol1')).toBeInTheDocument();
  });

  it('shows cover image when thumbnail is provided', () => {
    renderItem({ thumbnail: 'https://example.com/cover.jpg' });
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/cover.jpg');
  });
});
