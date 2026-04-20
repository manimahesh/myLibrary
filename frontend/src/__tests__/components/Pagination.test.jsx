import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import Pagination from '../../components/Pagination';

const noop = vi.fn();

function renderPagination(overrides = {}) {
  const props = {
    page: 0,
    totalPages: 5,
    total: 50,
    limit: 10,
    onFirst: noop,
    onPrev: noop,
    onNext: noop,
    onLast: noop,
    ...overrides,
  };
  return render(<Pagination {...props} />);
}

describe('Pagination', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders nothing when total is 0', () => {
    const { container } = renderPagination({ total: 0 });
    expect(container.firstChild).toBeNull();
  });

  it('shows correct range on first page', () => {
    renderPagination({ page: 0, limit: 10, total: 50 });
    expect(screen.getByText('1–10 of 50')).toBeInTheDocument();
  });

  it('shows correct range on second page', () => {
    renderPagination({ page: 1, limit: 10, total: 50 });
    expect(screen.getByText('11–20 of 50')).toBeInTheDocument();
  });

  it('clamps range end on last page', () => {
    renderPagination({ page: 4, limit: 10, total: 47 });
    expect(screen.getByText('41–47 of 47')).toBeInTheDocument();
  });

  it('disables first and prev on page 0', () => {
    renderPagination({ page: 0 });
    expect(screen.getAllByRole('button', { name: /First page/i })[0]).toBeDisabled();
    expect(screen.getAllByRole('button', { name: /Previous page/i })[0]).toBeDisabled();
  });

  it('disables next and last on last page', () => {
    renderPagination({ page: 4, totalPages: 5 });
    expect(screen.getAllByRole('button', { name: /Next page/i })[0]).toBeDisabled();
    expect(screen.getAllByRole('button', { name: /Last page/i })[0]).toBeDisabled();
  });

  it('enables all buttons on a middle page', () => {
    renderPagination({ page: 2, totalPages: 5 });
    ['First page', 'Previous page', 'Next page', 'Last page'].forEach(name => {
      expect(screen.getAllByRole('button', { name })[0]).not.toBeDisabled();
    });
  });

  it('calls onNext when next button clicked', () => {
    const onNext = vi.fn();
    renderPagination({ page: 1, onNext });
    fireEvent.click(screen.getAllByRole('button', { name: /Next page/i })[0]);
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('calls onPrev when prev button clicked', () => {
    const onPrev = vi.fn();
    renderPagination({ page: 1, onPrev });
    fireEvent.click(screen.getAllByRole('button', { name: /Previous page/i })[0]);
    expect(onPrev).toHaveBeenCalledOnce();
  });

  it('calls onFirst when first button clicked', () => {
    const onFirst = vi.fn();
    renderPagination({ page: 2, onFirst });
    fireEvent.click(screen.getAllByRole('button', { name: /First page/i })[0]);
    expect(onFirst).toHaveBeenCalledOnce();
  });

  it('calls onLast when last button clicked', () => {
    const onLast = vi.fn();
    renderPagination({ page: 1, onLast });
    fireEvent.click(screen.getAllByRole('button', { name: /Last page/i })[0]);
    expect(onLast).toHaveBeenCalledOnce();
  });

  it('formats large totals with toLocaleString', () => {
    renderPagination({ page: 0, limit: 10, total: 10506, totalPages: 1051 });
    expect(screen.getByText(/10,506/)).toBeInTheDocument();
  });
});
