import { renderHook, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('../../services/api', () => ({
  default: { get: vi.fn() },
}));
import api from '../../services/api';
import { usePaginatedList } from '../../hooks/usePaginatedList';

const wishlistResponse = (items, total) => ({
  data: { wishlist: items, total },
});

describe('usePaginatedList', () => {
  beforeEach(() => vi.clearAllMocks());

  it('starts with loading=true and fetches first page', async () => {
    api.get.mockResolvedValue(wishlistResponse([{ id: 'a' }], 1));
    const { result } = renderHook(() => usePaginatedList('/wishlist'));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.total).toBe(1);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.page).toBe(0);
  });

  it('sets error on fetch failure', async () => {
    api.get.mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => usePaginatedList('/wishlist'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Failed to load.');
    expect(result.current.items).toHaveLength(0);
  });

  it('calls correct endpoint with limit and offset', async () => {
    api.get.mockResolvedValue(wishlistResponse([], 0));
    renderHook(() => usePaginatedList('/wishlist'));
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/wishlist?limit=10&offset=0'));
  });

  it('nextPage increments page and fetches with correct offset', async () => {
    api.get.mockResolvedValue(wishlistResponse([{ id: 'a' }], 20));
    const { result } = renderHook(() => usePaginatedList('/wishlist'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    api.get.mockResolvedValue(wishlistResponse([{ id: 'b' }], 20));
    act(() => result.current.nextPage());
    await waitFor(() => expect(result.current.page).toBe(1));
    expect(api.get).toHaveBeenCalledWith('/wishlist?limit=10&offset=10');
  });

  it('prevPage does not go below page 0', async () => {
    api.get.mockResolvedValue(wishlistResponse([], 0));
    const { result } = renderHook(() => usePaginatedList('/wishlist'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.prevPage());
    expect(result.current.page).toBe(0);
  });

  it('lastPage jumps to the last page', async () => {
    api.get.mockResolvedValue(wishlistResponse([{ id: 'a' }], 25));
    const { result } = renderHook(() => usePaginatedList('/wishlist'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    api.get.mockResolvedValue(wishlistResponse([{ id: 'z' }], 25));
    act(() => result.current.lastPage());
    await waitFor(() => expect(result.current.page).toBe(2));
    expect(api.get).toHaveBeenCalledWith('/wishlist?limit=10&offset=20');
  });

  it('firstPage resets to page 0', async () => {
    api.get.mockResolvedValue(wishlistResponse([{ id: 'a' }], 25));
    const { result } = renderHook(() => usePaginatedList('/wishlist'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.nextPage());
    await waitFor(() => expect(result.current.page).toBe(1));
    act(() => result.current.firstPage());
    await waitFor(() => expect(result.current.page).toBe(0));
  });

  it('setLimit resets to page 0 and refetches', async () => {
    api.get.mockResolvedValue(wishlistResponse([{ id: 'a' }], 30));
    const { result } = renderHook(() => usePaginatedList('/wishlist'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.nextPage());
    await waitFor(() => expect(result.current.page).toBe(1));

    api.get.mockResolvedValue(wishlistResponse([{ id: 'a' }], 30));
    act(() => result.current.setLimit(25));
    await waitFor(() => expect(result.current.page).toBe(0));
    expect(api.get).toHaveBeenCalledWith('/wishlist?limit=25&offset=0');
  });

  it('setLimit clamps to MAX_LIMIT of 25', async () => {
    api.get.mockResolvedValue(wishlistResponse([], 0));
    const { result } = renderHook(() => usePaginatedList('/wishlist'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setLimit(999));
    expect(result.current.limit).toBe(25);
  });

  it('removeItem removes the item and decrements total', async () => {
    api.get.mockResolvedValue(wishlistResponse([{ id: 'a' }, { id: 'b' }], 2));
    const { result } = renderHook(() => usePaginatedList('/wishlist'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.removeItem('a'));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).toBe('b');
    expect(result.current.total).toBe(1);
  });

  it('computes totalPages correctly', async () => {
    api.get.mockResolvedValue(wishlistResponse([], 25));
    const { result } = renderHook(() => usePaginatedList('/wishlist'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.totalPages).toBe(3);
  });
});
