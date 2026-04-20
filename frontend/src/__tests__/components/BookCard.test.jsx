import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import BookCard from '../../components/BookCard';

vi.mock('../../services/api', () => ({
  default: { post: vi.fn(), delete: vi.fn() },
}));
import api from '../../services/api';

const book = { id: 'vol1', title: 'Test Book', author: 'Test Author', thumbnail: null };

function renderCard(props = {}) {
  return render(
    <MemoryRouter>
      <BookCard book={book} {...props} />
    </MemoryRouter>
  );
}

describe('BookCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders title and author', () => {
    renderCard();
    expect(screen.getByText('Test Book')).toBeInTheDocument();
    expect(screen.getByText('Test Author')).toBeInTheDocument();
  });

  it('shows "In Wishlist" when inWishlist is true', () => {
    renderCard({ inWishlist: true });
    expect(screen.getByRole('button', { name: /In Wishlist/i })).toBeDisabled();
  });

  it('calls POST /wishlist on "Add to Wishlist" click', async () => {
    api.post.mockResolvedValue({ data: {} });
    const onAdded = vi.fn();
    renderCard({ onAdded });
    fireEvent.click(screen.getByRole('button', { name: /\+ Wishlist/i }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/wishlist', { book_id: 'vol1' }));
    expect(onAdded).toHaveBeenCalledWith('vol1');
  });

  it('does not show Mark as Read button when onReadToggle is undefined', () => {
    renderCard();
    expect(screen.queryByText(/Mark as Read/i)).not.toBeInTheDocument();
  });

  it('shows Mark as Read button when onReadToggle is provided', () => {
    renderCard({ onReadToggle: vi.fn() });
    expect(screen.getByText(/Mark as Read/i)).toBeInTheDocument();
  });

  it('shows date picker when Mark as Read is clicked', () => {
    renderCard({ onReadToggle: vi.fn() });
    fireEvent.click(screen.getByText(/Mark as Read/i));
    expect(screen.getByLabelText(/Date read/i)).toBeInTheDocument();
  });

  it('shows ✓ Read when inReadBooks is true', () => {
    renderCard({ inReadBooks: true, readBookId: 'r1', onReadToggle: vi.fn() });
    expect(screen.getByText(/✓ Read/i)).toBeInTheDocument();
  });

  it('converts ALL_CAPS title to title case', () => {
    render(
      <MemoryRouter>
        <BookCard book={{ ...book, title: 'THE GREAT GATSBY' }} />
      </MemoryRouter>
    );
    expect(screen.getByText('The Great Gatsby')).toBeInTheDocument();
  });
});
